//============================================================================
// This file contains JavaScript functions to handle the page's functionality
//============================================================================

// Function for toggling the container from full width to normal width and vice versa
function expandContainer(container) {
    let containerElement = document.getElementById(container);
    if (containerElement) {
        containerElement.classList.toggle('container-full-width');
        let icon = containerElement.querySelector('#expandable-container-icon');
        if (icon) {
            icon.classList.toggle('fa-down-left-and-up-right-to-center');
            icon.classList.toggle('fa-up-right-and-down-left-from-center');
        }
    }
    return false;
}


/*
=================================================
FADE IN AND OUT EFFECT
=================================================
*/

function fadeOutEffect(node, speed = 50) {
    var fadeTarget = node;
    fadeEffectRunning = true;
    var fadeEffect = setInterval(function () {
        if (!fadeTarget.style.opacity) {
            fadeTarget.style.opacity = 1;
        }
        if (fadeTarget.style.opacity > 0) {
            fadeTarget.style.opacity -= 0.1;
        } else {
            clearInterval(fadeEffect);
            fadeEffectRunning = false;
        }
    }, speed);
}

function fadeInEffect(node, speed = 25) {
    var fadeTarget = node;
    fadeEffectRunning = true;
    fadeTarget.style.opacity = 0;
    let curopa = 0;
    var fadeEffect = setInterval(function () {
        if (fadeTarget.style.opacity < 1) {
            curopa += 0.05;
            fadeTarget.style.opacity = curopa;
        } else {
            fadeTarget.style.opacity = 1;
            clearInterval(fadeEffect);
            fadeEffectRunning = false;
        }
    }, speed);
}


/*
=================================================
MESSAGE BOX FUNCTION
=================================================
*/

function clearOldMessageBox() {
    let oldModal = document.querySelector('.modal');
    if (oldModal) {
        oldModal.remove();
    }
}

class messageBoxButton {

    static cancel = {
        id: 'cancel',
        text: 'Cancel',
        className: 'btn btn-danger',
        action: null
    };
    static cancelDelete = {
        id: 'cancelDelete',
        text: 'Cancel',
        className: 'btn btn-warning',
        action: null
    };
    static confirm = {
        id: 'confirm',
        text: 'Confirm',
        className: 'btn btn-success',
        action: null
    };
    static delete = {
        id: 'delete',
        text: 'Delete',
        className: 'btn btn-danger',
        action: null
    };
    static ok = {
        id: 'ok',
        text: 'OK',
        className: 'btn btn-primary',
        action: null
    };

    constructor(id, text, className, action) {
        this.id = id;
        this.text = text;
        this.className = className;
        this.action = action;
    }
}

// test
//let btn = new messageBoxButton('test', 'Test', 'btn btn-primary', function () { });

/// modular function for showing a confirmation box
function messageBox(triggerButton, title, message, redirectTo, icon='fa-triangle-exclamation', buttons=null) {

    // Clear any old modal
    clearOldMessageBox();

    let modal = document.createElement('div');
    modal.classList.add('modal');//, { class: 'admin-modal' });

    let cbHeader = document.createElement('div')
    cbHeader.classList.add('modal-header');
    cbHeader.innerHTML = `<h2 class="modal-title"><i class="fa ${icon}"></i> '${title}'</h2>`;
    modal.appendChild(cbHeader);
    
    let cbBody = document.createElement('div');
    cbBody.classList.add('modal-body');

    let cbBodyP = document.createElement('p');
    cbBodyP.innerText = `${message}`;
    cbBody.appendChild(cbBodyP);

    if (buttons) {

        let cbBodyButtons = document.createElement('div');
        cbBodyButtons.classList.add('modal-buttons');
        cbBody.appendChild(cbBodyButtons);

        // Create a button for each button in the buttons array
        if (buttons.length > 0)
        {
            buttons.forEach((button) => {
                let cbBodyButton = document.createElement('button');
                cbBodyButton.setAttribute('id', button.id);
                cbBodyButton.setAttribute('type', 'button');
                cbBodyButton.setAttribute('class', button.className);
                cbBodyButton.innerHTML = button.text;
                if (button.action) {
    
                    cbBodyButton.onclick = button.action;
    
                } else {
    
                    /**
                     * Closes the modal box by fading it out and removing it
                     * after the fade out has finished.
                     * @param {HTMLElement} modal The modal box to close.
                     */
                    cbBodyButton.onclick = function () {
                        fadeOutEffect(modal, 50);
                        setTimeout(() => {
                            modal.remove();
                        }, 500);
                        window.location.href = redirectTo;
                    };
    
                }
                cbBodyButtons.appendChild(cbBodyButton);
    
            });
        }
    }

    modal.appendChild(cbBody);
    document.body.appendChild(modal);
    fadeInEffect(modal);
    return false;
}
