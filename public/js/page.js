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
CONFIRMATION BOX (shouldn't be in admin-client.js)
=================================================
*/

/// modular function for showing a confirmation box
function confirmationBox(triggerButton, title, confirmtext, redirectTo) {

    // Clear any old modal
    clearOldModal();

    let modal = document.createElement('div');
    modal.classList.add('admin-modal');//, { class: 'admin-modal' });
    
    let cbHeader = document.createElement('div')
    cbHeader.classList.add('modal-header');
    cbHeader.innerHTML = `<h2 class="modal-title"><i class="fa fa-triangle-exclamation"></i> '${title}'?</h2>`;
    cbodal.appendChild(cbHeader);
    
    let cbBody = document.createElement('div');
    cbBody.classList.add('modal-body');

    let cbBodyP = document.createElement('p');
    cbBodyP.innerText = `${confirmtext}`;
    cbBody.appendChild(cbBodyP);


    let cbBodyButton = document.createElement('button');
    cbBodyButton.setAttribute('id', 'confirm');
    cbBodyButton.classList.add('btn', 'btn-succsess');
    cbBodyButton.innerHTML = 'Succsess';
    cbBodyButton.onclick = async function () {
    

        // Redirect to the list of users after 2 seconds
        setTimeout(() => {
            window.location.href = `${redirectTo}`;
        }, 2000);
    };
    cbBody.appendChild(cbBodyButton);

    modal.appendChild(cbBody);
    document.body.appendChild(modal);
    fadeInEffect(modal);
    return false;
}
