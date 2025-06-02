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
        console.log('Loading saved data...');
        chrome.storage.local.get(['gemini_api_key', 'user_cv'], function(result) {
            if (chrome.runtime.lastError) {
                console.error('Error loading saved data:', chrome.runtime.lastError);
                showStatus('Error loading saved data', 'error');
                return;
            }

            console.log('Loaded data:', result);

            if (result.gemini_api_key) {
                geminiApiKeyInput.value = result.gemini_api_key;
                console.log('API key loaded successfully');
            } else {
                console.log('No API key found in storage');
            }

            if (result.user_cv) {
                cvTextInput.value = result.user_cv;
                console.log('CV loaded successfully');
            } else {
                console.log('No CV found in storage');
            }
        });
    }

    function saveData() {
        const apiKey = geminiApiKeyInput.value.trim();
        const cvText = cvTextInput.value.trim();

        console.log('Saving data - API key length:', apiKey.length, 'CV length:', cvText.length);

        const dataToSave = {};

        if (apiKey) {
            dataToSave.gemini_api_key = apiKey;
            console.log('Adding API key to save data');
        }

        if (cvText) {
            dataToSave.user_cv = cvText;
            console.log('Adding CV to save data');
        }

        console.log('Data to save:', Object.keys(dataToSave));

        chrome.storage.local.set(dataToSave, function() {
            if (chrome.runtime.lastError) {
                console.error('Error saving settings:', chrome.runtime.lastError);
                showStatus('Error saving settings', 'error');
                return;
            }
            console.log('Settings saved successfully');
            showStatus('Settings saved successfully', 'success');
        });

        // Remove keys if they're empty
        const keysToRemove = [];
        if (!apiKey && geminiApiKeyInput.dataset.hadValue) {
            keysToRemove.push('gemini_api_key');
        }
        if (!cvText && cvTextInput.dataset.hadValue) {
            keysToRemove.push('user_cv');
        }

        if (keysToRemove.length > 0) {
            chrome.storage.local.remove(keysToRemove);
        }

        // Track if fields had values
        geminiApiKeyInput.dataset.hadValue = !!apiKey;
        cvTextInput.dataset.hadValue = !!cvText;
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

    // Add clear button for testing
    const clearButton = document.createElement('button');
    clearButton.textContent = 'Clear All Settings';
    clearButton.className = 'save-button';
    clearButton.style.backgroundColor = '#e74c3c';
    clearButton.style.marginLeft = '10px';
    clearButton.addEventListener('click', function() {
        console.log('Clearing all settings...');
        chrome.storage.local.clear(function() {
            if (chrome.runtime.lastError) {
                console.error('Error clearing settings:', chrome.runtime.lastError);
                showStatus('Error clearing settings', 'error');
                return;
            }
            geminiApiKeyInput.value = '';
            cvTextInput.value = '';
            console.log('All settings cleared successfully');
            showStatus('All settings cleared', 'success');
        });
    });
    
    document.querySelector('.container').appendChild(clearButton);
});