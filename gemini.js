// Extracted Gemini API handler

const handle_gemini_request = async (query) => {
    const apiKey = "[GEMINI_API_KEY]"; // Replace with your actual Gemini API key
    const apiURL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    
    // Input validation
    if (!query || typeof query !== 'string') {
        throw new Error('Invalid query: Query must be a non-empty string');
    }

    // Make the query to Gemini API with timeout
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout

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

        clearTimeout(timeout);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const data = await response.json();
        console.log("Gemini API Response:", data);

        const generatedText = data.candidates?.[0]?.content?.parts[0]?.text ?? "No response from Gemini";
        return generatedText
    } catch (error) {
        console.error("Error making Gemini API request: ", error);

        return null;
    }
}

export { handle_gemini_request };