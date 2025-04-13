/**
 * Break Timer Module
 * Handles the break timer functionality for the timesheet page
 */

// Break timer state
let breakTimerInterval = null;
let breakStartTime = null;
let breakDuration = 0; // in seconds
let mainTimerWasPaused = false;

// Maximum break duration in seconds (30 minutes)
const MAX_BREAK_DURATION = 30 * 60; // 30 minutes in seconds

// Auto-end break timer
let autoEndBreakTimeout = null;

// DOM elements (will be initialized in init function)
let breakTimerContainer;
let breakTimerDisplay;
let breakProgressBar;
let statusTextElement;

/**
 * Initialize the break timer
 * @param {Object} elements - DOM elements needed for the break timer
 */
function initBreakTimer(elements) {
    // Store DOM elements
    breakTimerContainer = elements.breakTimerContainer;
    breakTimerDisplay = elements.breakTimerDisplay;
    breakProgressBar = elements.breakProgressBar;
    statusTextElement = elements.statusTextElement;

    // Check for existing break when the page loads
    checkForExistingBreak();

    console.log('Break timer initialized');
}

/**
 * Start the break timer
 */
function startBreakTimer() {
    console.log('Starting break timer');

    // Reset and initialize break timer
    breakStartTime = new Date();
    breakDuration = 0;

    // Show the break timer container
    breakTimerContainer.style.display = 'block';
    breakTimerContainer.classList.add('break-timer-active');

    // Update the timer display immediately
    updateBreakTimerDisplay();

    // Start the interval to update the timer every second
    breakTimerInterval = setInterval(updateBreakTimerDisplay, 1000);

    // Store the break start time in localStorage for persistence
    localStorage.setItem('breakStartTime', breakStartTime.toISOString());

    // Pause the main work timer
    pauseMainTimer();

    // Set up auto-end timeout (30 minutes)
    if (autoEndBreakTimeout) {
        clearTimeout(autoEndBreakTimeout);
    }

    autoEndBreakTimeout = setTimeout(() => {
        console.log(`Maximum break duration of ${MAX_BREAK_DURATION / 60} minutes reached. Auto-ending break.`);
        // Get the end break button and click it
        const endBreakBtn = document.getElementById('endBreakBtn');
        if (endBreakBtn) {
            endBreakBtn.click();
        } else {
            // If button not found, just stop the timer directly
            stopBreakTimer();
        }
    }, MAX_BREAK_DURATION * 1000); // Convert seconds to milliseconds

    // Store the auto-end timeout ID in localStorage
    localStorage.setItem('autoEndBreakTimeout', 'active');

    // Log the state for debugging
    console.log('Break timer started. Current state:', {
        breakTimerRunning: !!breakTimerInterval,
        breakStartTime: breakStartTime,
        breakTimerVisible: breakTimerContainer.style.display !== 'none',
        mainTimerPaused: mainTimerWasPaused,
        autoEndScheduled: true,
        maxBreakDuration: `${MAX_BREAK_DURATION / 60} minutes`
    });
}

/**
 * Update the break timer display
 */
