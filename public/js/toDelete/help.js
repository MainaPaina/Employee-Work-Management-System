/**
 * FAQ and Contact Form functionality
 * Includes smooth animations and transitions
 */
document.addEventListener('DOMContentLoaded', function() {
    // Initialize FAQ items
    initFAQ();
    
    // Store original grid template for later use
    const contactGrid = document.getElementById("contact-grid");
    if (contactGrid) {
        window.gridTemplateProperty = getComputedStyle(contactGrid).gridTemplateColumns;
    }
    
    // Ensure contact form is hidden on page load
    const contactForm = document.getElementById("contact-form-hidden");
    if (contactForm) {
        contactForm.style.display = 'none';
        contactForm.style.opacity = '0';
    }
});

/**
 * Toggle FAQ answer visibility with animation
 */
function toggleFaqQuestions(faqAnswerID) {
    const faqAnswer = document.getElementById(faqAnswerID);
    const questionElement = faqAnswer.previousElementSibling;
    const indicator = questionElement.querySelector('.indicator');
    
    // Get current height for animation
    const isVisible = faqAnswer.classList.contains('faq-answer-visible');
    
    // Update all other FAQs to ensure only one is open at a time
    document.querySelectorAll('.faq-answer.faq-answer-visible').forEach(item => {
        if (item.id !== faqAnswerID) {
            // Close other open items
            const otherIndicator = item.previousElementSibling.querySelector('.indicator');
            otherIndicator.textContent = '+';
            item.style.maxHeight = '0';
            setTimeout(() => {
                item.classList.remove('faq-answer-visible');
            }, 300);
        }
    });
    
    // Toggle current FAQ
    if (!isVisible) {
        // Open this FAQ
        faqAnswer.classList.add('faq-answer-visible');
        indicator.textContent = '-';
        // Delay setting maxHeight to get proper animation
        setTimeout(() => {
            faqAnswer.style.maxHeight = faqAnswer.scrollHeight + 'px';
        }, 10);
    } else {
        // Close this FAQ
        indicator.textContent = '+';
        faqAnswer.style.maxHeight = '0';
        setTimeout(() => {
            faqAnswer.classList.remove('faq-answer-visible');
        }, 300);
    }
}

/**
 * Initialize FAQ functionality
 */
function initFAQ() {
    // Hide all answers initially
    document.querySelectorAll('.faq-answer').forEach(item => {
        // Force reset any previously set styles
        item.classList.remove('faq-answer-visible');
        item.style.maxHeight = '0';
        item.style.overflow = 'hidden';
        
        // Reset all indicators to plus sign
        const questionElement = item.previousElementSibling;
        if (questionElement) {
            const indicator = questionElement.querySelector('.indicator');
            if (indicator) {
                indicator.textContent = '+';
            }
        }
    });
    
    // Make FAQs keyboard accessible
    document.querySelectorAll('.faq-question').forEach(question => {
        // Add tabindex for keyboard accessibility
        question.setAttribute('tabindex', '0');
        
        // Handle keyboard events
        question.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const answerId = this.getAttribute('onclick').match(/'([^']+)'/)[1];
                toggleFaqQuestions(answerId);
            }
        });
    });
}

/**
 * Show contact form with animation
 */
function showContactForm() {
    const contactForm = document.getElementById("contact-form-hidden");
    const contactText = document.getElementById("contact-form-normal");
    const featureGrid = document.getElementById("contact-grid");
    
    // Make the form appear more quickly by displaying it immediately
    contactForm.style.display = 'block';
    contactText.style.opacity = '0';
    contactText.style.transform = 'translateY(-20px)';
    
    // Reduce timeout to make transition faster
    setTimeout(() => {
        contactText.style.display = 'none';
        
        // Adjust grid layout immediately
        featureGrid.style.gridTemplateColumns = "repeat(auto-fit, minmax(100%, 1fr))";
        
        // Show form immediately with no second delay
        contactForm.style.opacity = '1';
        contactForm.style.transform = 'translateY(0)';
        
        // Focus on first input for accessibility
        const firstInput = contactForm.querySelector('input');
        if (firstInput) firstInput.focus();
    }, 100); // Reduced from 300ms to 100ms
    
    return false;
}

/**
 * Hide contact form with animation
 */
function hideContactForm() {
    const contactForm = document.getElementById("contact-form-hidden");
    const contactText = document.getElementById("contact-form-normal");
    const featureGrid = document.getElementById("contact-grid");
    
    // Start transition
    contactForm.style.opacity = '0';
    contactForm.style.transform = 'translateY(20px)';
    
    // After form fades out
    setTimeout(() => {
        contactForm.style.display = 'none';
        contactText.style.display = 'block';
        contactText.style.opacity = '0';
        contactText.style.transform = 'translateY(-20px)';
        
        // Restore original grid
        featureGrid.style.gridTemplateColumns = window.gridTemplateProperty;
        
        // Animate in the normal text
        setTimeout(() => {
            contactText.style.opacity = '1';
            contactText.style.transform = 'translateY(0)';
        }, 50);
    }, 300);
    
    return false;
}
