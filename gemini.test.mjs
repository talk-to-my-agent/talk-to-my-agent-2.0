import { handle_gemini_request } from './gemini.js';

describe('handle_gemini_request', () => {
    it('throws an error for empty query', async () => {
        await expect(handle_gemini_request('')).rejects.toThrow('Invalid query: Query must be a non-empty string');
    });

    it('throws an error for non-string query', async () => {
        await expect(handle_gemini_request(123)).rejects.toThrow('Invalid query: Query must be a non-empty string');
    });
});