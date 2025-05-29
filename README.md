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
