/*
=================================================
JAVASCRIPT FILE FOR ADMIN PAGE AND FUNCTIONALITY
=================================================
*/

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
FUNCTIONS FOR HANDLING MODALS
=================================================
*/

let admin_modal_visible = false;

function clearOldModal() {
    let oldModal = document.querySelector('.admin-modal');
    if (oldModal) {
        oldModal.remove();
        admin_modal_visible = false;
    }
}

function showModalError(message) {
    let modalError = document.querySelector('.status-message');
    if (modalError) {
        modalError.classList.add('modal-error');
        modalError.innerHTML = message;
        fadeInEffect(modalError);
    }
}

function resetModalError() {
    let modalError = document.querySelector('.modal-body .modal-error');
    if (modalError) {
        modalError.classList.remove('modal-error');
    }
}

/*
=================================================
ROLE SPECIFIC FUNCTIONS
=================================================
*/

/// function for showing a confirmation box when deleting a role
function roleDeletionConfirmation(sender) {

    if (navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPad/i) || navigator.userAgent.match(/Android/i)) {
        window.location = "/admin/roles/delete/" + sender.getAttribute('data-role-id');
    }


    clearOldModal();

    let roleId = sender.getAttribute('data-role-id');
    let roleName = sender.getAttribute('data-role-name');
    let roleUsers = sender.getAttribute('data-role-users');

    let modal = document.createElement('div');
    modal.classList.add('admin-modal');//, { class: 'admin-modal' });
    let mHeader = document.createElement('div', { class: 'modal-header' });
    mHeader.innerHTML = `<h2 class="modal-title"><i class="fa fa-triangle-exclamation"></i> Delete '${roleName}'?</h2>`;
    modal.appendChild(mHeader);
    let mBody = document.createElement('div');
    mBody.classList.add('modal-body');

    let mBodyP = document.createElement('p');
    mBodyP.innerHTML = `<p>Are you sure you want to delete this role? <strong>All users assigned to this role will lose access to it!</strong></p>`;
    mBody.appendChild(mBodyP);

    mBodyP = document.createElement('p');
    mBodyP.classList.add('status-message');
    mBody.appendChild(mBodyP);

    let mBodyInput = document.createElement('input');
    mBodyInput.setAttribute('type', 'text');
    mBodyInput.setAttribute('placeholder', `Type '${roleName}' to confirm`);
    mBodyInput.setAttribute('id', 'confirm-role-name');
    mBodyInput.classList.add('form-control');
    mBody.appendChild(mBodyInput);

    let mBodyButton = document.createElement('button');
    mBodyButton.setAttribute('id', 'confirm-delete');
    mBodyButton.classList.add('btn', 'btn-danger');
    mBodyButton.innerHTML = 'Delete';
    mBodyButton.onclick = async function () {
        resetModalError();
        let confirmRoleName = document.getElementById('confirm-role-name').value;
        if (confirmRoleName !== roleName) {
            showModalError(`You must type '${roleName}' to confirm deletion!`);
            return false;
        }
        /*
        if (error) {
            console.error('Error deleting role:', error.message);
            alert('Error deleting role: ' + error.message);
            return false;
        }
        window.location.reload();
        */
    };
    mBody.appendChild(mBodyButton);
    let mBodyButtonCancel = document.createElement('button');
    mBodyButtonCancel.setAttribute('id', 'cancel-delete');
    mBodyButtonCancel.classList.add('btn', 'btn-secondary');
    mBodyButtonCancel.innerHTML = 'Cancel';
    mBodyButtonCancel.onclick = function () {
        clearOldModal();
    };
    mBody.appendChild(mBodyButtonCancel);
    modal.appendChild(mBody);
    document.body.appendChild(modal);
    fadeInEffect(modal);
    return false;
}