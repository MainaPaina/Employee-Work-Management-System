/*
=================================================
JAVASCRIPT FILE FOR TOGGLING DARK AND LIGHT MODE
=================================================
*/

// This script checks if the server has been restarted and reloads the page if it has.
// It uses the Fetch API to make a request to the server and checks the response for a "started" date.

// Variable holding the started date of the server
let reloadVariableStartedDate;

// Variable holding the interval for checking for server reload
let reloadVariableCheckInterval;

// Variable holding the interval for reloading the page
let reloadVariableInterval = null;

function initReloadScript(startedDate, reloadCheckInterval = 2000) {
    
    // Asign the startedDate and reloadCheckInterval to the global variables
    reloadVariableStartedDate = startedDate;
    reloadVariableCheckInterval = reloadCheckInterval;

    reloadInterval = setInterval(reloadCallback, reloadVariableCheckInterval);

}
// funksjonen for å sjekke siste tid server ble startet
async function reloadCallback() {
    try {
        // reload path - standard er /reload
        const response = await fetch('/reload');
        // dersom svar ikke er OK - gi en feilmelding og avslutt reload intervallet
        if (!response.ok) {
            // throw an error to client
            throw new Error(`Response status: ${response.status}`);
            // clear recurring interval check
            clearInterval(reloadInterval);
        }
        // omgjør svaret fra fetch til json
        const json = await response.json();
        // sjekk om json.started er ulik startedDate variabel
        if (json.started != startedDate) 
        {
            // dersom ulik - reload nettleser med forceGet=true for å ignorere cache
            window.location.reload(true);
        }
        else
        {
            // valgfri, rapporter ingen endring - for debugging
            console.log(`no change in started date ${json.started} - ${startedDate}`);
        }
    } catch (error) {
        // annen feil, rapporter
        console.error(error.message);
        // clear recurring interval check
        clearInterval(reloadInterval);
    }
} 