function updateBreakTimerDisplay() {
    if (!breakStartTime) return;

    const now = new Date();
    breakDuration = Math.floor((now - breakStartTime) / 1000); // in seconds

    // Format the time as HH:MM:SS
    const hours = Math.floor(breakDuration / 3600);
    const minutes = Math.floor((breakDuration % 3600) / 60);
    const seconds = breakDuration % 60;

    const formattedTime =
        String(hours).padStart(2, '0') + ':' +
        String(minutes).padStart(2, '0') + ':' +
        String(seconds).padStart(2, '0');

    // Update the display
    breakTimerDisplay.textContent = formattedTime;

    // Calculate remaining time until auto-end
    const remainingSeconds = MAX_BREAK_DURATION - breakDuration;
    const remainingMinutes = Math.ceil(remainingSeconds / 60);

    // Update the progress bar based on the maximum break duration
    const progressPercentage = Math.min(100, (breakDuration / MAX_BREAK_DURATION) * 100);
    breakProgressBar.style.width = `${progressPercentage}%`;

    // Change color based on how much time is left
    if (remainingSeconds <= 60) { // Last minute
        // Red for last minute
        breakTimerContainer.style.borderLeftColor = 'var(--danger)';
        breakTimerDisplay.style.color = 'var(--danger)';

        // Add a flashing effect in the last minute
        if (seconds % 2 === 0) {
            breakTimerContainer.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
        } else {
            breakTimerContainer.style.backgroundColor = 'transparent';
        }

        // Add a countdown message
        const countdownMessage = document.createElement('div');
        countdownMessage.className = 'break-countdown-message';
        countdownMessage.textContent = `Break ends in ${remainingSeconds} seconds!`;

        // Replace any existing countdown message
        const existingMessage = breakTimerContainer.querySelector('.break-countdown-message');
        if (existingMessage) {
            existingMessage.textContent = countdownMessage.textContent;
        } else {
            breakTimerContainer.appendChild(countdownMessage);
        }
    } else if (remainingMinutes <= 5) { // Last 5 minutes
        // Orange/yellow for last 5 minutes
        breakTimerContainer.style.borderLeftColor = 'var(--warning)';
        breakTimerDisplay.style.color = 'var(--warning-dark)';
        breakTimerContainer.style.backgroundColor = 'rgba(255, 165, 0, 0.05)';

        // Add a countdown message
        const countdownMessage = document.createElement('div');
        countdownMessage.className = 'break-countdown-message';
        countdownMessage.textContent = `Break ends in ${remainingMinutes} minutes`;

        // Replace any existing countdown message
        const existingMessage = breakTimerContainer.querySelector('.break-countdown-message');
        if (existingMessage) {
            existingMessage.textContent = countdownMessage.textContent;
        } else {
            breakTimerContainer.appendChild(countdownMessage);
        }
    } else {
        // Normal color for regular time
        breakTimerContainer.style.borderLeftColor = 'var(--primary)';
        breakTimerDisplay.style.color = 'var(--primary-dark)';
        breakTimerContainer.style.backgroundColor = 'transparent';

        // Remove any countdown message
        const existingMessage = breakTimerContainer.querySelector('.break-countdown-message');
        if (existingMessage) {
            breakTimerContainer.removeChild(existingMessage);
        }
    }
}

/**
 * Stop the break timer
 * @returns {number} The break duration in seconds
 */
function stopBreakTimer() {
    console.log('Stopping break timer');

    // Clear the interval
    if (breakTimerInterval) {
        clearInterval(breakTimerInterval);
        breakTimerInterval = null;
    }

    // Clear the auto-end timeout
    if (autoEndBreakTimeout) {
        clearTimeout(autoEndBreakTimeout);
        autoEndBreakTimeout = null;
    }

    // Hide the break timer container
    breakTimerContainer.style.display = 'none';
    breakTimerContainer.classList.remove('break-timer-active');

    // Reset the timer display
    breakTimerDisplay.textContent = '00:00:00';
    breakProgressBar.style.width = '0%';

    // Reset the colors
    breakTimerContainer.style.borderLeftColor = 'var(--warning)';
    breakTimerDisplay.style.color = 'var(--warning-dark)';

    // Store the break duration before clearing localStorage
    const finalBreakDuration = breakDuration;

    // Clear the break start time from localStorage
    localStorage.removeItem('breakStartTime');
    localStorage.removeItem('autoEndBreakTimeout');

    // Resume the main work timer
    resumeMainTimer();

    // Log the state for debugging
    console.log('Break timer stopped. Current state:', {
        breakDuration: finalBreakDuration,
        breakTimerRunning: !!breakTimerInterval,
        breakTimerVisible: breakTimerContainer.style.display !== 'none',
        mainTimerResumed: !mainTimerWasPaused,
        autoEndCleared: true
    });

    return finalBreakDuration; // Return the break duration in seconds
}

/**
 * Pause the main timer
 */
function pauseMainTimer() {
    console.log('Pausing main timer');

    // Set flag to indicate the main timer was paused
    mainTimerWasPaused = true;
    localStorage.setItem('mainTimerWasPaused', 'true');

    // Store the current time as the pause time
    localStorage.setItem('mainTimerPausedAt', new Date().toISOString());

    // Notify the main timer to pause
    if (window.pauseWorkTimer && typeof window.pauseWorkTimer === 'function') {
        window.pauseWorkTimer();
    } else {
        console.log('Main timer pause function not available');
    }
}

