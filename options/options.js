document.addEventListener('DOMContentLoaded', function() {
    const geminiApiKeyInput = document.getElementById('geminiApiKey');
    const cvTextInput = document.getElementById('cvText');
    const statusDiv = document.getElementById('status');

    // Load saved data on page load
    loadSavedData();

    // Save data on input changes with debounce
    let saveTimeout;
    function debouncedSave() {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(saveData, 500);
    }

    geminiApiKeyInput.addEventListener('input', debouncedSave);
    cvTextInput.addEventListener('input', debouncedSave);

    function loadSavedData() {
        try {
            const savedApiKey = sessionStorage.getItem('gemini_api_key');
            const savedCV = sessionStorage.getItem('user_cv');

            if (savedApiKey) {
                geminiApiKeyInput.value = savedApiKey;
            }

            if (savedCV) {
                cvTextInput.value = savedCV;
            }
        } catch (error) {
            showStatus('Error loading saved data', 'error');
        }
    }

    function saveData() {
        try {
            const apiKey = geminiApiKeyInput.value.trim();
            const cvText = cvTextInput.value.trim();

            if (apiKey) {
                sessionStorage.setItem('gemini_api_key', apiKey);
            } else {
                sessionStorage.removeItem('gemini_api_key');
            }

            if (cvText) {
                sessionStorage.setItem('user_cv', cvText);
            } else {
                sessionStorage.removeItem('user_cv');
            }

            showStatus('Settings saved successfully', 'success');
        } catch (error) {
            showStatus('Error saving settings', 'error');
        }
    }

    function showStatus(message, type) {
        statusDiv.textContent = message;
        statusDiv.className = `status ${type}`;
        
        setTimeout(() => {
            statusDiv.textContent = '';
            statusDiv.className = 'status';
        }, 3000);
    }

    // Add save button for manual save
    const saveButton = document.createElement('button');
    saveButton.textContent = 'Save Settings';
    saveButton.className = 'save-button';
    saveButton.addEventListener('click', saveData);
    
    document.querySelector('.container').appendChild(saveButton);
});