// Gemini API utility function for making requests with custom API key
const makeGeminiRequestWithKey = async (query, apiKey, timeout = 35000) => {
    const apiURL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    
    if (!query || typeof query !== 'string') {
        return { success: false, error: 'Invalid query: must be a non-empty string' };
    }

    if (!apiKey || apiKey === "[GEMINI_API_KEY]") {
        return { success: false, error: 'Please configure your Gemini API key' };
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
                        text: query
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
                errorMessage = "Authentication error. Please check your API key.";
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
}

export { makeGeminiRequestWithKey };