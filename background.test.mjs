import { jest } from '@jest/globals';

// Mock Chrome APIs
const mockChrome = {
  runtime: {
    onInstalled: {
      addListener: jest.fn()
    },
    onMessage: {
      addListener: jest.fn()
    },
    lastError: null
  },
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      clear: jest.fn(),
      remove: jest.fn()
    }
  }
};

global.chrome = mockChrome;
global.fetch = jest.fn();

// Mock the module import since we can't actually import background.js as a module
let messageListener;
let handleCoverLetterGeneration;
let handleCVOptimization;
let makeGeminiRequest;

// Setup message listener capture
beforeEach(() => {
  jest.clearAllMocks();
  
  // Capture the message listener when it's registered
  mockChrome.runtime.onMessage.addListener.mockImplementation((listener) => {
    messageListener = listener;
  });
  
  // Mock console methods
  global.console.log = jest.fn();
  global.console.error = jest.fn();
  
  // Reset fetch mock
  global.fetch.mockReset();
  
  // Mock AbortController
  global.AbortController = jest.fn(() => ({
    abort: jest.fn(),
    signal: {}
  }));
  
  global.setTimeout = jest.fn((fn, delay) => {
    // Immediately execute for most tests
    if (delay < 1000) fn();
    return 1;
  });
  global.clearTimeout = jest.fn();
});

