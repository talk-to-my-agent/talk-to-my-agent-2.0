chrome.runtime.onInstalled.addListener(() => {
  console.log("Talk to My Agent 2.0 extension installed successfully.");
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Background script received message:", request.action);

  if (request.action === "generateCoverLetter") {
    handleCoverLetterGeneration(request, sendResponse);
    return true; // Keep message channel open for async response
  }

  if (request.action === "optimizeCV") {
    handleCVOptimization(request, sendResponse);
    return true; // Keep message channel open for async response
  }

  // Legacy support for old action
  if (request.action === "generate") {
    handleLegacyGeneration(request, sendResponse);
    return true;
  }
});

async function handleCoverLetterGeneration(request, sendResponse) {
  try {
    // Validate input data
    if (!request.data?.jobDescription || !request.data?.userCV || !request.data?.apiKey) {
      sendResponse({
        success: false,
        error: "Missing required fields: job description, CV, and API key are required."
      });
      return;
    }

    const prompt = `You are a professional career consultant. Create a compelling cover letter based on the following:

JOB DESCRIPTION:
${request.data.jobDescription}

CANDIDATE'S CV:
${request.data.userCV}

Instructions:
- Write a professional, personalized cover letter
- Highlight relevant experience from the CV that matches the job requirements
- Show enthusiasm for the specific role and company
- Keep it concise (3-4 paragraphs)
- Use professional tone but make it engaging
- Include specific examples from the CV when possible

Please write the cover letter now:`;

    const result = await makeGeminiRequest(prompt, request.data.apiKey);
    
    if (result.success) {
      sendResponse({
        success: true,
        data: { message: result.content }
      });
    } else {
      sendResponse({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error("Error in cover letter generation:", error);
    sendResponse({
      success: false,
      error: "An unexpected error occurred during cover letter generation."
    });
  }
}

async function handleCVOptimization(request, sendResponse) {
  try {
    // Validate input data
    if (!request.data?.targetJob || !request.data?.userCV || !request.data?.apiKey) {
      sendResponse({
        success: false,
        error: "Missing required fields: target job description, CV, and API key are required."
      });
      return;
    }

    const prompt = `You are an expert CV optimization consultant. Optimize the following CV for the target job description:

TARGET JOB DESCRIPTION:
${request.data.targetJob}

CURRENT CV:
${request.data.userCV}

Instructions:
- Optimize the CV content to better match the target job requirements
- Highlight relevant skills, experience, and achievements
- Use industry-relevant keywords from the job description
- Maintain the original structure but improve content relevance
- Make specific sections more impactful for this role
- Ensure all information remains truthful to the original CV
- Format as clean, readable text that can be easily copied

Please provide the optimized CV:`;

    const result = await makeGeminiRequest(prompt, request.data.apiKey);
    
    if (result.success) {
      sendResponse({
        success: true,
        data: { message: result.content }
      });
    } else {
      sendResponse({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error("Error in CV optimization:", error);
    sendResponse({
      success: false,
      error: "An unexpected error occurred during CV optimization."
    });
  }
}

async function handleLegacyGeneration(request, sendResponse) {
  try {
    if (!request.data?.jobDescription || !request.data?.careerGoals) {
      sendResponse({
        success: false,
        error: "Missing required fields: job description and career goals are required."
      });
      return;
    }

    const prompt = `Please write a professional cover letter based on the following job description and career goals:

Job Description:
${request.data.jobDescription}

Career Goals:
${request.data.careerGoals}

Please write a compelling cover letter that connects my career goals with the job requirements.`;

    // Use default API key for legacy support
    const apiKey = "[GEMINI_API_KEY]";
    const result = await makeGeminiRequest(prompt, apiKey);
    
    if (result.success) {
      sendResponse({
        success: true,
        data: { message: result.content }
      });
    } else {
      sendResponse({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error("Error in legacy generation:", error);
    sendResponse({
      success: false,
      error: "An unexpected error occurred during generation."
    });
  }
}

async function makeGeminiRequest(prompt, apiKey, timeout = 35000) {
  const apiURL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  
  if (!prompt || typeof prompt !== 'string') {
    return { success: false, error: 'Invalid prompt: must be a non-empty string' };
  }

  if (!apiKey || apiKey === "[GEMINI_API_KEY]") {
    return { success: false, error: 'Please configure your Gemini API key in settings' };
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
            text: prompt
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
        errorMessage = "Authentication error. Please check your API key in settings.";
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
    
    console.error("Gemini API request error:", error);
    return { 
      success: false, 
      error: "Network error. Please check your connection and try again." 
    };
  }
}