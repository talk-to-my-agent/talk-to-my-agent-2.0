document.addEventListener('DOMContentLoaded', function() {
    console.log("Popup document fully loaded");
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.display = 'none'; // Hide the loader once the document is loaded
    }
    const jobDescription = document.getElementById('job-description');
    const careerGoals = document.getElementById('career-goals');
    const generateButton = document.getElementById('generate-button');

    generateButton.addEventListener('click', function() {
        chrome.runtime.sendMessage({
            action: 'generate',
            data:{ 
                jobDescription: jobDescription.value,
                careerGoals: careerGoals.value
            }
        }, response => { 
            if(response && response.success) {
                console.log("Sucessfully generated response:", response.data);
            }
        });
    });
});