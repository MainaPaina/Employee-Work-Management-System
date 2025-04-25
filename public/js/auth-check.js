/**
 * Authentication Token Check and Fix Script
 * This script checks if the authentication token is properly set in localStorage
 * and attempts to fix any issues by retrieving it from the session.
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Auth check script loaded');
    
    // Check if token exists in localStorage
    const token = localStorage.getItem('token');
    console.log('Token in localStorage:', token ? 'Found (length: ' + token.length + ')' : 'Not found');
    
    // If token doesn't exist in localStorage but exists in sessionStorage, copy it
    if (!token && sessionStorage.getItem('token')) {
        console.log('Token found in sessionStorage but not in localStorage. Copying to localStorage...');
        localStorage.setItem('token', sessionStorage.getItem('token'));
        console.log('Token copied to localStorage');
    }
    
    // If we have a session token in the page but not in localStorage, use it
    if (!localStorage.getItem('token') && window.sessionToken) {
        console.log('Using session token from page');
        localStorage.setItem('token', window.sessionToken);
        console.log('Session token saved to localStorage');
    }
    
    // Check if token exists after our fixes
    const updatedToken = localStorage.getItem('token');
    if (updatedToken) {
        console.log('Authentication token is now available');
    } else {
        console.warn('Authentication token is still missing. User may need to log in again.');
        
        // Only show notification if we're on a page that requires authentication
        if (window.location.pathname.includes('/timesheet') || 
            window.location.pathname.includes('/dashboard')) {
            // Create a notification to inform the user
            const notification = document.createElement('div');
            notification.className = 'auth-notification';
            notification.innerHTML = `
                <div class="auth-notification-content">
                    <p>Authentication token is missing. Please <a href="/account/login?return=${window.location.pathname}">log in again</a>.</p>
                    <button class="auth-notification-close">&times;</button>
                </div>
            `;
            
            // Add styles for the notification
            const style = document.createElement('style');
            style.textContent = `
                .auth-notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background-color: #f8d7da;
                    color: #721c24;
                    padding: 15px;
                    border-radius: 5px;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                    z-index: 9999;
                    animation: slideIn 0.3s ease-out;
                }
                .auth-notification-content {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                .auth-notification a {
                    color: #721c24;
                    font-weight: bold;
                    text-decoration: underline;
                }
                .auth-notification-close {
                    background: none;
                    border: none;
                    font-size: 20px;
                    cursor: pointer;
                    margin-left: 15px;
                    color: #721c24;
                }
                @keyframes slideIn {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
            `;
            
            document.head.appendChild(style);
            document.body.appendChild(notification);
            
            // Add event listener to close button
            notification.querySelector('.auth-notification-close').addEventListener('click', function() {
                notification.remove();
            });
            
            // Auto-remove after 10 seconds
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    notification.remove();
                }
            }, 10000);
        }
    }
});
