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