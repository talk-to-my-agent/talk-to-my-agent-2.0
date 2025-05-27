document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const form = document.getElementById('inputForm');
    const jobDescription = document.getElementById('job-description');
    const careerGoals = document.getElementById('career-goals');
    const generateButton = document.getElementById('generate-button');
    const loader = document.getElementById('loader');
    const output = document.getElementById('output');
    const coverLetter = document.getElementById('cover-letter');
    const copyButton = document.getElementById('copy-button');
    const alert = document.getElementById('alert');
    const jobDescriptionError = document.getElementById('job-description-error');
    const careerGoalsError = document.getElementById('career-goals-error');

    // Hide loader and output initially
    loader.style.display = 'none';
    output.style.display = 'none';

    // Form validation function
    function validateForm() {
        let isValid = true;
        
        if (!jobDescription.value.trim()) {
            jobDescription.classList.add('error');
            jobDescriptionError.textContent = 'Job description is required';
            isValid = false;
        } else {
            jobDescription.classList.remove('error');
            jobDescriptionError.textContent = '';
        }

        if (!careerGoals.value.trim()) {
            careerGoals.classList.add('error');
            careerGoalsError.textContent = 'Career goals are required';
            isValid = false;
        } else {
            careerGoals.classList.remove('error');
            careerGoalsError.textContent = '';
        }

        return isValid;
    }

    // Show alert message
    function showAlert(message, type = 'error') {
        alert.textContent = message;
        alert.className = `alert ${type}`;
        setTimeout(() => {
            alert.className = 'alert';
        }, 5000);
    }

    // Handle form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        // Show loading state
        generateButton.disabled = true;
        loader.style.display = 'block';
        output.style.display = 'none';
        alert.className = 'alert';

        // Send message to background script
        chrome.runtime.sendMessage({
            action: 'generate',
            data: { 
                jobDescription: jobDescription.value,
                careerGoals: careerGoals.value
            }
        }, response => {
            // Hide loading state
            loader.style.display = 'none';
            generateButton.disabled = false;

            if (response && response.success) {
                // Show success response
                coverLetter.textContent = response.data.message;
                output.style.display = 'block';
                showAlert('Cover letter generated successfully!', 'success');
            } else {
                // Show error
                showAlert(response?.error || 'An error occurred while generating the cover letter.');
            }
        });
    });

    // Copy to clipboard functionality
    copyButton.addEventListener('click', async function() {
        try {
            await navigator.clipboard.writeText(coverLetter.textContent);
            showAlert('Cover letter copied to clipboard!', 'success');
        } catch (err) {
            showAlert('Failed to copy to clipboard');
        }
    });

    // Real-time validation
    jobDescription.addEventListener('input', () => {
        if (jobDescription.value.trim()) {
            jobDescription.classList.remove('error');
            jobDescriptionError.textContent = '';
        }
    });

    careerGoals.addEventListener('input', () => {
        if (careerGoals.value.trim()) {
            careerGoals.classList.remove('error');
            careerGoalsError.textContent = '';
        }
    });
});