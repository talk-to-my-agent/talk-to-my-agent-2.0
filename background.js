import { makeGeminiRequestWithKey } from './gemini.js';

chrome.runtime.onInstalled.addListener(() => {
  console.log("Talk to My Agent 2.0 extension installed successfully.");
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "generateCoverLetter" || request.action === "optimizeCV") {
    // Handle the message asynchronously
    (async () => {
      try {
        const handler = request.action === "generateCoverLetter" 
          ? handleCoverLetterGeneration 
          : handleCVOptimization;

        const result = await handler(request.data);
        sendResponse(result);
      } catch (error) {
        sendResponse({
          success: false,
          error: error.message || "An unexpected error occurred"
        });
      }
    })();
    return true; // Keep the message channel open
  }
  return false;
});

async function handleCoverLetterGeneration(data) {
  if (!data?.jobDescription || !data?.userCV || !data?.apiKey) {
    return {
      success: false,
      error: "Missing required fields: job description, CV, and API key are required."
    };
  }

  const prompt = `You are a professional career consultant. Create a compelling cover letter based on the following:

JOB DESCRIPTION:
${data.jobDescription}

CANDIDATE'S CV:
${data.userCV}

Instructions:
- Write a professional, personalized cover letter
- Highlight relevant experience from the CV that matches the job requirements
- Show enthusiasm for the specific role and company
- Keep it concise (3-4 paragraphs)
- Use professional tone but make it engaging
- Include specific examples from the CV when possible

Please write the cover letter now:`;

  const result = await makeGeminiRequestWithKey(prompt, data.apiKey);
  return result.success ? {
    success: true,
    data: { message: result.content }
  } : {
    success: false,
    error: result.error
  };
}

async function handleCVOptimization(data) {
  if (!data?.targetJob || !data?.userCV || !data?.apiKey) {
    return {
      success: false,
      error: "Missing required fields: target job description, CV, and API key are required."
    };
  }

  const prompt = `You are an expert CV optimization consultant. Optimize the following CV for the target job description:

TARGET JOB DESCRIPTION:
${data.targetJob}

CURRENT CV:
${data.userCV}

Instructions:
- Optimize the CV content to better match the target job requirements
- Highlight relevant skills, experience, and achievements
- Use industry-relevant keywords from the job description
- Maintain the original structure but improve content relevance
- Make specific sections more impactful for this role
- Ensure all information remains truthful to the original CV
- Format as clean, readable text that can be easily copied

Please provide the optimized CV:`;

  const result = await makeGeminiRequestWithKey(prompt, data.apiKey);
  return result.success ? {
    success: true,
    data: { message: result.content }
  } : {
    success: false,
    error: result.error
  };
}



