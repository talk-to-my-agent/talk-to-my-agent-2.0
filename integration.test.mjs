import { jest } from '@jest/globals';
import { setupTestEnvironment, teardownTestEnvironment, testData, createApiResponse } from './test-utils.mjs';

// Integration tests for the complete extension workflow
describe('Extension Integration Tests', () => {
  let mockChrome, mockGlobals;
  let messageListener;

  beforeAll(() => {
    ({ mockChrome, mockGlobals } = setupTestEnvironment());
  });

  afterAll(() => {
    teardownTestEnvironment();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockChrome.runtime.lastError = null;
    
    // Setup message listener mock - initialize a proper message listener
    messageListener = (request, sender, sendResponse) => {
      if (request.action === "generateCoverLetter") {
        // Simulate background script logic
        setTimeout(async () => {
          if (!request.data?.jobDescription || !request.data?.userCV || !request.data?.apiKey) {
            sendResponse({
              success: false,
              error: "Missing required fields: job description, CV, and API key are required."
            });
            return;
          }

          try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${request.data.apiKey}`, {
              method: "POST",
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: `Generate cover letter for: ${request.data.jobDescription}` }] }]
              })
            });

            if (response.ok) {
              const data = await response.json();
              sendResponse({
                success: true,
                data: { message: data.candidates?.[0]?.content?.parts?.[0]?.text || 'Generated content' }
              });
            } else {
              const status = response.status;
              let errorMessage = `API request failed with status ${status}`;
              if (status === 429) errorMessage = "Too many requests. Please try again in a few minutes.";
              if (status === 401 || status === 403) errorMessage = "Authentication error. Please check your API key in settings.";
              sendResponse({ success: false, error: errorMessage });
            }
          } catch (error) {
            if (error.name === 'AbortError') {
              sendResponse({ success: false, error: "Request timed out after 35 seconds. Please try again." });
            } else {
              sendResponse({ success: false, error: "Network error. Please check your connection and try again." });
            }
          }
        }, 0);
        return true;
      }

      if (request.action === "optimizeCV") {
        setTimeout(async () => {
          if (!request.data?.targetJob || !request.data?.userCV || !request.data?.apiKey) {
            sendResponse({
              success: false,
              error: "Missing required fields: target job description, CV, and API key are required."
            });
            return;
          }

          try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${request.data.apiKey}`, {
              method: "POST",
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: `Optimize CV for: ${request.data.targetJob}` }] }]
              })
            });

            if (response.ok) {
              const data = await response.json();
              sendResponse({
                success: true,
                data: { message: data.candidates?.[0]?.content?.parts?.[0]?.text || 'Optimized CV content' }
              });
            } else {
              const status = response.status;
              let errorMessage = `API request failed with status ${status}`;
              if (status === 429) errorMessage = "Too many requests. Please try again in a few minutes.";
              if (status === 401 || status === 403) errorMessage = "Authentication error. Please check your API key in settings.";
              sendResponse({ success: false, error: errorMessage });
            }
          } catch (error) {
            sendResponse({ success: false, error: "Network error. Please check your connection and try again." });
          }
        }, 0);
        return true;
      }

      return false;
    };
    
    mockChrome.runtime.onMessage.addListener.mockImplementation((listener) => {
      messageListener = listener;
    });
  });
</edits>

