document.addEventListener('DOMContentLoaded', function() {
    // Mobile Menu Toggle
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navList = document.querySelector('.nav-list');

    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', function() {
            navList.classList.toggle('active');
            this.classList.toggle('active');
            const expanded = this.getAttribute('aria-expanded') === 'true' || false;
            this.setAttribute('aria-expanded', !expanded);
        });
    }

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            if (this.getAttribute('href') !== '#') {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    window.scrollTo({
                        top: target.offsetTop - 80,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    // Period selector for timesheet
    const periodOptions = document.querySelectorAll('.period-option');
    if (periodOptions.length > 0) {
        periodOptions.forEach(option => {
            option.addEventListener('click', function() {
                periodOptions.forEach(opt => opt.classList.remove('active'));
                this.classList.add('active');

                // Check if custom date option is selected
                const isCustom = this.getAttribute('data-period') === 'custom';
                const customDates = document.querySelector('.custom-dates');
                if (customDates) {
                    customDates.style.display = isCustom ? 'flex' : 'none';
                }
            });
        });
    }

    // Filter chips for timesheet
    const filterChips = document.querySelectorAll('.filter-chip');
    if (filterChips.length > 0) {
        filterChips.forEach(chip => {
            chip.addEventListener('click', function() {
                this.classList.toggle('active');
            });
        });
    }

    // Countdown timer functionality - Make it globally accessible
    // Global variable to track if a timer is already running
    window.timerRunning = false;

    // Store the current date to check for day changes
    window.currentTimerDate = new Date().toISOString().split('T')[0];

    // Function to update timer values from server data
    window.updateTimerValues = function(newWorkedSeconds, newRemainingSeconds) {
        // Only update if the timer is running
        if (!window.timerRunning) {
            console.log('Timer not running, cannot update values');
            return;
        }

        // Update the global timer values
        if (window.workedSeconds !== undefined && window.remainingSeconds !== undefined) {
            // Calculate the difference to avoid sudden jumps
            const workedDiff = newWorkedSeconds - window.workedSeconds;
            const remainingDiff = window.remainingSeconds - newRemainingSeconds;

            // Only update if the difference is significant (more than 60 seconds)
            // This prevents small fluctuations due to timing differences
            if (Math.abs(workedDiff) > 60 || Math.abs(remainingDiff) > 60) {
                console.log('Significant difference detected in timer values:');
                console.log('Worked seconds diff:', workedDiff, 'Remaining seconds diff:', remainingDiff);

                // Update the global values
                window.workedSeconds = newWorkedSeconds;
                window.remainingSeconds = newRemainingSeconds;

                console.log('Updated timer values - Worked:', (window.workedSeconds / 3600).toFixed(2),
                            'hours, Remaining:', (window.remainingSeconds / 3600).toFixed(2), 'hours');

                // Update the display immediately
                const countdownElement = document.getElementById('countdown-timer');
                const hoursWorkedElement = document.getElementById('hours-worked');
                const timerBar = document.querySelector('.timer-bar');

                if (hoursWorkedElement) {
                    // Calculate hours and minutes
                    const workedHours = Math.floor(window.workedSeconds / 3600);
                    const workedMinutes = Math.floor((window.workedSeconds % 3600) / 60);

                    // Update the display
                    hoursWorkedElement.textContent = `${workedHours}:${workedMinutes.toString().padStart(2, '0')}`;
                }

                if (countdownElement) {
                    // Calculate hours and minutes
                    const remainingHours = Math.floor(window.remainingSeconds / 3600);
                    const remainingMinutes = Math.floor((window.remainingSeconds % 3600) / 60);

                    // Update the display
                    countdownElement.textContent = `${remainingHours}:${remainingMinutes.toString().padStart(2, '0')}`;
                }

                if (timerBar) {
                    // Update the progress bar
                    const workDaySeconds = 8 * 3600;
                    const percentage = Math.min(100, Math.max(0, (window.workedSeconds / workDaySeconds) * 100));
                    timerBar.style.width = `${percentage}%`;
                }
            } else {
                console.log('Timer values are close enough to server values, no update needed');
            }
        } else {
            console.log('Global timer values not initialized, cannot update');
        }
    };

    window.updateCountdown = function() {
        // Check if the date has changed since the last timer initialization
        const today = new Date().toISOString().split('T')[0];
        if (window.currentTimerDate !== today) {
            console.log('Date has changed from', window.currentTimerDate, 'to', today);
            console.log('Resetting timer for new day');
            window.currentTimerDate = today;
            window.timerRunning = false; // Reset the timer flag for the new day
        }

        // If a timer is already running, don't start another one
        if (window.timerRunning) {
            console.log('Timer already running, not starting a new one');
            return;
        }

        const countdownElement = document.getElementById('countdown-timer');
        const hoursWorkedElement = document.getElementById('hours-worked');
        if (!countdownElement) {
            console.error('Countdown element not found');
            return;
        }

        console.log('Initial countdown element text:', countdownElement.textContent);
        if (hoursWorkedElement) {
            console.log('Initial hours worked element text:', hoursWorkedElement.textContent);
        }

        const timerBar = document.querySelector('.timer-bar');

        // Get the server-provided values for hours worked and remaining hours
        // Make these globally accessible so they can be updated by the sync function
        window.workedSeconds = 0;
        window.remainingSeconds = 0;

        // Define the workday length in seconds (8 hours) - make it global
        window.workDaySeconds = 8 * 3600;

        // First, try to get the total hours worked for the day from the server data
        try {
            // Check if we have server-provided data in the page
            const serverHoursWorked = document.querySelector('[data-server-hours-worked]');
            const serverRemainingHours = document.querySelector('[data-server-remaining-hours]');

            // Get the current date for logging
            const today = new Date().toISOString().split('T')[0];
            console.log(`Initializing timer for date: ${today}`);

            if (serverHoursWorked && serverRemainingHours) {
                // Always use the total hours worked for the day from the server
                const hoursWorked = parseFloat(serverHoursWorked.getAttribute('data-server-hours-worked') || '0');
                const remainingHours = parseFloat(serverRemainingHours.getAttribute('data-server-remaining-hours') || '8');

                if (!isNaN(hoursWorked) && !isNaN(remainingHours)) {
                    window.workedSeconds = Math.max(0, hoursWorked * 3600);
                    window.remainingSeconds = Math.max(0, remainingHours * 3600);
                    console.log('Using server-provided data - Total hours worked today:', hoursWorked, 'Remaining hours:', remainingHours);
                    console.log('This includes all clock-in entries for today, not just the current session');

                    // Store the total hours worked for the day in a global variable
                    // This will be used to ensure the timer doesn't reset when clocking in again
                    window.totalHoursWorkedToday = hoursWorked;
                    console.log('Stored total hours worked today:', window.totalHoursWorkedToday);
                }
            }
        } catch (error) {
            console.error('Error getting server data:', error);
        }

        // If server data isn't available, try data attributes
        if (window.workedSeconds === 0) {
            const hoursWorkedData = document.getElementById('hours-worked-data');
            if (hoursWorkedData) {
                const totalHoursWorked = parseFloat(hoursWorkedData.getAttribute('data-total-hours-worked') || '0');
                if (!isNaN(totalHoursWorked)) {
                    window.workedSeconds = Math.max(0, totalHoursWorked * 3600);
                    console.log('Using total hours worked from data attribute:', totalHoursWorked, 'hours =', window.workedSeconds, 'seconds');

                    // Calculate remaining seconds based on total hours worked
                    window.remainingSeconds = Math.max(0, window.workDaySeconds - window.workedSeconds);
                    console.log('Calculated remaining seconds:', window.remainingSeconds);

                    // Store the total hours worked for the day in a global variable
                    window.totalHoursWorkedToday = totalHoursWorked;
                    console.log('Stored total hours worked today from data attribute:', window.totalHoursWorkedToday);
                }
            }
        }

        // If data attributes aren't available, fall back to parsing the display elements
        if (window.workedSeconds === 0) {
            try {
                // Parse the remaining time from the countdown element
                const remainingTime = parseTimeString(countdownElement.textContent);
                window.remainingSeconds = Math.max(0, remainingTime.hours * 3600 + remainingTime.minutes * 60);
                console.log('Parsed remaining seconds from display:', window.remainingSeconds);

                // Parse the worked time from the hours worked element
                if (hoursWorkedElement) {
                    const workedTime = parseTimeString(hoursWorkedElement.textContent);
                    window.workedSeconds = Math.max(0, workedTime.hours * 3600 + workedTime.minutes * 60);
                    console.log('Parsed worked seconds from display:', window.workedSeconds);

                    // Store the total hours worked for the day in a global variable
                    window.totalHoursWorkedToday = window.workedSeconds / 3600;
                    console.log('Stored total hours worked today from display:', window.totalHoursWorkedToday);
                }
            } catch (error) {
                console.error('Error parsing time from display elements:', error);
                // Use default values if parsing fails
                window.remainingSeconds = window.workDaySeconds; // 8 hours in seconds
                window.workedSeconds = 0;
                window.totalHoursWorkedToday = 0;
            }
        }

        // Final sanity check - ensure the values make sense
        if (window.workedSeconds + window.remainingSeconds > window.workDaySeconds + 300) { // Allow a small buffer for rounding
            console.warn('Invalid time values detected. Total exceeds workday length. Resetting to defaults.');
            window.workedSeconds = 0;
            window.remainingSeconds = window.workDaySeconds;
        }

        // Get the clock-in time for reference (to determine if the user is still clocked in)
        const clockInTimeText = document.getElementById('clockInTime');
        let hasActiveEntry = clockInTimeText && clockInTimeText.textContent !== '--:--';

        // If the user is not clocked in, don't start the timer
        if (!hasActiveEntry) {
            console.log('User is not clocked in. Timer not started.');
            return;
        }

        // Log the initial values for debugging
        console.log('Timer initialization:');
        console.log('- Clock-in time:', clockInTimeText ? clockInTimeText.textContent : 'Not found');
        console.log('- Initial worked seconds:', workedSeconds, '=', (workedSeconds / 3600).toFixed(2), 'hours');
        console.log('- Initial remaining seconds:', remainingSeconds, '=', (remainingSeconds / 3600).toFixed(2), 'hours');
        console.log('- Has active entry:', hasActiveEntry);

        // Get the current status to determine if we should increment the worked time
        const statusTextCheckElement = document.getElementById('statusText');
        const isActiveStatus = statusTextCheckElement && (
            statusTextCheckElement.textContent.includes('active') ||
            statusTextCheckElement.textContent.includes('Active') ||
            !statusTextCheckElement.textContent.includes('break') &&
            !statusTextCheckElement.textContent.includes('Break') &&
            !statusTextCheckElement.textContent.includes('unavailable') &&
            !statusTextCheckElement.textContent.includes('Unavailable')
        );

        console.log('Status text:', statusTextCheckElement ? statusTextCheckElement.textContent : 'Not found');
        console.log('Is active status:', isActiveStatus);

        // Get break time for reference
        const totalBreakTimeText = document.getElementById('totalBreakTime');
        let breakMinutes = 0;
        if (totalBreakTimeText && totalBreakTimeText.textContent !== '0 mins') {
            const breakMatch = totalBreakTimeText.textContent.match(/(\d+)\s*mins/);
            if (breakMatch && breakMatch[1]) {
                breakMinutes = parseInt(breakMatch[1], 10);
                console.log('Break minutes:', breakMinutes);
            }
        }
        console.log('Final initial worked seconds:', workedSeconds);

        // Calculate initial percentage based on worked time
        const workDaySeconds = 8 * 3600; // 8 hours in seconds
        let initialPercentage = Math.min(100, Math.max(0, (workedSeconds / workDaySeconds) * 100));

        // Update progress bar with initial percentage
        if (timerBar) {
            timerBar.style.width = `${initialPercentage}%`;
        }

        // Check if the user is clocked in
        const statusText = document.getElementById('statusText');
        // Check for any indication that the user is actively working
        const isActivelyWorking = statusText && (
            statusText.textContent.includes('Active') ||
            statusText.textContent.includes('Currently clocked in') ||
            statusText.textContent.includes('Status: active') ||
            statusText.textContent.includes('Status: Active') ||
            !statusText.textContent.includes('Not clocked in')
        );

        console.log('Status text:', statusText ? statusText.textContent : 'Not found');
        console.log('Is actively working:', isActivelyWorking);

        // Force start the timer if we have an active entry (debug)
        if (hasActiveEntry && !isActivelyWorking) {
            console.log('Found active entry but status text does not indicate active. Forcing timer start.');
            console.log('Clock in time:', clockInTimeText.textContent);
        }

        // Start the timer if the user has an active entry
        if (hasActiveEntry) {
            // Start timer immediately
            startTimer();
            console.log('Starting timer. User has an active entry. Clock in time:', clockInTimeText ? clockInTimeText.textContent : 'Not found');
            console.log('Initial worked seconds:', workedSeconds, 'Initial remaining seconds:', remainingSeconds);
        } else {
            console.log('User is not clocked in. Timer not started.');
        }

        function startTimer() {
            // Set the global flag to indicate a timer is running
            window.timerRunning = true;

            console.log('Starting timer with worked seconds:', workedSeconds);

            // Track the last update time to calculate elapsed time
            let lastUpdateTime = new Date();

            // Use a shorter interval for more responsive updates
            const timer = setInterval(() => {
                // Get the current time
                const now = new Date();

                // Calculate elapsed time since last update in seconds
                const elapsedMs = now - lastUpdateTime;
                const elapsedSeconds = Math.floor(elapsedMs / 1000);

                // Only update if at least 1 second has passed
                if (elapsedSeconds < 1) {
                    return;
                }

                // Update the last update time
                lastUpdateTime = now;

                // Check if the user still has an active entry (clocked in)
                const clockInTimeText = document.getElementById('clockInTime');
                hasActiveEntry = clockInTimeText && clockInTimeText.textContent !== '--:--';

                // Only stop the timer if the user has clocked out
                if (!hasActiveEntry) {
                    console.log('User has clocked out. Clock in time:', clockInTimeText ? clockInTimeText.textContent : 'Not found');
                    console.log('Stopping timer.');
                    clearInterval(timer);
                    window.timerRunning = false; // Reset the flag when the timer stops
                    return;
                }

                // Check the current status to determine if we should increment the worked time
                const statusText = document.getElementById('statusText');
                let isActiveStatus = false;

                if (statusText) {
                    const statusContent = statusText.textContent.toLowerCase();
                    // Check if status contains 'active' and doesn't contain 'break' or 'unavailable'
                    isActiveStatus = statusContent.includes('active') &&
                                    !statusContent.includes('break') &&
                                    !statusContent.includes('unavailable');

                    // If no specific status is found, default to active
                    if (!statusContent.includes('active') &&
                        !statusContent.includes('break') &&
                        !statusContent.includes('unavailable')) {
                        isActiveStatus = true;
                    }
                } else {
                    // If no status element is found, default to active if user is clocked in
                    isActiveStatus = hasActiveEntry;
                }

                console.log('Current status:', statusText ? statusText.textContent : 'Not found');
                console.log('Is active status:', isActiveStatus);

                // Only increment worked time if the user is in active status
                if (isActiveStatus) {
                    // Increase worked time by the elapsed seconds
                    window.workedSeconds += elapsedSeconds;
                    console.log(`Incremented worked seconds by ${elapsedSeconds} to:`, window.workedSeconds);

                    // Recalculate remaining time based on the updated total worked time
                    window.remainingSeconds = Math.max(0, window.workDaySeconds - window.workedSeconds);
                    console.log(`Recalculated remaining seconds:`, window.remainingSeconds);
                } else {
                    console.log('User is not in active status. Not incrementing worked time.');
                }

                // Update the display
                if (window.remainingSeconds <= 0) {
                    clearInterval(timer);
                    countdownElement.textContent = '0:00';
                    if (hoursWorkedElement) {
                        // Ensure worked seconds is not negative
                        const safeWorkedSeconds = Math.max(0, window.workedSeconds);
                        console.log('Safe worked seconds for display (time complete):', safeWorkedSeconds);

                        // Calculate hours, minutes, and seconds
                        const workedHours = Math.floor(safeWorkedSeconds / 3600);
                        const workedMinutesTotal = Math.floor((safeWorkedSeconds % 3600) / 60);

                        // Force update the display
                        const newWorkedTimeText = `${workedHours}:${workedMinutesTotal.toString().padStart(2, '0')}`;
                        hoursWorkedElement.textContent = newWorkedTimeText;
                        console.log(`Updated worked hours display (time complete) to: ${newWorkedTimeText}`);
                    }
                    if (timerBar) {
                        timerBar.style.width = '100%';
                    }

                    // Show a notification that the workday is complete
                    if (typeof showNotification === 'function') {
                        showNotification('Your 8-hour workday is complete!', 'success');
                    }

                    return;
                }

                // Update remaining hours display
                // Ensure remaining seconds is not negative
                const safeRemainingSeconds = Math.max(0, window.remainingSeconds);
                const remainingHours = Math.floor(safeRemainingSeconds / 3600);
                const remainingMinutesTotal = Math.floor((safeRemainingSeconds % 3600) / 60);
                const remainingSecondsOnly = Math.floor(safeRemainingSeconds % 60);

                // Format the display with hours, minutes, and seconds
                const formattedRemaining = `${remainingHours}:${remainingMinutesTotal.toString().padStart(2, '0')}:${remainingSecondsOnly.toString().padStart(2, '0')}`;

                // Update the display with hours and minutes only for consistency
                countdownElement.textContent = `${remainingHours}:${remainingMinutesTotal.toString().padStart(2, '0')}`;
                console.log(`Updated remaining time: ${formattedRemaining}`);

                // Update worked hours display
                if (hoursWorkedElement) {
                    // Ensure worked seconds is not negative
                    const safeWorkedSeconds = Math.max(0, window.workedSeconds);

                    // Calculate hours, minutes, and seconds
                    const workedHours = Math.floor(safeWorkedSeconds / 3600);
                    const workedMinutesTotal = Math.floor((safeWorkedSeconds % 3600) / 60);
                    const workedSecondsOnly = Math.floor(safeWorkedSeconds % 60);

                    // Format the full display with hours, minutes, and seconds
                    const formattedWorked = `${workedHours}:${workedMinutesTotal.toString().padStart(2, '0')}:${workedSecondsOnly.toString().padStart(2, '0')}`;
                    console.log(`Full worked time: ${formattedWorked}`);

                    // Update the display with hours and minutes only for consistency
                    const displayText = `${workedHours}:${workedMinutesTotal.toString().padStart(2, '0')}`;
                    hoursWorkedElement.textContent = displayText;
                    console.log(`Updated worked hours display to: ${displayText}`);

                    // Update the data attributes with the current total hours worked
                    const currentHoursWorked = safeWorkedSeconds / 3600;
                    hoursWorkedElement.setAttribute('data-total-hours-worked', currentHoursWorked.toString());
                    hoursWorkedElement.setAttribute('data-server-hours-worked', currentHoursWorked.toString());

                    // Also update the hidden data element if it exists
                    const hoursWorkedData = document.getElementById('hours-worked-data');
                    if (hoursWorkedData) {
                        hoursWorkedData.setAttribute('data-total-hours-worked', currentHoursWorked.toString());
                        hoursWorkedData.setAttribute('data-server-hours-worked', currentHoursWorked.toString());
                    }
                }

                // Update progress bar
                if (timerBar) {
                    const percentage = Math.min(100, Math.max(0, (window.workedSeconds / workDaySeconds) * 100));
                    timerBar.style.width = `${percentage}%`;
                }

                // Log the current time to help debug timing issues
                console.log(`Timer update at: ${now.toLocaleTimeString()}`);

                // Every minute, update the data attributes to ensure they stay in sync
                if (elapsedSeconds % 60 === 0) {
                    const hoursWorkedData = document.getElementById('hours-worked-data');
                    const hoursWorkedElement = document.getElementById('hours-worked');
                    const remainingHoursData = document.getElementById('remaining-hours-data');
                    const countdownElement = document.getElementById('countdown-timer');

                    if (hoursWorkedData && hoursWorkedElement) {
                        // Update the data attributes with the current values
                        // Use the global totalHoursWorkedToday variable to ensure we don't reset
                        // when clocking in again on the same day
                        const currentHoursWorked = window.workedSeconds / 3600;

                        // Update the global total hours worked for the day
                        window.totalHoursWorkedToday = currentHoursWorked;

                        // Update the data attributes
                        hoursWorkedData.setAttribute('data-total-hours-worked', currentHoursWorked.toString());
                        hoursWorkedElement.setAttribute('data-total-hours-worked', currentHoursWorked.toString());
                        hoursWorkedData.setAttribute('data-server-hours-worked', currentHoursWorked.toString());
                        hoursWorkedElement.setAttribute('data-server-hours-worked', currentHoursWorked.toString());

                        console.log('Updated data attributes with current hours worked:', currentHoursWorked);
                    }

                    if (remainingHoursData && countdownElement) {
                        // Update the remaining hours data attribute
                        const currentRemainingHours = window.remainingSeconds / 3600;
                        remainingHoursData.setAttribute('data-server-remaining-hours', currentRemainingHours.toString());
                        countdownElement.setAttribute('data-server-remaining-hours', currentRemainingHours.toString());

                        console.log('Updated data attributes with current remaining hours:', currentRemainingHours);
                    }

                    // Log the current values for debugging
                    console.log('Current worked seconds:', window.workedSeconds, '=', (window.workedSeconds / 3600).toFixed(2), 'hours');
                    console.log('Current remaining seconds:', window.remainingSeconds, '=', (window.remainingSeconds / 3600).toFixed(2), 'hours');
                    console.log('Total hours worked today:', window.totalHoursWorkedToday);
                }
            }, 1000); // Update every second for more responsive display
        }

        // Parse time string in format "H:MM"
        function parseTimeString(timeStr) {
            try {
                if (!timeStr) {
                    console.warn('Empty time string');
                    return { hours: 0, minutes: 0 };
                }

                // Clean up the input string
                const cleanTimeStr = timeStr.toString().trim();
                console.log('Parsing time string:', cleanTimeStr);

                // Handle special case for "--:--" or similar (placeholder)
                if (cleanTimeStr.includes('--')) {
                    console.warn('Placeholder time format detected:', cleanTimeStr);
                    return { hours: 0, minutes: 0 };
                }

                // Special case for negative values
                if (cleanTimeStr.includes('-')) {
                    console.warn('Negative time detected:', cleanTimeStr);
                    return { hours: 0, minutes: 0 };
                }

                // Check if the string is in the expected format
                if (!/^\d+:\d{2}$/.test(cleanTimeStr)) {
                    console.warn('Invalid time format:', cleanTimeStr);

                    // Try to extract numbers if possible
                    const numbers = cleanTimeStr.match(/\d+/g);
                    if (numbers && numbers.length >= 2) {
                        const hours = parseInt(numbers[0], 10);
                        const minutes = parseInt(numbers[1], 10);
                        if (!isNaN(hours) && !isNaN(minutes)) {
                            return {
                                hours: Math.max(0, hours),
                                minutes: Math.min(59, Math.max(0, minutes))
                            };
                        }
                    }

                    return { hours: 0, minutes: 0 };
                }

                const [hours, minutes] = cleanTimeStr.split(':').map(part => parseInt(part, 10));

                // Check if the parsed values are valid numbers
                if (isNaN(hours) || isNaN(minutes)) {
                    console.warn('Invalid time values:', cleanTimeStr);
                    return { hours: 0, minutes: 0 };
                }

                // Ensure values are in valid ranges
                return {
                    hours: Math.max(0, hours),
                    minutes: Math.min(59, Math.max(0, minutes))
                };
            } catch (error) {
                console.error('Error parsing time string:', error);
                return { hours: 0, minutes: 0 };
            }
        }
    }

    // Initialize the timer when the page loads, but with a slight delay to ensure all elements are loaded
    setTimeout(() => {
        // Only start the timer if the user is clocked in
        const clockInTimeText = document.getElementById('clockInTime');
        let hasActiveEntry = clockInTimeText && clockInTimeText.textContent !== '--:--';

        if (hasActiveEntry && typeof window.updateCountdown === 'function' && !window.timerRunning) {
            console.log('Initializing timer on page load');
            updateCountdown();
        } else {
            console.log('Not starting timer on page load - User is not clocked in or timer is already running');
        }
    }, 500);

    // Add animation for cards - but only once to avoid conflicts with the timer
    const cards = document.querySelectorAll('.dashboard-card, .feature-card');
    if (cards.length > 0) {
        // Add animated class directly without using IntersectionObserver
        // This avoids potential conflicts with the timer
        setTimeout(() => {
            cards.forEach(card => {
                if (!card.classList.contains('animated')) {
                    card.classList.add('animated');
                }
            });
        }, 100); // Short delay to ensure DOM is ready
    }

    // Add hover effect for table rows
    const tableRows = document.querySelectorAll('.timesheet-table tbody tr');
    if (tableRows.length > 0) {
        tableRows.forEach(row => {
            row.addEventListener('mouseenter', () => {
                row.style.transition = 'background-color 0.3s ease';
                row.style.backgroundColor = 'rgba(74, 108, 253, 0.1)';
            });

            row.addEventListener('mouseleave', () => {
                row.style.backgroundColor = '';
            });
        });
    }

    // Add scroll animation for sections
    window.addEventListener('scroll', () => {
        const sections = document.querySelectorAll('section');
        sections.forEach(section => {
            const sectionTop = section.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;
            if (sectionTop < windowHeight * 0.8) {
                section.classList.add('visible');
            }
        });
    });

    // FAQ accordion functionality
    const faqQuestions = document.querySelectorAll('.faq-question');

    if (faqQuestions) {
        faqQuestions.forEach(question => {
            question.addEventListener('click', () => {
                const answer = question.nextElementSibling;
                const isActive = answer.classList.contains('active');

                // Close all other answers
                document.querySelectorAll('.faq-answer').forEach(item => {
                    item.classList.remove('active');
                });

                // Toggle current answer
                if (!isActive) {
                    answer.classList.add('active');
                }

                // Toggle the indicator
                document.querySelectorAll('.faq-question').forEach(q => {
                    q.querySelector('.indicator').textContent = '+';
                });

                if (!isActive) {
                    question.querySelector('.indicator').textContent = '-';
                }
            });
        });
    }

    // Contact form option selection
    const contactOptions = document.querySelectorAll('.contact-option');
    const contactForm = document.querySelector('.contact-form');
    const immediateContact = document.querySelector('.immediate-contact');

    if (contactOptions && contactForm && immediateContact) {
        contactOptions.forEach(option => {
            option.addEventListener('click', function() {
                const optionType = this.getAttribute('data-type');

                if (optionType === 'form') {
                    contactForm.style.display = 'block';
                    immediateContact.style.display = 'none';
                } else if (optionType === 'immediate') {
                    contactForm.style.display = 'none';
                    immediateContact.style.display = 'block';
                }
            });
        });
    }

    // Apply Leave validation
    const applyLeaveBtn = document.getElementById('apply-leave-btn');
    const leavesRemaining = document.getElementById('leaves-remaining');

    if (applyLeaveBtn && leavesRemaining) {
        const remainingLeaves = parseInt(leavesRemaining.textContent);

        if (remainingLeaves <= 0) {
            applyLeaveBtn.classList.add('btn-disabled');
            applyLeaveBtn.disabled = true;
        }
    }

    // Timesheet page functionality
    const timesheetContainer = document.querySelector('.timesheet-table-container');
    if (!timesheetContainer) return;

    // Timer functionality
    const countdownTimer = document.getElementById('countdown-timer');
    const timerBar = document.querySelector('.timer-bar');

    if (countdownTimer) {
        // Update timer every second
        function updateTimer() {
            const timeString = countdownTimer.textContent;
            const timeParts = timeString.split(':');

            let hours = parseInt(timeParts[0]);
            let minutes = parseInt(timeParts[1]);

            // Decrease minute
            minutes -= 1;

            // Handle minute rollover
            if (minutes < 0) {
                minutes = 59;
                hours -= 1;
            }

            // Update display
            countdownTimer.textContent = `${hours}:${minutes.toString().padStart(2, '0')}`;

            // Update progress bar - assuming 8-hour workday
            const totalSeconds = hours * 3600 + minutes * 60;
            const totalWorkSeconds = 8 * 3600;
            const percentComplete = 100 - ((totalSeconds / totalWorkSeconds) * 100);

            if (timerBar) {
                timerBar.style.width = `${percentComplete}%`;
            }

            // Change color based on remaining time
            if (hours === 0 && minutes < 30) {
                countdownTimer.style.color = 'var(--danger-color)';
            } else if (hours === 0 && minutes < 60) {
                countdownTimer.style.color = 'var(--warning-color)';
            }

            // Stop if time reaches 0
            if (hours === 0 && minutes === 0) {
                clearInterval(timerInterval);
                countdownTimer.textContent = 'Time\'s up!';
            }
        }

        // Only start timer if not at 0 already
        const timeString = countdownTimer.textContent;
        const timeParts = timeString.split(':');

        let timerInterval;
        if (parseInt(timeParts[0]) > 0 || parseInt(timeParts[1]) > 0) {
            timerInterval = setInterval(updateTimer, 60000); // Update every minute
            // Run once immediately to see the effect
            updateTimer();
        }
    }

    // Quick filter buttons
    const filterButtons = document.querySelectorAll('.filter-btn');
    if (filterButtons.length) {
        filterButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                // Remove active class from all buttons
                filterButtons.forEach(b => b.classList.remove('active'));

                // Add active class to clicked button
                this.classList.add('active');

                // Show loading state
                const tableBody = document.querySelector('.timesheet-table tbody');
                tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Loading...</td></tr>';

                // In a real implementation, this would fetch data from the server
                // For demo, simulate loading
                setTimeout(() => {
                    // Reset table with new dummy data based on filter
                    populateDummyData(this.textContent.toLowerCase());
                }, 800);
            });
        });
    }

    // Action buttons
    const actionButtons = document.querySelectorAll('.action-btn');
    if (actionButtons.length) {
        actionButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const action = this.textContent.trim().toLowerCase();

                // Show feedback
                const feedbackMsg = document.createElement('div');
                feedbackMsg.classList.add('action-feedback');

                if (action.includes('start')) {
                    feedbackMsg.textContent = 'Work session started!';
                    feedbackMsg.classList.add('success-feedback');
                } else if (action.includes('break')) {
                    feedbackMsg.textContent = 'Break started. Timer paused.';
                    feedbackMsg.classList.add('warning-feedback');
                } else if (action.includes('end')) {
                    feedbackMsg.textContent = 'Workday ended! See you tomorrow.';
                    feedbackMsg.classList.add('info-feedback');
                }

                // Append feedback to actions panel
                const actionsPanel = document.querySelector('.action-panel .panel-body');
                actionsPanel.appendChild(feedbackMsg);

                // Remove feedback after 3 seconds
                setTimeout(() => {
                    feedbackMsg.classList.add('fade-out');
                    setTimeout(() => {
                        actionsPanel.removeChild(feedbackMsg);
                    }, 500);
                }, 3000);
            });
        });
    }

    // Row action buttons
    const rowActionButtons = document.querySelectorAll('.row-action-btn');
    if (rowActionButtons.length) {
        rowActionButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const action = this.getAttribute('title').toLowerCase();
                const row = this.closest('tr');

                if (action === 'edit') {
                    // In a real app, this would open an edit form
                    row.classList.add('highlight-row');
                    setTimeout(() => {
                        row.classList.remove('highlight-row');
                    }, 2000);
                } else if (action === 'view details') {
                    // In a real app, this would open a details modal
                    // For demo, toggle a details row
                    const nextRow = row.nextElementSibling;

                    if (nextRow && nextRow.classList.contains('details-row')) {
                        nextRow.remove();
                    } else {
                        const detailsRow = document.createElement('tr');
                        detailsRow.classList.add('details-row');

                        const detailsCell = document.createElement('td');
                        detailsCell.setAttribute('colspan', '7');
                        detailsCell.innerHTML = `
                            <div class="details-content">
                                <h4>Time Entry Details</h4>
                                <div class="details-grid">
                                    <div class="detail-item">
                                        <span class="detail-label">Status:</span>
                                        <span class="detail-value">Completed</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">Tasks:</span>
                                        <span class="detail-value">Development, Meetings</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">Notes:</span>
                                        <span class="detail-value">Worked on UI improvements and attended team meeting</span>
                                    </div>
                                </div>
                            </div>
                        `;

                        detailsRow.appendChild(detailsCell);
                        row.after(detailsRow);
                    }
                }
            });
        });
    }

    // Helper function to populate table with dummy data
    function populateDummyData(filter) {
        const tableBody = document.querySelector('.timesheet-table tbody');
        let dummyData = [];

        // Generate different dummy data based on filter
        if (filter === 'daily' || filter === 'this week') {
            dummyData = [
                { date: 'Today', login: '9:00 AM', logout: '5:30 PM', pause: '45 min', unavailable: '15 min', totalAvailable: '7.5 hrs' },
                { date: 'Yesterday', login: '8:45 AM', logout: '5:15 PM', pause: '60 min', unavailable: '30 min', totalAvailable: '7.0 hrs' }
            ];
        } else if (filter === 'weekly' || filter === 'last week') {
            dummyData = [
                { date: 'Mon, June 10', login: '9:00 AM', logout: '5:30 PM', pause: '45 min', unavailable: '15 min', totalAvailable: '7.5 hrs' },
                { date: 'Tue, June 11', login: '8:45 AM', logout: '5:15 PM', pause: '60 min', unavailable: '30 min', totalAvailable: '7.0 hrs' },
                { date: 'Wed, June 12', login: '9:15 AM', logout: '6:00 PM', pause: '30 min', unavailable: '0 min', totalAvailable: '8.25 hrs' },
                { date: 'Thu, June 13', login: '8:30 AM', logout: '4:45 PM', pause: '45 min', unavailable: '15 min', totalAvailable: '7.25 hrs' },
                { date: 'Fri, June 14', login: '9:00 AM', logout: '5:00 PM', pause: '45 min', unavailable: '0 min', totalAvailable: '7.25 hrs' }
            ];
        } else {
            dummyData = [
                { date: 'Week 23', login: '-', logout: '-', pause: '-', unavailable: '-', totalAvailable: '37.5 hrs' },
                { date: 'Week 24', login: '-', logout: '-', pause: '-', unavailable: '-', totalAvailable: '40.0 hrs' },
                { date: 'Week 25', login: '-', logout: '-', pause: '-', unavailable: '-', totalAvailable: '35.75 hrs' },
                { date: 'Week 26', login: '-', logout: '-', pause: '-', unavailable: '-', totalAvailable: '32.5 hrs' }
            ];
        }

        // Clear table and add new rows
        tableBody.innerHTML = '';

        dummyData.forEach(entry => {
            const row = document.createElement('tr');

            row.innerHTML = `
                <td>${entry.date}</td>
                <td>${entry.login}</td>
                <td>${entry.logout}</td>
                <td>${entry.pause}</td>
                <td>${entry.unavailable}</td>
                <td>${entry.totalAvailable}</td>
                <td class="row-actions">
                    <button class="row-action-btn" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="row-action-btn" title="View Details"><i class="fas fa-eye"></i></button>
                </td>
            `;

            tableBody.appendChild(row);
        });

        // Reattach event listeners to new row action buttons
        const newRowActionButtons = document.querySelectorAll('.row-action-btn');
        if (newRowActionButtons.length) {
            newRowActionButtons.forEach(btn => {
                btn.addEventListener('click', function() {
                    const action = this.getAttribute('title').toLowerCase();
                    const row = this.closest('tr');

                    if (action === 'edit') {
                        row.classList.add('highlight-row');
                        setTimeout(() => {
                            row.classList.remove('highlight-row');
                        }, 2000);
                    } else if (action === 'view details') {
                        const nextRow = row.nextElementSibling;

                        if (nextRow && nextRow.classList.contains('details-row')) {
                            nextRow.remove();
                        } else {
                            const detailsRow = document.createElement('tr');
                            detailsRow.classList.add('details-row');

                            const detailsCell = document.createElement('td');
                            detailsCell.setAttribute('colspan', '7');
                            detailsCell.innerHTML = `
                                <div class="details-content">
                                    <h4>Time Entry Details</h4>
                                    <div class="details-grid">
                                        <div class="detail-item">
                                            <span class="detail-label">Status:</span>
                                            <span class="detail-value">Completed</span>
                                        </div>
                                        <div class="detail-item">
                                            <span class="detail-label">Tasks:</span>
                                            <span class="detail-value">Development, Meetings</span>
                                        </div>
                                        <div class="detail-item">
                                            <span class="detail-label">Notes:</span>
                                            <span class="detail-value">Worked on UI improvements and attended team meeting</span>
                                        </div>
                                    </div>
                                </div>
                            `;

                            detailsRow.appendChild(detailsCell);
                            row.after(detailsRow);
                        }
                    }
                });
            });
        }
    }
});

