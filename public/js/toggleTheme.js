/*
=================================================
JAVASCRIPT FILE FOR TOGGLING DARK AND LIGHT MODE
=================================================
*/
// This script toggles between dark and light mode for a webpage
// and saves the user's preference in local storage.

// On web page load, run the following function to set the theme
document.addEventListener('DOMContentLoaded', function() {
    // Get the theme toggle button and icons
    const themeToggle = document.getElementById('themeToggle');
    const moonIcon = '<i class="fas fa-moon"></i>';
    const sunIcon = '<i class="fas fa-sun"></i>';

    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        themeToggle.innerHTML = sunIcon;
    }

    // Add event listener to the theme toggle button
    themeToggle.addEventListener('click', function() {
        if (document.body.classList.contains('light-mode')) {
            // Switch to light mode
            document.body.classList.remove('light-mode');
            localStorage.setItem('theme', 'dark');
            themeToggle.innerHTML = sunIcon;
        } else {
            // Switch to dark mode
            document.body.classList.add('light-mode');
            localStorage.setItem('theme', 'light');
            themeToggle.innerHTML = moonIcon;
        }
    });
});