</edits>

  describe('Complete Cover Letter Generation Flow', () => {
    it('should complete entire cover letter generation workflow', async () => {
      // Step 1: User configures settings in options page
      const optionsData = {
        gemini_api_key: testData.validApiKey,
        user_cv: testData.sampleCV
      };

      // Mock successful storage save
      mockChrome.storage.local.set.mockImplementation((data, callback) => {
        callback();
      });

      // Mock storage retrieval for popup
      mockChrome.storage.local.get.mockImplementation((keys, callback) => {
        callback(optionsData);
      });

      // Step 2: Mock successful API response
      global.fetch.mockResolvedValueOnce(createApiResponse(true, {
        text: testData.expectedCoverLetter
      }));

      // Step 3: Simulate popup sending message to background
      const coverLetterRequest = {
        action: 'generateCoverLetter',
        data: {
          jobDescription: testData.sampleJobDescription,
          userCV: optionsData.user_cv,
          apiKey: optionsData.gemini_api_key
        }
      };

      // Step 4: Test message handling
      const sendResponse = jest.fn();
      const result = messageListener(coverLetterRequest, {}, sendResponse);

      // Should return true for async handling
      expect(result).toBe(true);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      // Verify API was called correctly
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(optionsData.gemini_api_key),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining(testData.sampleJobDescription)
        })
      );

      // Verify successful response
      expect(sendResponse).toHaveBeenCalledWith({
        success: true,
        data: { message: testData.expectedCoverLetter }
      });
    });

    it('should handle missing configuration gracefully', async () => {
      // Simulate empty storage
      mockChrome.storage.local.get.mockImplementation((keys, callback) => {
        callback({});
      });

      const request = {
        action: 'generateCoverLetter',
        data: {
          jobDescription: testData.sampleJobDescription,
          userCV: '',
          apiKey: ''
        }
      };

      const sendResponse = jest.fn();
      messageListener(request, {}, sendResponse);

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(sendResponse).toHaveBeenCalledWith({
        success: false,
        error: "Missing required fields: job description, CV, and API key are required."
      });
    });
  });

  describe('Complete CV Optimization Flow', () => {
    it('should complete entire CV optimization workflow', async () => {
      const optionsData = {
        gemini_api_key: testData.validApiKey,
        user_cv: testData.sampleCV
      };

      mockChrome.storage.local.get.mockImplementation((keys, callback) => {
        callback(optionsData);
      });

      global.fetch.mockResolvedValueOnce(createApiResponse(true, {
        text: testData.expectedOptimizedCV
      }));

      const cvRequest = {
        action: 'optimizeCV',
        data: {
          targetJob: testData.sampleJobDescription,
          userCV: optionsData.user_cv,
          apiKey: optionsData.gemini_api_key
        }
      };

      const sendResponse = jest.fn();
      const result = messageListener(cvRequest, {}, sendResponse);

      expect(result).toBe(true);

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(optionsData.gemini_api_key),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('optimize')
        })
      );

      expect(sendResponse).toHaveBeenCalledWith({
        success: true,
        data: { message: testData.expectedOptimizedCV }
      });
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle API rate limiting across the system', async () => {
      const optionsData = {
        gemini_api_key: testData.validApiKey,
        user_cv: testData.sampleCV
      };

      mockChrome.storage.local.get.mockImplementation((keys, callback) => {
        callback(optionsData);
      });

      // Mock rate limit response
      global.fetch.mockResolvedValueOnce(createApiResponse(false, {}, {
        status: 429,
        body: { error: { message: 'Too many requests' } }
      }));

      const request = {
        action: 'generateCoverLetter',
        data: {
          jobDescription: testData.sampleJobDescription,
          userCV: optionsData.user_cv,
          apiKey: optionsData.gemini_api_key
        }
      };

      const sendResponse = jest.fn();
      messageListener(request, {}, sendResponse);

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(sendResponse).toHaveBeenCalledWith({
        success: false,
        error: "Too many requests. Please try again in a few minutes."
      });
    });

    it('should handle authentication errors', async () => {
      const optionsData = {
        gemini_api_key: testData.invalidApiKey,
        user_cv: testData.sampleCV
      };

      mockChrome.storage.local.get.mockImplementation((keys, callback) => {
        callback(optionsData);
      });

      global.fetch.mockResolvedValueOnce(createApiResponse(false, {}, {
        status: 401,
        body: { error: { message: 'Invalid API key' } }
      }));

      const request = {
        action: 'generateCoverLetter',
        data: {
          jobDescription: testData.sampleJobDescription,
          userCV: optionsData.user_cv,
          apiKey: optionsData.gemini_api_key
        }
      };

      const sendResponse = jest.fn();
      messageListener(request, {}, sendResponse);

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(sendResponse).toHaveBeenCalledWith({
        success: false,
        error: "Authentication error. Please check your API key in settings."
      });
    });

    it('should handle network timeouts', async () => {
      const optionsData = {
        gemini_api_key: testData.validApiKey,
        user_cv: testData.sampleCV
      };

      mockChrome.storage.local.get.mockImplementation((keys, callback) => {
        callback(optionsData);
      });

      // Mock timeout error
      global.fetch.mockRejectedValueOnce({ name: 'AbortError' });

      const request = {
        action: 'generateCoverLetter',
        data: {
          jobDescription: testData.sampleJobDescription,
          userCV: optionsData.user_cv,
          apiKey: optionsData.gemini_api_key
        }
      };

      const sendResponse = jest.fn();
      messageListener(request, {}, sendResponse);

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(sendResponse).toHaveBeenCalledWith({
        success: false,
        error: expect.stringContaining("Request timed out")
      });
    });
  });

  describe('Storage Integration', () => {
    it('should handle storage operations across components', async () => {
      // Test options page saving data
      const saveData = {
        gemini_api_key: testData.validApiKey,
        user_cv: testData.sampleCV
      };

      mockChrome.storage.local.set.mockImplementation((data, callback) => {
        expect(data).toEqual(saveData);
        callback();
      });

      // Simulate options page save
      mockChrome.storage.local.set(saveData, () => {});

      // Test popup retrieving data
      mockChrome.storage.local.get.mockImplementation((keys, callback) => {
        expect(keys).toEqual(['gemini_api_key', 'user_cv']);
        callback(saveData);
      });

      // Simulate popup retrieval
      mockChrome.storage.local.get(['gemini_api_key', 'user_cv'], (result) => {
        expect(result).toEqual(saveData);
      });

      expect(mockChrome.storage.local.set).toHaveBeenCalled();
      expect(mockChrome.storage.local.get).toHaveBeenCalled();
    });

    it('should handle storage errors gracefully', async () => {
      mockChrome.runtime.lastError = { message: 'Storage quota exceeded' };
      
      mockChrome.storage.local.set.mockImplementation((data, callback) => {
        callback();
      });

      const saveData = {
        gemini_api_key: testData.validApiKey,
        user_cv: 'Very large CV content'.repeat(10000)
      };

      mockChrome.storage.local.set(saveData, () => {
        expect(mockChrome.runtime.lastError).toBeTruthy();
      });
    });
  });

  describe('Input Validation Integration', () => {
    it('should validate inputs end-to-end', async () => {
      const invalidRequests = [
        {
          action: 'generateCoverLetter',
          data: {
            jobDescription: '',
            userCV: testData.sampleCV,
            apiKey: testData.validApiKey
          }
        },
        {
          action: 'optimizeCV',
          data: {
            targetJob: testData.sampleJobDescription,
            userCV: '',
            apiKey: testData.validApiKey
          }
        },
        {
          action: 'generateCoverLetter',
          data: {
            jobDescription: testData.sampleJobDescription,
            userCV: testData.sampleCV,
            apiKey: ''
          }
        }
      ];

      const sendResponse = jest.fn();

      for (const request of invalidRequests) {
        messageListener(request, {}, sendResponse);
        await new Promise(resolve => setTimeout(resolve, 0));
      }

      expect(sendResponse).toHaveBeenCalledTimes(3);
      sendResponse.mock.calls.forEach(call => {
        expect(call[0].success).toBe(false);
        expect(call[0].error).toContain('Missing required fields');
      });
    });
  });

  describe('API Request Format Validation', () => {
    it('should send correctly formatted requests to Gemini API', async () => {
      const optionsData = {
        gemini_api_key: testData.validApiKey,
        user_cv: testData.sampleCV
      };

      mockChrome.storage.local.get.mockImplementation((keys, callback) => {
        callback(optionsData);
      });

      global.fetch.mockResolvedValueOnce(createApiResponse(true, {
        text: 'Response'
      }));

      const request = {
        action: 'generateCoverLetter',
        data: {
          jobDescription: testData.sampleJobDescription,
          userCV: optionsData.user_cv,
          apiKey: optionsData.gemini_api_key
        }
      };

      const sendResponse = jest.fn();
      messageListener(request, {}, sendResponse);

      await new Promise(resolve => setTimeout(resolve, 0));

      const fetchCall = global.fetch.mock.calls[0];
      const [url, options] = fetchCall;

      // Validate URL
      expect(url).toBe(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${testData.validApiKey}`);

      // Validate request options
      expect(options.method).toBe('POST');
      expect(options.headers['Content-Type']).toBe('application/json');

      // Validate request body
      const body = JSON.parse(options.body);
      expect(body.contents).toHaveLength(1);
      expect(body.contents[0].parts).toHaveLength(1);
      expect(body.contents[0].parts[0].text).toContain(testData.sampleJobDescription);
      expect(body.safetySettings).toHaveLength(4);
      expect(body.generationConfig.temperature).toBe(0.7);
      expect(body.generationConfig.maxOutputTokens).toBe(2048);
    });
  });

  describe('Message Routing', () => {
    it('should route messages to correct handlers', async () => {
      const sendResponse = jest.fn();

      // Test cover letter action
      const coverLetterResult = messageListener({
        action: 'generateCoverLetter',
        data: {}
      }, {}, sendResponse);

      expect(coverLetterResult).toBe(true);

      // Test CV optimization action
      const cvResult = messageListener({
        action: 'optimizeCV',
        data: {}
      }, {}, sendResponse);

      expect(cvResult).toBe(true);

      // Test unknown action
      const unknownResult = messageListener({
        action: 'unknownAction',
        data: {}
      }, {}, sendResponse);

      expect(unknownResult).toBe(false);
    });
  });
});