/**
 * Resume the main timer
 */
function resumeMainTimer() {
    console.log('Resuming main timer');

    // Reset the pause flag
    mainTimerWasPaused = false;
    localStorage.removeItem('mainTimerWasPaused');

    // Clear the pause time
    localStorage.removeItem('mainTimerPausedAt');

    // Notify the main timer to resume
    if (window.resumeWorkTimer && typeof window.resumeWorkTimer === 'function') {
        window.resumeWorkTimer();
    } else {
        console.log('Main timer resume function not available');
    }
}

/**
 * Check for an existing break when the page loads
 */
function checkForExistingBreak() {
    // Check if there's a stored break start time in localStorage
    const storedBreakStartTime = localStorage.getItem('breakStartTime');
    if (storedBreakStartTime) {
        // Check if the user is actually on break according to the server
        const currentStatus = statusTextElement.textContent.toLowerCase();
        if (currentStatus.includes('on break')) {
            console.log('Resuming break timer from stored start time:', storedBreakStartTime);
            // Restore the break timer
            breakStartTime = new Date(storedBreakStartTime);

            // Show the break timer container
            breakTimerContainer.style.display = 'block';
            breakTimerContainer.classList.add('break-timer-active');

            // Update the timer display immediately
            updateBreakTimerDisplay();

            // Start the interval to update the timer every second
            breakTimerInterval = setInterval(updateBreakTimerDisplay, 1000);

            // Set the main timer pause flag
            mainTimerWasPaused = true;
            localStorage.setItem('mainTimerWasPaused', 'true');

            // Check if we need to set up the auto-end timeout
            const isAutoEndActive = localStorage.getItem('autoEndBreakTimeout') === 'active';
            if (isAutoEndActive) {
                // Calculate how much time has passed since the break started
                const now = new Date();
                const elapsedSeconds = Math.floor((now - breakStartTime) / 1000);
                const remainingSeconds = MAX_BREAK_DURATION - elapsedSeconds;

                if (remainingSeconds > 0) {
                    // Set up the auto-end timeout for the remaining time
                    console.log(`Resuming auto-end timeout. ${remainingSeconds} seconds remaining until auto-end.`);
                    autoEndBreakTimeout = setTimeout(() => {
                        console.log(`Maximum break duration of ${MAX_BREAK_DURATION / 60} minutes reached. Auto-ending break.`);
                        // Get the end break button and click it
                        const endBreakBtn = document.getElementById('endBreakBtn');
                        if (endBreakBtn) {
                            endBreakBtn.click();
                        } else {
                            // If button not found, just stop the timer directly
                            stopBreakTimer();
                        }
                    }, remainingSeconds * 1000);
                } else {
                    // Break has already exceeded the maximum duration, end it immediately
                    console.log(`Break has already exceeded maximum duration. Auto-ending break now.`);
                    setTimeout(() => {
                        const endBreakBtn = document.getElementById('endBreakBtn');
                        if (endBreakBtn) {
                            endBreakBtn.click();
                        } else {
                            stopBreakTimer();
                        }
                    }, 1000); // Small delay to ensure the UI is ready
                }
            }
        } else {
            // User is not on break according to the server, clear the stored break start time
            console.log('Stored break start time found but user is not on break. Clearing stored time.');
            localStorage.removeItem('breakStartTime');
            localStorage.removeItem('mainTimerWasPaused');
            localStorage.removeItem('mainTimerPausedAt');
            localStorage.removeItem('autoEndBreakTimeout');
        }
    } else {
        // No break in progress, check if there's a paused timer that needs to be resumed
        const pausedAtString = localStorage.getItem('timerPausedAt');
        const currentStatus = statusTextElement.textContent.toLowerCase();

        // Only resume the timer if the user is active (not on break or unavailable)
        if (pausedAtString && currentStatus.includes('active')) {
            console.log('Found paused timer but user is active. Resuming timer.');
            resumeMainTimer();
        }
    }
}

// Export the functions
window.breakTimer = {
    init: initBreakTimer,
    start: startBreakTimer,
    stop: stopBreakTimer,
    update: updateBreakTimerDisplay,
    checkForExisting: checkForExistingBreak
};
