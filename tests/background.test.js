// Tests for background script functionality
describe('Background Script Tests', () => {
    let mockChrome;
    
    beforeEach(() => {
        // Mock chrome API
        mockChrome = {
            runtime: {
                onMessage: {
                    addListener: jest.fn()
                }
            }
        };
        global.chrome = mockChrome;
        
        // Mock fetch
        global.fetch = jest.fn();
    });

    test('should handle API errors gracefully', async () => {
        const { handle_gemini_request } = require('../background.js');
        
        // Mock API error
        fetch.mockImplementationOnce(() => Promise.reject(new Error('API Error')));
        
        const result = await handle_gemini_request('test query');
        expect(result).toBeNull();
    });

    test('should handle successful API response', async () => {
        const { handle_gemini_request } = require('../background.js');
        
        // Mock successful API response
        const mockResponse = {
            candidates: [{
                content: {
                    parts: [{
                        text: 'Generated text'
                    }]
                }
            }]
        };
        
        fetch.mockImplementationOnce(() => Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockResponse)
        }));
        
        const result = await handle_gemini_request('test query');
        expect(result).toBe('Generated text');
    });
});