// Time Tracking Functionality
document.addEventListener('DOMContentLoaded', () => {
    setupTimeTracking();
});

function setupTimeTracking() {
    // Clock In button
    const clockInBtn = document.getElementById('clockInBtn');
    if (clockInBtn) {
        clockInBtn.addEventListener('click', async () => {
            try {
                // First check for inconsistent timesheet state
                const stateFixed = await checkAndFixTimesheetState();
                if (stateFixed) {
                    console.log('Fixed inconsistent timesheet state before clock-in');
                    // Wait a moment for the UI to update
                    await new Promise(resolve => setTimeout(resolve, 500));
                }

                // Now proceed with clock-in
                const data = await sendTimeTrackingRequest('/api/clock-in');

                // Check if this is a force clock-in scenario
                if (data.canForceClockIn && data.activeEntry) {
                    console.log('Detected force clock-in scenario from sendTimeTrackingRequest');
                    // Handle the force clock-in scenario

                    // Calculate how long the entry has been active
                    const startTime = new Date(data.activeEntry.start_time);
                    const now = new Date();
                    const hoursActive = ((now - startTime) / (1000 * 60 * 60)).toFixed(1);

                    // Ask the user if they want to force clock in
                    const confirmForce = confirm(
                        `You appear to have an active timesheet entry from ${startTime.toLocaleString()} (${hoursActive} hours ago) ` +
                        `that was never properly closed.\n\n` +
                        `Would you like to automatically close this entry and clock in now?\n\n` +
                        `Note: This will calculate the hours worked for the previous entry and submit it.`
                    );

                    if (confirmForce) {
                        console.log('User confirmed force clock in');
                        try {
                            // Send force clock-in request
                            const forceData = await sendTimeTrackingRequest('/api/clock-in', 'POST', { force: true });
                            showNotification(forceData.message || 'Successfully forced clock in!', 'success');
                            reloadPage();
                            return; // Exit early
                        } catch (forceError) {
                            showNotification(`Force clock in failed: ${forceError}`, 'error');
                            return; // Exit early
                        }
                    } else {
                        showNotification('Clock in cancelled.', 'warning');
                        return; // Exit early
                    }
                }

                // Normal success case
                if (data.success) {
                    showNotification(data.message || 'Clocked in successfully!', 'success');
                    reloadPage();
                }
            } catch (error) {
                // We've already handled the force clock-in scenario in the main flow,
                // so this catch block should only handle unexpected errors
                console.error('Unexpected error during clock-in:', error);
                showNotification(`Error during clock-in: ${error}`, 'error');
            }
        });
    }

    // Clock Out button is handled in timesheet.ejs
    // We don't add an event listener here to avoid duplicate requests

    // Start Break button
    const startBreakBtn = document.getElementById('startBreakBtn');
    if (startBreakBtn) {
        startBreakBtn.addEventListener('click', () => {
            sendTimeTrackingRequest('/api/start-break')
                .then(data => {
                    if (data.success) {
                        showNotification('Break started!', 'warning');
                        reloadPage();
                    }
                })
                .catch(error => {
                    showNotification(error, 'error');
                });
        });
    }

    // End Break button
    const endBreakBtn = document.getElementById('endBreakBtn');
    if (endBreakBtn) {
        endBreakBtn.addEventListener('click', () => {
            sendTimeTrackingRequest('/api/end-break')
                .then(data => {
                    if (data.success) {
                        showNotification('Break ended!', 'success');
                        reloadPage();
                    }
                })
                .catch(error => {
                    showNotification(error, 'error');
                });
        });
    }

    // Start Unavailable button
    const startUnavailableBtn = document.getElementById('startUnavailableBtn');
    if (startUnavailableBtn) {
        startUnavailableBtn.addEventListener('click', () => {
            sendTimeTrackingRequest('/api/start-unavailable')
                .then(data => {
                    if (data.success) {
                        showNotification('Marked as unavailable!', 'warning');
                        reloadPage();
                    }
                })
                .catch(error => {
                    showNotification(error, 'error');
                });
        });
    }

    // End Unavailable button
    const endUnavailableBtn = document.getElementById('endUnavailableBtn');
    if (endUnavailableBtn) {
        endUnavailableBtn.addEventListener('click', () => {
            sendTimeTrackingRequest('/api/end-unavailable')
                .then(data => {
                    if (data.success) {
                        showNotification('Marked as available!', 'success');
                        reloadPage();
                    }
                })
                .catch(error => {
                    showNotification(error, 'error');
                });
        });
    }

    // Auto-refresh timesheet status more frequently to keep the timer in sync
    if (document.querySelector('.time-tracking-panel')) {
        // Set up a more frequent sync for the timer
        setInterval(() => {
            // Update the timesheet status to ensure accurate data
            console.log('Syncing timer with server data');
            updateTimesheetStatus(false, true); // Pass true for syncTimerOnly
        }, 60000); // Update every minute for better accuracy
    }
}

