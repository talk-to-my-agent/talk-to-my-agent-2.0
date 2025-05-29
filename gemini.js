// Extracted Gemini API handler

const handle_gemini_request = async (query, timeout = 35000) => {
    let timeOutError = false;
    const apiKey = "[GEMINI_API_KEY]"; // Replace with your actual Gemini API key
    const apiURL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    
    // Input validation
    if (!query || typeof query !== 'string') {
        throw new Error('Invalid query: Query must be a non-empty string');
    }

    // Make the query to Gemini API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
        controller.abort();
        timeOutError = true;
        console.error(`Request timed out after ${timeout}ms`);
    }, timeout);

    try {
        const response = await fetch(apiURL, {
            method: "POST",
            headers: {
                'Content-type': 'application/json',
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [{
                            text: query
                        }]
                    }
                ],
                safetySettings: [
                    {
                        category: "HARM_CATEGORY_HARASSMENT",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    }
                ]
            }),
            signal: controller.signal
        });

        const data = await response.json();
        console.log("Gemini API Response:", data);

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
            return "No response from Gemini";
        }

        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error(`Error making Gemini API request: ${error.message}`);
        if (timeOutError) {
            throw new Error(`Request timed out after ${timeout}ms`);
        }
        return null; // Return null for network errors or other issues
    } finally {
        clearTimeout(timeoutId);
    }
}

export { handle_gemini_request };