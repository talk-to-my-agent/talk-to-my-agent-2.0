chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed successfully.");
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'generate') {
        console.log("Request received to generate response");;
        console.table({
            jobDescription: request.data.jobDescription,
            careerGoals: request.data.careerGoals
        })

        sendResponse({
            success: true,
            data: {
                message: "Request received and processed successfully."
            }
        });

        return true;
    }
});

// Talk to Gemini
const handle_gemini_request =  async (query) => {
    const cv_content = parse_cv_content();
    const apiKey = "test"
    const apiURL = `geminiurl${apiKey}`

    // Make the query to gemini API
    // Use fetch to fetch contet    
    try {
        const response = await fetch(apiURL, {
            method: "post",
            headers: {
                'Content-type':'application/json',
            },
            body: JSON.stringify({
                contents: [
                    {parts: [{
                        text: query
                    }]}
                ]
            })
        });

        if(!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Gemini API Response:", data);

        const generatedText = data.candidates?[0]?.content?.parts[0]?.text : "No response from Gemini";
        return generatedText
    } catch(error) {
        console.error("Error making Gemini API request: ", error);

        return null;
    }

}


// Handle CV

const parse_cv_content = () => {
    // Return CV content as text
}