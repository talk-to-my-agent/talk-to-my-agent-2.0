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
});