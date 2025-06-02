document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const settingsBtn = document.getElementById('settings-btn');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');
    const alert = document.getElementById('alert');
    const loader = document.getElementById('loader');
    const loaderText = document.getElementById('loader-text');

    // Cover Letter elements
    const coverLetterForm = document.getElementById('cover-letter-form');
    const jobDescription = document.getElementById('job-description');
    const generateCoverLetterBtn = document.getElementById('generate-cover-letter-btn');
    const coverLetterOutput = document.getElementById('cover-letter-output');
    const coverLetterContent = document.getElementById('cover-letter-content');
    const copyCoverLetterBtn = document.getElementById('copy-cover-letter-btn');
    const editCoverLetterBtn = document.getElementById('edit-cover-letter-btn');

    // CV Optimizer elements
    const cvOptimizerForm = document.getElementById('cv-optimizer-form');
    const targetJob = document.getElementById('target-job');
    const optimizeCvBtn = document.getElementById('optimize-cv-btn');
    const cvOutput = document.getElementById('cv-output');
    const cvContent = document.getElementById('cv-content');
    const copyCvBtn = document.getElementById('copy-cv-btn');
    const saveCvBtn = document.getElementById('save-cv-btn');

    // Error message elements
    const jobDescriptionError = document.getElementById('job-description-error');
    const targetJobError = document.getElementById('target-job-error');

    // Initialize
    init();

    function init() {
        // Hide outputs initially
        coverLetterOutput.style.display = 'none';
        cvOutput.style.display = 'none';
        
        // Set up event listeners
        setupEventListeners();
        
        // Check if settings are configured
        checkSettings();
    }

    function setupEventListeners() {
        // Settings button
        settingsBtn.addEventListener('click', openSettings);

        // Tab switching
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => switchTab(btn.dataset.tab));
        });

        // Cover Letter form
        coverLetterForm.addEventListener('submit', handleCoverLetterGeneration);
        jobDescription.addEventListener('input', () => clearError(jobDescription, jobDescriptionError));

        // CV Optimizer form
        cvOptimizerForm.addEventListener('submit', handleCvOptimization);
        targetJob.addEventListener('input', () => clearError(targetJob, targetJobError));

        // Copy buttons
        copyCoverLetterBtn.addEventListener('click', () => copyToClipboard(coverLetterContent.textContent, 'Cover letter'));
        copyCvBtn.addEventListener('click', () => copyToClipboard(cvContent.textContent, 'CV'));

        // Edit button
        editCoverLetterBtn.addEventListener('click', enableCoverLetterEdit);

        // Save CV button
        saveCvBtn.addEventListener('click', saveCvChanges);
    }

    function switchTab(tabName) {
        // Update tab buttons
        tabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update tab panels
        tabPanels.forEach(panel => {
            panel.classList.toggle('active', panel.id === `${tabName}-tab`);
        });

        // Clear alerts when switching tabs
        hideAlert();
    }

    function openSettings() {
        chrome.runtime.openOptionsPage();
    }

    function checkSettings() {
        const apiKey = sessionStorage.getItem('gemini_api_key');
        const userCV = sessionStorage.getItem('user_cv');

        if (!apiKey || !userCV) {
            showAlert('Please configure your API key and CV in settings first.', 'warning');
        }
    }

    async function handleCoverLetterGeneration(e) {
        e.preventDefault();

        if (!validateInput(jobDescription, jobDescriptionError, 'Job description is required')) {
            return;
        }

        const apiKey = sessionStorage.getItem('gemini_api_key');
        const userCV = sessionStorage.getItem('user_cv');

        if (!apiKey || !userCV) {
            showAlert('Please configure your API key and CV in settings first.', 'error');
            return;
        }

        showLoader('Generating cover letter...');

        try {
            const response = await sendMessage({
                action: 'generateCoverLetter',
                data: {
                    jobDescription: jobDescription.value.trim(),
                    userCV: userCV,
                    apiKey: apiKey
                }
            });

            hideLoader();

            if (response && response.success) {
                coverLetterContent.textContent = response.data.message;
                coverLetterOutput.style.display = 'flex';
                showAlert('Cover letter generated successfully!', 'success');
            } else {
                showAlert(response?.error || 'Failed to generate cover letter', 'error');
            }
        } catch (error) {
            hideLoader();
            showAlert('An error occurred while generating the cover letter', 'error');
        }
    }

    async function handleCvOptimization(e) {
        e.preventDefault();

        if (!validateInput(targetJob, targetJobError, 'Target job description is required')) {
            return;
        }

        const apiKey = sessionStorage.getItem('gemini_api_key');
        const userCV = sessionStorage.getItem('user_cv');

        if (!apiKey || !userCV) {
            showAlert('Please configure your API key and CV in settings first.', 'error');
            return;
        }

        showLoader('Optimizing CV...');

        try {
            const response = await sendMessage({
                action: 'optimizeCV',
                data: {
                    targetJob: targetJob.value.trim(),
                    userCV: userCV,
                    apiKey: apiKey
                }
            });

            hideLoader();

            if (response && response.success) {
                cvContent.textContent = response.data.message;
                cvOutput.style.display = 'flex';
                showAlert('CV optimized successfully!', 'success');
            } else {
                showAlert(response?.error || 'Failed to optimize CV', 'error');
            }
        } catch (error) {
            hideLoader();
            showAlert('An error occurred while optimizing the CV', 'error');
        }
    }

    function enableCoverLetterEdit() {
        coverLetterContent.contentEditable = true;
        coverLetterContent.classList.add('editable');
        coverLetterContent.focus();
        
        editCoverLetterBtn.textContent = '💾 Save Changes';
        editCoverLetterBtn.removeEventListener('click', enableCoverLetterEdit);
        editCoverLetterBtn.addEventListener('click', saveCoverLetterChanges);
    }

    function saveCoverLetterChanges() {
        coverLetterContent.contentEditable = false;
        coverLetterContent.classList.remove('editable');
        
        editCoverLetterBtn.textContent = '✏️ Edit';
        editCoverLetterBtn.removeEventListener('click', saveCoverLetterChanges);
        editCoverLetterBtn.addEventListener('click', enableCoverLetterEdit);
        
        showAlert('Changes saved!', 'success');
    }

    function saveCvChanges() {
        const updatedCV = cvContent.textContent;
        sessionStorage.setItem('user_cv', updatedCV);
        showAlert('CV changes saved to session!', 'success');
    }

    async function copyToClipboard(text, type) {
        try {
            await navigator.clipboard.writeText(text);
            showAlert(`${type} copied to clipboard!`, 'success');
        } catch (err) {
            showAlert(`Failed to copy ${type.toLowerCase()}`, 'error');
        }
    }

    function validateInput(input, errorElement, errorMessage) {
        if (!input.value.trim()) {
            input.classList.add('error');
            errorElement.textContent = errorMessage;
            return false;
        }
        return true;
    }

    function clearError(input, errorElement) {
        if (input.value.trim()) {
            input.classList.remove('error');
            errorElement.textContent = '';
        }
    }

    function showAlert(message, type = 'error') {
        alert.textContent = message;
        alert.className = `alert ${type}`;
        
        setTimeout(() => {
            hideAlert();
        }, 5000);
    }

    function hideAlert() {
        alert.className = 'alert';
        alert.textContent = '';
    }

    function showLoader(message) {
        loaderText.textContent = message;
        loader.classList.add('visible');
        
        // Disable buttons
        generateCoverLetterBtn.disabled = true;
        optimizeCvBtn.disabled = true;
    }

    function hideLoader() {
        loader.classList.remove('visible');
        
        // Re-enable buttons
        generateCoverLetterBtn.disabled = false;
        optimizeCvBtn.disabled = false;
    }

    function sendMessage(message) {
        return new Promise((resolve) => {
            chrome.runtime.sendMessage(message, resolve);
        });
    }
});