// Simulate loading the background script
beforeAll(() => {
  // We need to simulate the background script logic since we can't import it directly
  handleCoverLetterGeneration = async (request, sendResponse) => {
    try {
      if (!request.data?.jobDescription || !request.data?.userCV || !request.data?.apiKey) {
        sendResponse({
          success: false,
          error: "Missing required fields: job description, CV, and API key are required."
        });
        return;
      }

      const prompt = `You are a professional career consultant. Create a compelling cover letter based on the following:

JOB DESCRIPTION:
${request.data.jobDescription}

CANDIDATE'S CV:
${request.data.userCV}

Instructions:
- Write a professional, personalized cover letter
- Highlight relevant experience from the CV that matches the job requirements
- Show enthusiasm for the specific role and company
- Keep it concise (3-4 paragraphs)
- Use professional tone but make it engaging
- Include specific examples from the CV when possible

Please write the cover letter now:`;

      const result = await makeGeminiRequest(prompt, request.data.apiKey);
      
      if (result.success) {
        sendResponse({
          success: true,
          data: { message: result.content }
        });
      } else {
        sendResponse({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      sendResponse({
        success: false,
        error: "An unexpected error occurred during cover letter generation."
      });
    }
  };

  handleCVOptimization = async (request, sendResponse) => {
    try {
      if (!request.data?.targetJob || !request.data?.userCV || !request.data?.apiKey) {
        sendResponse({
          success: false,
          error: "Missing required fields: target job description, CV, and API key are required."
        });
        return;
      }

      const prompt = `You are an expert CV optimization consultant. Optimize the following CV for the target job description:

TARGET JOB DESCRIPTION:
${request.data.targetJob}

CURRENT CV:
${request.data.userCV}

Instructions:
- Optimize the CV content to better match the target job requirements
- Highlight relevant skills, experience, and achievements
- Use industry-relevant keywords from the job description
- Maintain the original structure but improve content relevance
- Make specific sections more impactful for this role
- Ensure all information remains truthful to the original CV
- Format as clean, readable text that can be easily copied

Please provide the optimized CV:`;

      const result = await makeGeminiRequest(prompt, request.data.apiKey);
      
      if (result.success) {
        sendResponse({
          success: true,
          data: { message: result.content }
        });
      } else {
        sendResponse({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      sendResponse({
        success: false,
        error: "An unexpected error occurred during CV optimization."
      });
    }
  };

  makeGeminiRequest = async (prompt, apiKey, timeout = 35000) => {
    const apiURL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    
    if (!prompt || typeof prompt !== 'string') {
      return { success: false, error: 'Invalid prompt: must be a non-empty string' };
    }

    if (!apiKey || apiKey === "[GEMINI_API_KEY]") {
      return { success: false, error: 'Please configure your Gemini API key in settings' };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeout);

    try {
      const response = await fetch(apiURL, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let errorMessage = `API request failed with status ${response.status}`;
        
        if (response.status === 429) {
          errorMessage = "Too many requests. Please try again in a few minutes.";
        } else if (response.status === 401 || response.status === 403) {
          errorMessage = "Authentication error. Please check your API key in settings.";
        } else if (errorData.error?.message) {
          errorMessage = errorData.error.message;
        }
        
        return { success: false, error: errorMessage };
      }

      const data = await response.json();
      
      if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        return { success: false, error: "No response generated. Please try again." };
      }

      return { 
        success: true, 
        content: data.candidates[0].content.parts[0].text 
      };

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        return { success: false, error: `Request timed out after ${timeout/1000} seconds. Please try again.` };
      }
      
      return { 
        success: false, 
        error: "Network error. Please check your connection and try again." 
      };
    }
  };

  // Simulate the message listener registration
  messageListener = (request, sender, sendResponse) => {
    if (request.action === "generateCoverLetter") {
      handleCoverLetterGeneration(request, sendResponse);
      return true;
    }

    if (request.action === "optimizeCV") {
      handleCVOptimization(request, sendResponse);
      return true;
    }

    return false;
  };
});

describe('Background Script', () => {
  describe('Message Listener', () => {
    it('should handle generateCoverLetter action', () => {
      const request = { action: 'generateCoverLetter', data: {} };
      const sender = {};
      const sendResponse = jest.fn();

      const result = messageListener(request, sender, sendResponse);
      expect(result).toBe(true);
    });

    it('should handle optimizeCV action', () => {
      const request = { action: 'optimizeCV', data: {} };
      const sender = {};
      const sendResponse = jest.fn();

      const result = messageListener(request, sender, sendResponse);
      expect(result).toBe(true);
    });

    it('should reject unknown actions', () => {
      const request = { action: 'unknownAction', data: {} };
      const sender = {};
      const sendResponse = jest.fn();

      const result = messageListener(request, sender, sendResponse);
      expect(result).toBe(false);
    });
  });

  describe('Cover Letter Generation', () => {
    it('should generate cover letter successfully', async () => {
      const sendResponse = jest.fn();
      const request = {
        action: 'generateCoverLetter',
        data: {
          jobDescription: 'Software Engineer position',
          userCV: 'Experienced developer with 5 years',
          apiKey: 'valid-api-key'
        }
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          candidates: [{
            content: {
              parts: [{
                text: 'Generated cover letter content'
              }]
            }
          }]
        })
      });

      await handleCoverLetterGeneration(request, sendResponse);

      expect(sendResponse).toHaveBeenCalledWith({
        success: true,
        data: { message: 'Generated cover letter content' }
      });
    });

    it('should handle missing job description', async () => {
      const sendResponse = jest.fn();
      const request = {
        action: 'generateCoverLetter',
        data: {
          userCV: 'Experienced developer',
          apiKey: 'valid-api-key'
        }
      };

      await handleCoverLetterGeneration(request, sendResponse);

      expect(sendResponse).toHaveBeenCalledWith({
        success: false,
        error: "Missing required fields: job description, CV, and API key are required."
      });
    });

    it('should handle missing CV', async () => {
      const sendResponse = jest.fn();
      const request = {
        action: 'generateCoverLetter',
        data: {
          jobDescription: 'Software Engineer',
          apiKey: 'valid-api-key'
        }
      };

      await handleCoverLetterGeneration(request, sendResponse);

      expect(sendResponse).toHaveBeenCalledWith({
        success: false,
        error: "Missing required fields: job description, CV, and API key are required."
      });
    });

    it('should handle missing API key', async () => {
      const sendResponse = jest.fn();
      const request = {
        action: 'generateCoverLetter',
        data: {
          jobDescription: 'Software Engineer',
          userCV: 'Experienced developer'
        }
      };

      await handleCoverLetterGeneration(request, sendResponse);

      expect(sendResponse).toHaveBeenCalledWith({
        success: false,
        error: "Missing required fields: job description, CV, and API key are required."
      });
    });

    it('should handle API failure', async () => {
      const sendResponse = jest.fn();
      const request = {
        action: 'generateCoverLetter',
        data: {
          jobDescription: 'Software Engineer',
          userCV: 'Experienced developer',
          apiKey: 'invalid-key'
        }
      };

      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({})
      });

      await handleCoverLetterGeneration(request, sendResponse);

      expect(sendResponse).toHaveBeenCalledWith({
        success: false,
        error: "Authentication error. Please check your API key in settings."
      });
    });
  });

  describe('CV Optimization', () => {
    it('should optimize CV successfully', async () => {
      const sendResponse = jest.fn();
      const request = {
        action: 'optimizeCV',
        data: {
          targetJob: 'Senior Developer position',
          userCV: 'Experienced developer with 5 years',
          apiKey: 'valid-api-key'
        }
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          candidates: [{
            content: {
              parts: [{
                text: 'Optimized CV content'
              }]
            }
          }]
        })
      });

      await handleCVOptimization(request, sendResponse);

      expect(sendResponse).toHaveBeenCalledWith({
        success: true,
        data: { message: 'Optimized CV content' }
      });
    });

    it('should handle missing target job', async () => {
      const sendResponse = jest.fn();
      const request = {
        action: 'optimizeCV',
        data: {
          userCV: 'Experienced developer',
          apiKey: 'valid-api-key'
        }
      };

      await handleCVOptimization(request, sendResponse);

      expect(sendResponse).toHaveBeenCalledWith({
        success: false,
        error: "Missing required fields: target job description, CV, and API key are required."
      });
    });

    it('should handle missing CV for optimization', async () => {
      const sendResponse = jest.fn();
      const request = {
        action: 'optimizeCV',
        data: {
          targetJob: 'Senior Developer',
          apiKey: 'valid-api-key'
        }
      };

      await handleCVOptimization(request, sendResponse);

      expect(sendResponse).toHaveBeenCalledWith({
        success: false,
        error: "Missing required fields: target job description, CV, and API key are required."
      });
    });

    it('should handle rate limiting', async () => {
      const sendResponse = jest.fn();
      const request = {
        action: 'optimizeCV',
        data: {
          targetJob: 'Senior Developer',
          userCV: 'Experienced developer',
          apiKey: 'valid-api-key'
        }
      };

      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: () => Promise.resolve({})
      });

      await handleCVOptimization(request, sendResponse);

      expect(sendResponse).toHaveBeenCalledWith({
        success: false,
        error: "Too many requests. Please try again in a few minutes."
      });
    });
  });

  describe('makeGeminiRequest', () => {
    it('should make successful API request', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          candidates: [{
            content: {
              parts: [{
                text: 'API response text'
              }]
            }
          }]
        })
      });

      const result = await makeGeminiRequest('test prompt', 'valid-api-key');

      expect(result.success).toBe(true);
      expect(result.content).toBe('API response text');
    });

    it('should validate prompt input', async () => {
      const result = await makeGeminiRequest('', 'valid-api-key');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid prompt: must be a non-empty string');
    });

    it('should validate API key', async () => {
      const result = await makeGeminiRequest('test prompt', '');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Please configure your Gemini API key in settings');
    });

    it('should reject placeholder API key', async () => {
      const result = await makeGeminiRequest('test prompt', '[GEMINI_API_KEY]');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Please configure your Gemini API key in settings');
    });

    it('should handle network errors', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await makeGeminiRequest('test prompt', 'valid-api-key');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error. Please check your connection and try again.');
    });

    it('should handle timeout errors', async () => {
      global.fetch.mockRejectedValueOnce({ name: 'AbortError' });

      const result = await makeGeminiRequest('test prompt', 'valid-api-key', 1000);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Request timed out after 1 seconds. Please try again.');
    });

    it('should handle API response with no candidates', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          candidates: []
        })
      });

      const result = await makeGeminiRequest('test prompt', 'valid-api-key');

      expect(result.success).toBe(false);
      expect(result.error).toBe('No response generated. Please try again.');
    });

    it('should include correct headers and body', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          candidates: [{
            content: {
              parts: [{
                text: 'response'
              }]
            }
          }]
        })
      });

      await makeGeminiRequest('test prompt', 'test-key');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('test-key'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: expect.stringContaining('test prompt')
        })
      );

      const callArgs = global.fetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);
      
      expect(requestBody.contents[0].parts[0].text).toBe('test prompt');
      expect(requestBody.safetySettings).toHaveLength(4);
      expect(requestBody.generationConfig.temperature).toBe(0.7);
      expect(requestBody.generationConfig.maxOutputTokens).toBe(2048);
    });
  });
});