// Tests for popup functionality
describe('Popup Tests', () => {
    let mockChrome;
    
    beforeEach(() => {
        // Mock chrome API
        mockChrome = {
            runtime: {
                sendMessage: jest.fn()
            }
        };
        global.chrome = mockChrome;
        
        // Setup DOM
        document.body.innerHTML = `
            <form id="inputForm">
                <textarea id="job-description"></textarea>
                <textarea id="career-goals"></textarea>
                <button id="generate-button"></button>
            </form>
            <div id="loader"></div>
            <div id="output">
                <div id="cover-letter"></div>
            </div>
            <div id="alert"></div>
        `;
    });

    test('form validation should fail with empty fields', () => {
        require('../popup/popup.js');
        
        const form = document.getElementById('inputForm');
        const event = new Event('submit');
        
        form.dispatchEvent(event);
        
        expect(document.querySelector('.error')).toBeTruthy();
        expect(mockChrome.runtime.sendMessage).not.toHaveBeenCalled();
    });

    test('should show loading state when generating', () => {
        require('../popup/popup.js');
        
        const form = document.getElementById('inputForm');
        const loader = document.getElementById('loader');
        const jobDescription = document.getElementById('job-description');
        const careerGoals = document.getElementById('career-goals');
        
        jobDescription.value = 'Test job description';
        careerGoals.value = 'Test career goals';
        
        const event = new Event('submit');
        form.dispatchEvent(event);
        
        expect(loader.style.display).toBe('block');
        expect(document.getElementById('generate-button').disabled).toBe(true);
    });
});