// Function to check for and fix inconsistent timesheet states
async function checkAndFixTimesheetState() {
    try {
        console.log('Checking for inconsistent timesheet state...');
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('checkAndFixTimesheetState: No token found, cannot check state.');
            return false;
        }

        // Get the current UI state
        const statusText = document.getElementById('statusText');
        const clockInTimeText = document.getElementById('clockInTime');
        const uiShowsActive = statusText && (
            statusText.textContent.toLowerCase().includes('active') ||
            statusText.textContent.toLowerCase().includes('on break') ||
            statusText.textContent.toLowerCase().includes('unavailable')
        );
        const uiShowsClockedIn = clockInTimeText && clockInTimeText.textContent !== '--:--';

        // Get the server state
        const response = await fetch('/api/status', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            console.error('Failed to fetch timesheet status:', response.status);
            return false;
        }

        const data = await response.json();
        const serverHasActiveEntry = data.activeEntry !== null && data.activeEntry !== undefined;

        // Check for inconsistency
        const isInconsistent = (
            (uiShowsActive && !serverHasActiveEntry) || // UI shows active but server doesn't
            (!uiShowsActive && serverHasActiveEntry) || // UI doesn't show active but server does
            (uiShowsClockedIn && !serverHasActiveEntry) || // UI shows clocked in but server doesn't
            (!uiShowsClockedIn && serverHasActiveEntry) // UI doesn't show clocked in but server does
        );

        if (isInconsistent) {
            console.warn('Detected inconsistent timesheet state!');
            console.log('UI state - Shows active:', uiShowsActive, 'Shows clocked in:', uiShowsClockedIn);
            console.log('Server state - Has active entry:', serverHasActiveEntry);

            // Refresh the UI to match the server state
            await updateTimesheetStatus(true); // Force update
            return true;
        }

        console.log('Timesheet state is consistent.');
        return false;
    } catch (error) {
        console.error('Error checking timesheet state:', error);
        return false;
    }
}

