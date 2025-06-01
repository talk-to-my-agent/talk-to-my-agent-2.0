import { handle_gemini_request } from "./gemini.js";

chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed successfully.");
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "generate") {
    console.log("Request received to generate response");

    // Validate input data
    if (!request.data?.jobDescription || !request.data?.careerGoals) {
      sendResponse({
        success: false,
        error:
          "Missing required fields: job description and career goals are required.",
      });
      return true;
    }
    // Log the request data
    console.table({
      jobDescription: request.data.jobDescription.substring(0, 100) + "...",
      careerGoals: request.data.careerGoals.substring(0, 100) + "...",
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
      .then((generatedCoverLetter) => {
        if (!generatedCoverLetter) {
          throw new Error("No response from Gemini API");
        }

        return {
          success: true,
          data: {
            message: generatedCoverLetter,
          },
        };
      })
      .catch((error) => {
        console.error("Error during cover letter generation:", error);
        let errorMessage = "An error occurred during cover letter generation.";

        // Provide more specific error messages
        if (error.message.includes("429")) {
          errorMessage =
            "Too many requests. Please try again in a few minutes.";
        } else if (error.message.includes("401")) {
          errorMessage = "Authentication error. Please check your API key.";
        } else if (error.message.includes("No response")) {
          errorMessage =
            "The AI model did not generate a response. Please try again.";
        }

        return {
          success: false,
          error: errorMessage,
        };
      })
      .then((response) => {
        console.log(
          "Sending response back to popup:",
          response.success ? "Success" : "Error: " + response.error,
        );
        sendResponse(response);
      });

    return true; // Indicates that the response will be sent asynchronously
  }
});
