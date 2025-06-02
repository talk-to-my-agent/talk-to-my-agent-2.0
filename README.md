# Talk to My Agent 2.0 - Chrome Extension

A powerful Chrome Extension that uses Google's Gemini AI to help you create tailored cover letters and optimize your CV for specific job applications.

## ✨ Features

- **📝 Cover Letter Generation**: Create personalized cover letters based on job descriptions and your CV
- **🚀 CV Optimization**: Tailor your CV content to match specific job requirements
- **💾 Session Storage**: Securely store your API key and CV data during browser sessions
- **🎨 Modern UI**: Clean, responsive interface with tabbed navigation
- **⚙️ Easy Configuration**: Simple settings page for API key and CV management
- **📋 Copy & Edit**: Copy generated content or edit it directly in the interface

## 🛠️ Installation

1. **Clone the repository:**
```bash
git clone https://github.com/yourusername/talk-to-my-agent-2.0.git
cd talk-to-my-agent-2.0
```

2. **Get a Gemini API Key:**
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Keep it secure for configuration

3. **Load the extension in Chrome:**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right corner
   - Click "Load unpacked"
   - Select the `talk-to-my-agent-2.0` directory

## 🚀 Quick Start

### 1. Configure Settings
- Click the extension icon in your browser toolbar
- Click the ⚙️ settings button
- Enter your Gemini API key
- Paste your CV/resume content
- Settings are automatically saved

### 2. Generate Cover Letters
- Open the extension popup
- Stay on the "📝 Cover Letter" tab
- Paste a job description
- Click "✨ Generate Cover Letter"
- Copy or edit the generated content

### 3. Optimize Your CV
- Switch to the "📄 CV Optimizer" tab
- Paste the target job description
- Click "🚀 Optimize CV"
- Edit the optimized CV directly
- Save changes to update your stored CV

## 📁 Project Structure

```
talk-to-my-agent-2.0/
├── manifest.json           # Extension manifest and permissions
├── background.js          # Service worker handling AI requests
├── gemini.js             # Gemini API utilities
├── popup/                # Main popup interface
│   ├── popup.html        # Popup HTML structure
│   ├── popup.js          # Popup functionality and event handling
│   └── popup.css         # Modern styling and responsive design
├── options/              # Settings/configuration page
│   ├── options.html      # Settings page structure
│   ├── options.js        # Settings management and storage
│   └── options.css       # Settings page styling
├── images/               # Extension icons
├── test.html            # Test page with sample job postings
└── docs/                # Documentation
```

## 🔧 Technical Details

### Architecture
- **Manifest V3**: Uses modern Chrome extension architecture
- **Service Worker**: Handles background AI processing
- **Session Storage**: Secure, temporary storage for sensitive data
- **Modular Design**: Separated concerns for maintainability

### API Integration
- **Google Gemini AI**: Advanced language model for content generation
- **Smart Prompting**: Optimized prompts for professional content
- **Error Handling**: Comprehensive error management and user feedback
- **Rate Limiting**: Handles API rate limits gracefully

### Security Features
- **Local Storage**: API keys stored only in browser session
- **No External Logging**: No data sent to third-party services
- **Content Validation**: Input sanitization and validation
- **Safe Defaults**: Secure configuration out of the box

## 🎯 Usage Examples

### Cover Letter Generation
Perfect for creating personalized cover letters that:
- Highlight relevant experience from your CV
- Match job requirements and company culture
- Maintain professional tone and structure
- Show genuine interest in the specific role

### CV Optimization
Ideal for tailoring your CV to:
- Emphasize skills matching job requirements
- Use industry-relevant keywords
- Restructure content for better impact
- Maintain truthfulness while improving relevance

## 🧪 Testing

Use the included `test.html` file to:
- Test extension functionality with sample job postings
- Practice with different types of positions
- Validate AI-generated content quality
- Experiment with various CV formats

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 Development Notes

### Key Technologies
- **Chrome Extensions API**: For browser integration
- **Fetch API**: For AI service communication
- **Modern CSS**: Grid, Flexbox, and CSS variables
- **ES6+ JavaScript**: Modern language features
- **Session Storage API**: For data persistence

### Performance Optimizations
- **Debounced Saving**: Reduces API calls during typing
- **Lazy Loading**: Components loaded as needed
- **Efficient DOM**: Minimal DOM manipulation
- **Caching**: Smart caching of API responses

## 🔒 Privacy & Security

- **No Data Collection**: Extension doesn't collect or transmit user data
- **Local Processing**: All data handled locally in browser
- **Session-Only Storage**: Sensitive data cleared when browser closes
- **API Key Protection**: Keys never logged or transmitted unnecessarily

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: Report bugs via GitHub Issues
- **Documentation**: Check the `/docs` folder for detailed guides
- **API Key Help**: Visit [Google AI Studio](https://makersuite.google.com/app/apikey)

## 🔄 Version History

### v2.0.0
- Complete UI redesign with modern, responsive interface
- Added CV optimization functionality
- Implemented session storage for secure data handling
- Enhanced error handling and user feedback
- Added tabbed interface for better organization
- Improved API integration with better prompts

### v1.0.0
- Initial release with basic cover letter generation
- Simple popup interface
- Basic Gemini AI integration

---

**Made with ❤️ to help job seekers succeed**