// Update timesheet status without full page reload
async function updateTimesheetStatus(forceUpdate = false, syncTimerOnly = false) {
    try {
        const token = localStorage.getItem('token'); // Retrieve the token
        if (!token) {
            console.error('updateTimesheetStatus: No token found, cannot update status.');
            // Optionally stop the interval if token is permanently missing?
            // clearInterval(intervalId); // Need to manage intervalId scope
            return; // Don't attempt fetch without token
        }

        const response = await fetch('/api/status', {
             headers: {
                 'Authorization': `Bearer ${token}` // Add the Authorization header
             }
        });

        // Check for non-OK responses (like 401, 403)
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({})); // Attempt to get error details
            const errorMessage = errorData.error || errorData.message || `Failed to fetch status: ${response.status}`;
            console.error('Error updating timesheet status:', errorMessage);
            // If unauthorized (401/403), maybe stop trying or redirect?
            if (response.status === 401 || response.status === 403) {
                 console.warn('Unauthorized access to timesheet status. Stopping updates or redirecting might be needed.');
                 // Potentially clear interval or redirect here
            }
            return; // Stop processing on error
        }

        const data = await response.json();

        // Update UI directly without starting a new timer
        // This avoids conflicts with the existing timer
        const hoursWorkedElement = document.getElementById('hours-worked');
        const countdownElement = document.getElementById('countdown-timer');
        const timerBar = document.querySelector('.timer-bar');

        // Update hours worked display - but only if the user is clocked in or the display is empty
        if (hoursWorkedElement && data.hoursWorked !== undefined) {
            // Check if the user is clocked out
            const isUserClockedOut = !data.activeEntry;
            const currentDisplay = hoursWorkedElement.textContent;

            // Only update if the user is clocked in or the display is empty/invalid
            if (!isUserClockedOut || currentDisplay === '--:--' || !currentDisplay.match(/^\d+:\d{2}$/)) {
                const hoursWorked = Math.floor(data.hoursWorked);
                const minutesWorked = Math.round((data.hoursWorked % 1) * 60);

                // Handle case where minutes might be 60 due to rounding
                let displayHours = hoursWorked;
                let displayMinutes = minutesWorked;
                if (displayMinutes === 60) {
                    displayHours += 1;
                    displayMinutes = 0;
                }

                const newDisplay = `${displayHours}:${displayMinutes.toString().padStart(2, '0')}`;
                hoursWorkedElement.textContent = newDisplay;
                console.log(`Updated hours worked display: ${newDisplay}`);

                // Update the data attributes with the total hours worked and remaining hours
                if (data.hoursWorked !== undefined) {
                    const hoursWorkedDataElement = document.getElementById('hours-worked-data');
                    const remainingHoursDataElement = document.getElementById('remaining-hours-data');
                    const countdownElement = document.getElementById('countdown-timer');

                    // Store the total hours worked for the day in a global variable
                    // This ensures the timer doesn't reset when clocking in again on the same day
                    window.totalHoursWorkedToday = data.hoursWorked;
                    console.log('Stored total hours worked today from server:', window.totalHoursWorkedToday);

                    // Update hours worked data attributes
                    if (hoursWorkedElement) {
                        hoursWorkedElement.setAttribute('data-total-hours-worked', data.hoursWorked.toString());
                        hoursWorkedElement.setAttribute('data-server-hours-worked', data.hoursWorked.toString());
                    }

                    if (hoursWorkedDataElement) {
                        hoursWorkedDataElement.setAttribute('data-total-hours-worked', data.hoursWorked.toString());
                        hoursWorkedDataElement.setAttribute('data-server-hours-worked', data.hoursWorked.toString());
                    }

                    // Update remaining hours data attributes
                    if (data.remainingHours !== undefined) {
                        if (countdownElement) {
                            countdownElement.setAttribute('data-server-remaining-hours', data.remainingHours.toString());
                        }

                        if (remainingHoursDataElement) {
                            remainingHoursDataElement.setAttribute('data-server-remaining-hours', data.remainingHours.toString());
                        }

                        console.log('Updated data attributes with remaining hours:', data.remainingHours);
                    }

                    console.log('Updated data attributes with total hours worked:', data.hoursWorked);
                }

                // If this is a timer sync request and the timer is running, update the timer values
                if (syncTimerOnly && !isUserClockedOut && window.timerRunning) {
                    console.log('Syncing running timer with server data');
                    // Update the global timer values if they exist
                    if (typeof window.updateTimerValues === 'function') {
                        // Convert hours to seconds
                        const serverWorkedSeconds = data.hoursWorked * 3600;
                        const serverRemainingSeconds = data.remainingHours * 3600;
                        window.updateTimerValues(serverWorkedSeconds, serverRemainingSeconds);
                        console.log('Updated timer values from server - Worked:', data.hoursWorked, 'Remaining:', data.remainingHours);
                    }
                }
                // Start the timer if the user is clocked in and the timer is not already running
                else if (!isUserClockedOut && typeof window.updateCountdown === 'function' && !window.timerRunning) {
                    console.log('Starting timer from updateTimesheetStatus function');
                    console.log('User status:', data.activeEntry.status);
                    // Add a small delay to ensure the display is updated before starting the timer
                    setTimeout(() => {
                        window.updateCountdown();
                    }, 100);
                } else if (!isUserClockedOut && window.timerRunning && !syncTimerOnly) {
                    // If the timer is already running and this is not a sync request, just log it
                    console.log('Timer already running, not interfering with it');
                }
            } else {
                console.log('User is clocked out. Preserving current hours worked display:', currentDisplay);
            }
        }

        // Update remaining hours display - but only if the user is clocked in or the display is empty
        if (countdownElement && data.remainingHours !== undefined) {
            // Check if the user is clocked out
            const isUserClockedOut = !data.activeEntry;
            const currentDisplay = countdownElement.textContent;

            // Only update if the user is clocked in or the display is empty/invalid
            if (!isUserClockedOut || currentDisplay === '--:--' || !currentDisplay.match(/^\d+:\d{2}$/)) {
                const hoursRemaining = Math.floor(data.remainingHours);
                const minutesRemaining = Math.round((data.remainingHours % 1) * 60);

                // Handle case where minutes might be 60 due to rounding
                let displayHours = hoursRemaining;
                let displayMinutes = minutesRemaining;
                if (displayMinutes === 60) {
                    displayHours += 1;
                    displayMinutes = 0;
                }

                const newDisplay = `${displayHours}:${displayMinutes.toString().padStart(2, '0')}`;
                countdownElement.textContent = newDisplay;
                console.log(`Updated remaining hours display: ${newDisplay}`);
            } else {
                console.log('User is clocked out. Preserving current remaining hours display:', currentDisplay);
            }
        }

        // Update progress bar - but only if the user is clocked in
        if (timerBar && data.hoursWorked !== undefined) {
            // Check if the user is clocked out
            const isUserClockedOut = !data.activeEntry;

            // Only update if the user is clocked in
            if (!isUserClockedOut) {
                const percentage = Math.min(100, Math.max(0, (data.hoursWorked / 8) * 100));
                timerBar.style.width = `${percentage}%`;
                console.log(`Updated progress bar: ${percentage}%`);
            } else {
                console.log('User is clocked out. Preserving current progress bar width:', timerBar.style.width);
            }
        }

    } catch (error) {
        // Catch fetch network errors or errors from response.json() if response wasn't JSON
        console.error('Network or processing error in updateTimesheetStatus:', error);
    }
}

