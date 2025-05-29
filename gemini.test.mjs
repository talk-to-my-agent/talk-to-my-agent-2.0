import { jest } from '@jest/globals';
import { handle_gemini_request } from './gemini.js';


describe('handle_gemini_request', () => {
    it('throws an error for empty query', async () => {
        await expect(handle_gemini_request('')).rejects.toThrow('Invalid query: Query must be a non-empty string');
    });

    it('throws an error for non-string query', async () => {
        await expect(handle_gemini_request(123)).rejects.toThrow('Invalid query: Query must be a non-empty string');
    });

    it('returns a valid response for a valid query', async () => {
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({
                    candidates: [
                        {
                            content: {
                                parts: [
                                    { text: 'Generated cover letter text.' }
                                ]
                            }
                        }
                    ]
                })
            })
        );
        const result = await handle_gemini_request('Write a cover letter for a software engineer position');
        expect(typeof result).toBe('string');
        expect(result).toBe('Generated cover letter text.');
        global.fetch.mockClear();
    });

    it('returns null if Gemini API returns no candidates', async () => {
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
                text: () => Promise.resolve("internal server Error"),
            })
        );
        const result = await handle_gemini_request('Write a cover letter for a software engineer position');
        expect(result).toBeNull();
        global.fetch.mockClear();
    });

    it('cleans up timeout even when request succeeds quickly', async () => {
        jest.useFakeTimers();
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({
                    candidates: [
                        {
                            content: {
                                parts: [
                                    { text: 'Quick response' }
                                ]
                            }
                        }
                    ]
                })
            })
        );

        const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
        
        const promise = handle_gemini_request('Write a cover letter', 2000);
        
        // Advance time a little bit
        jest.advanceTimersByTime(100);
        
        const result = await promise;
        
        expect(result).toBe('Quick response');
        expect(clearTimeoutSpy).toHaveBeenCalled();
        
        clearTimeoutSpy.mockRestore();
        jest.useRealTimers();
        global.fetch.mockClear();
    });

    it('aborts the fetch request when timeout occurs', async () => {
        jest.useFakeTimers();
        const abortSpy = jest.fn();
        const mockController = { abort: abortSpy, signal: {} };
        global.AbortController = jest.fn(() => mockController);

        global.fetch = jest.fn(() => new Promise((resolve) => {
            setTimeout(resolve, 3000);
        }));

        const promise = handle_gemini_request('Write a cover letter', 2000);
        
        jest.advanceTimersByTime(3100); // Advance past the 200ms timeout

        await expect(promise).rejects.toThrow('Request timed out after 2000ms');
        expect(abortSpy).toHaveBeenCalled();
        
        jest.useRealTimers();
        global.fetch.mockClear();
    });

    it('handles malformed API response gracefully', async () => {
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({
                    // Missing the expected structure
                    malformed: true
                })
            })
        );

        const result = await handle_gemini_request('Write a cover letter');
        expect(result).toBe('No response from Gemini');
        global.fetch.mockClear();
    });

    it('handles network errors gracefully', async () => {
        global.fetch = jest.fn(() =>
            Promise.reject(new Error('Network error'))
        );

        const result = await handle_gemini_request('Write a cover letter');
        expect(result).toBeNull();
        global.fetch.mockClear();
    });

    it('verifies safety settings in the API request', async () => {
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({
                    candidates: [{ content: { parts: [{ text: 'Response' }] } }]
                })
            })
        );

        await handle_gemini_request('Write a cover letter');
        
        expect(global.fetch).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                body: expect.stringContaining('"category":"HARM_CATEGORY_HARASSMENT"'),
                headers: expect.objectContaining({
                    'Content-type': 'application/json'
                })
            })
        );
        global.fetch.mockClear();
    });
});