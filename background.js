chrome.runtime.onInstalled.addListener(() => {
    console.log("Extension installed successfully.");
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'generate') {
        console.log("Request received to generate response");
        
        // Validate input data
        if (!request.data?.jobDescription || !request.data?.careerGoals) {
            sendResponse({
                success: false,
                error: "Missing required fields: job description and career goals are required."
            });
            return true;
        }

        // Log the request data
        console.table({
            jobDescription: request.data.jobDescription.substring(0, 100) + "...",
            careerGoals: request.data.careerGoals.substring(0, 100) + "..."
        });

        // Prepare the prompt with both job description and career goals
        const prompt = `Please write a professional cover letter based on the following job description and career goals:

Job Description:
${request.data.jobDescription}

Career Goals:
${request.data.careerGoals}

Please write a compelling cover letter that connects my career goals with the job requirements.`;

        // Use promises syntax to handle the asynchronous instead of async/await
        handle_gemini_request(prompt)
            .then(generatedCoverLetter => {
                if (!generatedCoverLetter) {
                    throw new Error("No response from Gemini API");
                }
                
                return {
                    success: true,
                    data: {
                        message: generatedCoverLetter,
                    }
                };
            })
            .catch(error => {
                console.error("Error during cover letter generation:", error);
                let errorMessage = "An error occurred during cover letter generation.";
                
                // Provide more specific error messages
                if (error.message.includes("429")) {
                    errorMessage = "Too many requests. Please try again in a few minutes.";
                } else if (error.message.includes("401")) {
                    errorMessage = "Authentication error. Please check your API key.";
                } else if (error.message.includes("No response")) {
                    errorMessage = "The AI model did not generate a response. Please try again.";
                }
                
                return {
                    success: false,
                    error: errorMessage
                };
            })
            .then(response => {
                console.log("Sending response back to popup:", 
                    response.success ? "Success" : "Error: " + response.error);
                sendResponse(response);
            });

        return true; // Indicates that the response will be sent asynchronously
    }
});

// Talk to Gemini
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
