import { jest } from '@jest/globals';
import { makeGeminiRequestWithKey } from './gemini.js';

describe('makeGeminiRequestWithKey', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        global.fetch = jest.fn();
        global.AbortController = jest.fn(() => ({
            abort: jest.fn(),
            signal: {}
        }));
        global.setTimeout = jest.fn((fn, delay) => fn());
        global.clearTimeout = jest.fn();
    });

    it('returns error for empty query', async () => {
        const result = await makeGeminiRequestWithKey('', 'test-api-key');
        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid query: must be a non-empty string');
    });

    it('returns error for non-string query', async () => {
        const result = await makeGeminiRequestWithKey(123, 'test-api-key');
        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid query: must be a non-empty string');
    });

    it('returns error for missing API key', async () => {
        const result = await makeGeminiRequestWithKey('test query', '');
        expect(result.success).toBe(false);
        expect(result.error).toBe('Please configure your Gemini API key');
    });

    it('returns error for placeholder API key', async () => {
        const result = await makeGeminiRequestWithKey('test query', '[GEMINI_API_KEY]');
        expect(result.success).toBe(false);
        expect(result.error).toBe('Please configure your Gemini API key');
    });

    it('returns success for valid request', async () => {
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({
                    candidates: [{
                        content: {
                            parts: [{
                                text: 'Generated response text.'
                            }]
                        }
                    }]
                })
            })
        );

        const result = await makeGeminiRequestWithKey('Write a test response', 'valid-api-key');
        expect(result.success).toBe(true);
        expect(result.content).toBe('Generated response text.');
    });

    it('handles API rate limiting (429 error)', async () => {
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: false,
                status: 429,
                json: () => Promise.resolve({})
            })
        );

        const result = await makeGeminiRequestWithKey('test query', 'valid-api-key');
        expect(result.success).toBe(false);
        expect(result.error).toBe('Too many requests. Please try again in a few minutes.');
    });

    it('handles authentication errors (401/403)', async () => {
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: false,
                status: 401,
                json: () => Promise.resolve({})
            })
        );

        const result = await makeGeminiRequestWithKey('test query', 'invalid-api-key');
        expect(result.success).toBe(false);
        expect(result.error).toBe('Authentication error. Please check your API key.');
    });

    it('handles no response from API', async () => {
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({
                    candidates: []
                })
            })
        );

        const result = await makeGeminiRequestWithKey('test query', 'valid-api-key');
        expect(result.success).toBe(false);
        expect(result.error).toBe('No response generated. Please try again.');
    });

    it('handles network timeout', async () => {
        jest.useFakeTimers();
        const abortSpy = jest.fn();
        global.AbortController = jest.fn(() => ({
            abort: abortSpy,
            signal: {}
        }));

        global.fetch = jest.fn(() => 
            Promise.reject({ name: 'AbortError' })
        );

        const promise = makeGeminiRequestWithKey('test query', 'valid-api-key', 1000);
        
        jest.advanceTimersByTime(1000);
        
        const result = await promise;
        expect(result.success).toBe(false);
        expect(result.error).toContain('Request timed out after 1 seconds');
        
        jest.useRealTimers();
    });

    it('handles network errors gracefully', async () => {
        global.fetch = jest.fn(() =>
            Promise.reject(new Error('Network error'))
        );

        const result = await makeGeminiRequestWithKey('test query', 'valid-api-key');
        expect(result.success).toBe(false);
        expect(result.error).toBe('Network error. Please check your connection and try again.');
    });

    it('sends correct request format to API', async () => {
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({
                    candidates: [{
                        content: {
                            parts: [{
                                text: 'Response'
                            }]
                        }
                    }]
                })
            })
        );

        await makeGeminiRequestWithKey('Test prompt', 'test-api-key');

        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=test-api-key'),
            expect.objectContaining({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: expect.stringContaining('Test prompt')
            })
        );

        const requestBody = JSON.parse(global.fetch.mock.calls[0][1].body);
        expect(requestBody.contents[0].parts[0].text).toBe('Test prompt');
        expect(requestBody.safetySettings).toHaveLength(4);
        expect(requestBody.generationConfig.temperature).toBe(0.7);
        expect(requestBody.generationConfig.maxOutputTokens).toBe(2048);
    });
});