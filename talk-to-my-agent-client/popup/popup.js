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
        console.table({"Job Description":jobDescription.value, "Career Goals": careerGoals.value});
    });

});