// Helper function to reload the page
function reloadPage() {
    setTimeout(() => {
        window.location.reload();
    }, 1000);
}

// Notification system
function showNotification(message, type) {
    // Create notification container if it doesn't exist
    let notificationContainer = document.querySelector('.notification-container');

    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.className = 'notification-container';
        document.body.appendChild(notificationContainer);
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span>${message}</span>
        </div>
        <button class="notification-close">&times;</button>
    `;

    // Add to container
    notificationContainer.appendChild(notification);

    // Add close functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.classList.add('hiding');
        setTimeout(() => {
            notification.remove();
        }, 300);
    });

    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.classList.add('hiding');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000);
}

// Add notification styles dynamically
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    .notification-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .notification {
        min-width: 300px;
        padding: 15px;
        border-radius: 6px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        animation: slideIn 0.3s ease;
        transition: all 0.3s ease;
    }

    .notification.hiding {
        opacity: 0;
        transform: translateX(100%);
    }

    .notification.success {
        background-color: rgba(46, 213, 115, 0.2);
        border-left: 4px solid var(--success);
        color: var(--success);
    }

    .notification.error {
        background-color: rgba(246, 71, 71, 0.2);
        border-left: 4px solid var(--danger);
        color: var(--danger);
    }

    .notification.warning {
        background-color: rgba(245, 171, 53, 0.2);
        border-left: 4px solid var(--warning);
        color: var(--warning);
    }

    .notification-close {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: currentColor;
        opacity: 0.7;
        transition: opacity 0.3s ease;
    }

    .notification-close:hover {
        opacity: 1;
    }

    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
`;
document.head.appendChild(notificationStyles);

// Helper function for time tracking API requests with retry mechanism
async function sendTimeTrackingRequest(url, method = 'POST', data = null, retryCount = 0, maxRetries = 3) {
    try {
        const token = localStorage.getItem('token'); // Retrieve the token
        if (!token) {
            // Handle cases where the token might be missing (e.g., user logged out)
            // Maybe redirect to login or show an error
            console.error('No authentication token found. Please log in.');
            showNotification('Authentication error. Please log in again.', 'error');
            // Optionally, redirect to login page:
            // window.location.href = '/login';
            throw new Error('Authentication token not found');
        }

        const fetchOptions = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Add the Authorization header
            }
        };

        // Add request body if data is provided
        if (data) {
            fetchOptions.body = JSON.stringify(data);
        }

        // Add timeout to the fetch request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        fetchOptions.signal = controller.signal;

        try {
            const response = await fetch(url, fetchOptions);
            clearTimeout(timeoutId); // Clear the timeout if the request completes

            const data = await response.json();

            // Check for non-OK responses (like 401, 403, 500 etc.)
            if (!response.ok) {
                // Special handling for 'Already actively clocked in' error with canForceClockIn flag
                if (response.status === 400 && data.canForceClockIn && url.includes('/api/clock-in')) {
                    console.log('Detected force clock-in scenario in sendTimeTrackingRequest');
                    // Return the data with the error so the caller can handle it
                    return data;
                }

                // Use the error message from the server response if available
                const errorMessage = data.error || data.message || `Request failed with status ${response.status}`;
                console.error(`API Error (${response.status}):`, errorMessage);
                throw new Error(errorMessage);
            }

            return data;
        } catch (error) {
            // Catch fetch errors (network issues) or errors thrown from response check
            console.error('sendTimeTrackingRequest Error:', error);

            // Attempt to parse JSON even from error responses if needed, but handle gracefully
            let errorDetail = 'Network error or invalid response';
            if (error instanceof Error) {
                errorDetail = error.message;
            } else if (typeof error === 'string') {
                errorDetail = error;
            }

            // Avoid throwing the raw error which might include the non-JSON string like "Unauthorized"
            // Throw a consistent error message or the parsed server message if available
            throw new Error(errorDetail);
        }
    } catch (error) {
        // Catch fetch network errors or errors from response.json() if response wasn't JSON
        console.error('Network or processing error in sendTimeTrackingRequest:', error);
        // Attempt to parse JSON even from error responses if needed, but handle gracefully
        let errorDetail = 'Network error or invalid response';
        if (error instanceof Error) {
            errorDetail = error.message;
        } else if (typeof error === 'string') {
            errorDetail = error;
        }

        // Avoid throwing the raw error which might include the non-JSON string like "Unauthorized"
        // Throw a consistent error message or the parsed server message if available
        throw new Error(errorDetail);
    }
}
