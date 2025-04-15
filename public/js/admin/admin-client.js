/*
=================================================
JAVASCRIPT FILE FOR ADMIN PAGE AND FUNCTIONALITY
=================================================
*/

/*
FROM main.js
function showMessage(message, type = 'danger');
*/


/*
=================================================
USER MANAGEMENT SPECIFIC FUNCTIONS
=================================================
*/
const create_roles = [];

async function validateFormCreateUser(e, form) {

    // Prevent form to be submitted
    e.preventDefault();

    // Show an message to the user
    showMessage('Creating user...', 'alert-info');

    // verify that all fields has data
    let formData = new FormData(form);
    let username = formData.get('username');
    let password = formData.get('password');
    let email = formData.get('email');
    let name = formData.get('name');
    let department = formData.get('department');

    // verify that username do not exists
    let usernameExists = await checkExistingUsername(username);
    if (username.length < 3 || usernameExists) {
        showMessage('Username is invalid or already exists!', 'alert-danger');
        // Prevent form from beeing submitted
        return false;
    }

    // verify that email do not exists
    let emailExists = await checkExistingEmail(email);
    if (email.length < 3 || emailExists) {
        showMessage('Email is invalid or already exists!', 'alert-danger');
        // Prevent form from beeing submitted
        return false;
    }

    // checks if any roles has been assigned
    if (create_roles && create_roles.length > 0) {

        // API Endpoint for creating a user
        const url = "/admin/api/users/create";

        // Send request to the server, as post with json data containing all the form elements
        const response = await fetch(url, {
            method: 'post',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password, email, name, department, roles: create_roles }),
        });

        // Check if the response is ok, if not show an error message
        if (!response.ok) {
            // Response not ok, show an error message
            showMessage('Error creating user: ' + response.statusText, 'alert-danger');
            // Prevent form from beeing submitted
            return false;
        }

        // Show a success message to the user
        showMessage('User created successfully! Redirecting to list.', 'alert-success');

        // Redirect to the list of users after 2 seconds
        setTimeout(() => {
            window.location.href = '/admin/users';
        }, 2000);

    }
    else { // If no roles is assigned

        // Show an error message to the user about the roles missing
        showMessage('No roles have been added, required to have at least 1 role', 'alert-danger');

        // Prevent form from beeing submitted
        return false;
    }

    // Prevent form from beeing submitted
    return false;
}

async function checkExistingUsername(username) {
    const url = "/admin/api/users/userexists";
    const response = await fetch(url, {
        method: 'post',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username }),
    });
    
    if (!response.ok) {
        return false;
    }
    return true;
}

async function checkExistingEmail(email) {
    let url = "/admin/api/users/emailexists";
    const response = await fetch(url, {
        method: 'post',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email }),
    });

    if (!response.ok) {
        return false;
    }
    return true;
}

function listRoles() {
    if (create_roles) {
        /*console.log("List user roles");*/
        const url = "/admin/api/roles/list";
        let roleList = document.getElementById("roleslist");
        fadeInEffect(roleList, 50);
        roleList.innerHTML = '';

        fetch(url)
            .then((response) => {
                return response.json();
            })
            .then((data) => {
                let roles = data;
                roles.forEach((role) => {
                    if (role.created_at) {
                        delete (role.created_at);
                    }
                    //console.log(role);
                    let span = document.createElement("span");
                    span.className = "role-badge role-badge-" + role.color + " text-lg";
                    span.innerHTML = role.name;
                    roleList.appendChild(span);

                    const hasRole = create_roles.some(r => r.id === role.id);

                    if (hasRole) {
                        let removeButton = document.createElement("a");
                        removeButton.innerHTML = " <i class='fa fa-times text-danger'></i>";
                        removeButton.onclick = function () {
                            create_roles.pop(role);
                            listRoles();
                        };
                        span.appendChild(removeButton);
                    }
                    else {
                        let addButton = document.createElement("a");
                        addButton.innerHTML = " <i class='fa fa-plus text-light'></i>";
                        addButton.onclick = function () {
                            create_roles.push(role);
                            listRoles();
                        };
                        span.appendChild(addButton);
                    }
                });
            })
    }
    else {
        console.log('Something went wrong loading roles');
    }
}
function listUserRoles() {
    console.log("List user roles");
    const url = "/admin/api/roles/list";

    let roleList = document.getElementById("roleslist");
    roleList.innerHTML = '';
    fetch(url)
        .then((response) => {
            return response.json();
        })
        .then((data) => {
            let roles = data;
            roles.forEach((role) => {
                console.log(role);
                let span = document.createElement("span");
                span.className = "role-badge role-badge-" + role.color + " text-lg";
                span.innerHTML = role.name;
                roleList.appendChild(span);

                if (role.assigendToUser) {
                    let removeButton = document.createElement("a");
                    removeButton.innerHTML = " <i class='fa fa-times text-light-red fw-bold'></i>";
                    removeButton.onclick = function () {
                        removeUserFromRole(role.id);
                    };
                    span.appendChild(removeButton);
                }
                else {
                    let addButton = document.createElement("a");
                    addButton.innerHTML = " <i class='fa fa-plus text-white fw-bold'></i>";
                    addButton.onclick = function () {
                        addUserToRole(role.id);
                    };
                    span.appendChild(addButton);
                }
            });
        })
}

function addUserToRole(role) {
    //$.ajax({
    //    type: "POST",
    //    url: "/Admin/API/Users/AddtoRole",
    //    contentType: "application/json",
    //    data: JSON.stringify({ id: id, role: role }),
    //    success: function (response) {
    //        alert("User added to role successfully.");
    //        setTimeout(() => { listUserRoles(); }, 500);
    //    },
    //    error: function () {
    //        alert("Error adding user to role.");
    //    }
    //});

}
function removeUserFromRole(roleName) {
    var id = '@Model.ViewUser.Id';
    //$.ajax({
    //    type: "POST",
    //    url: "/Admin/API/Users/RemoveFromRole",
    //    contentType: "application/json",
    //    data: JSON.stringify({ id: id, role: roleName }),
    //    success: function (response) {
    //        alert("User removed from role successfully.");
    //        setTimeout(() => { listUserRoles(); }, 500);
    //    },
    //    error: function () {
    //        alert("Error removing user from role.");
    //    }
    //});
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