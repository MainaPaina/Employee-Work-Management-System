/*
=================================================
JAVASCRIPT FILE FOR ACCOUNT PAGE FUNCTIONALITY
=================================================
*/

// This function is used to update the password
// Args: e: event, sender: element
function updatePassword(e, sender) {
    e.preventDefault();

    showMessage('Updating password...', 'info');

    //let oldPassword = sender.querySelector('input[name="currentpassword"]').value;
    //let newPassword = form.querySelector('input[name="newpassword"]').value;
    //let confirmPassword = form.querySelector('input[name="confirmpassword"]').value;
    //if (newPassword !== confirmPassword) {
    //    alert("New password and confirmation do not match.");
    //    return;
    //}
    //fetch('/api/account/update-password', {
    //    method: 'POST',
    //    headers: {
    //        'Content-Type': 'application/json'
    //    },
    //    body: JSON.stringify({
    //        old_password: oldPassword,
    //        new_password: newPassword
    //    })
    //})
    //    .then(response => response.json())
    //    .then(data => {
    //        if (data.success) {
    //            alert("Password updated successfully.");
    //            form.reset();
    //        } else {
    //            alert("Error updating password: " + data.message);
    //        }
    //    })
    //    .catch(error => {
    //        console.error("Error:", error);
    //    });
    return false;
}