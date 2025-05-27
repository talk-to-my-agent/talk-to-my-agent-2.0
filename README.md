# Talk to My Agent - Chrome Extension

A Chrome Extension that uses AI to help you write cover letters based on job descriptions.

## Installation

1. Clone this repository:
```bash
git clone https://github.com/yourusername/talk-to-my-agent-2.0.git
cd talk-to-my-agent-2.0
```

2. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked"
   - Select the directory where you cloned this repository

## Usage

1. Click on the extension icon in your browser
2. Paste the job description into the input field
3. Add your career goals (optional)
4. Click "Generate" to create your cover letter

## Development

When handling asynchronous operations in Chrome Extensions, proper message passing between the popup and background script is crucial. Here's how it works:

1. The message listener must return `true` to indicate asynchronous response:
```javascript
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Start async operation
    handleAsyncOperation()
        .then(...)
        .catch(...);
        
    return true; // Keep message port open
});
```

### Promise Chain Structure

The proper way to handle async operations and responses:

```javascript
handleAsyncOperation(request.data)
    .then(result => {
        // Handle success
        return { 
            success: true, 
            data: { message: result } 
        };
    })
    .catch(error => {
        // Handle error
        return { 
            success: false, 
            error: error.message 
        };
    })
    .then(response => {
        // Single point of response
        sendResponse(response);
    });
```

### Why This Pattern?

1. **Proper Error Handling**: The `.catch()` block ensures errors are properly caught and formatted
2. **Consistent Response Format**: Both success and error cases return the same response structure
3. **Single Response Point**: Using a final `.then()` ensures the response is sent in one place
4. **Message Port Management**: Returning `true` keeps the message port open for async response

### Common Pitfalls

❌ **Don't do this:**
```javascript
// Wrong: Early response
handleAsyncOperation()
    .then(result => {
        sendResponse({ success: true, data: result });  // Response sent before error handling
    })
    .catch(error => {
        // This error response will never be sent!
        return { success: false, error: error.message };
    });
```

✅ **Do this instead:**
```javascript
// Correct: Consolidated response
handleAsyncOperation()
    .then(result => {
        return { success: true, data: result };
    })
    .catch(error => {
        return { success: false, error: error.message };
    })
    .then(response => {
        sendResponse(response);  // Single point of response
    });
```

### Prerequisites

- Node.js (latest LTS version)
- Chrome browser

### Project Structure

```
├── background.js          # Background script
├── manifest.json         # Extension manifest
├── popup/               # Popup UI components
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
└── docs/               # Documentation
    └── ASYNC_HANDLING.md  # Details about async message handling
```

### Technical Documentation

- [Async Message Handling](docs/ASYNC_HANDLING.md) - Details about Promise chains and response handling in Chrome Extensions

## License

See [LICENSE](LICENSE) file for details.
