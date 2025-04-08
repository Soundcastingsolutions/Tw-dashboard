// Counter for dynamic tabs
let dynamicTabCounter = 0;

// Store references to all dynamic dialers
const dynamicDialers = {};

document.addEventListener('DOMContentLoaded', function () {
    // Setup tab switching
    setupTabs();

    // Setup add tab button
    setupAddTabButton();

    // Load phone numbers for dropdowns
    loadPhoneNumbers();

    // Setup form submissions
    setupDialerForms();

    // Setup infinity loop checkboxes
    setupInfinityLoopCheckboxes();
});

function setupInfinityLoopCheckboxes() {
    // Setup TW infinity loop checkbox
    const twInfinityLoop = document.getElementById('tw-infinity-loop');
    const twRuntime = document.getElementById('tw-runtime');

    if (twInfinityLoop && twRuntime) {
        twInfinityLoop.addEventListener('change', function () {
            twRuntime.disabled = this.checked;
            if (this.checked) {
                twRuntime.setAttribute('data-previous-value', twRuntime.value);
                twRuntime.value = 1; // Set to 1 as a placeholder, but it won't be used
            } else {
                // Restore previous value if available
                const previousValue = twRuntime.getAttribute('data-previous-value');
                if (previousValue) {
                    twRuntime.value = previousValue;
                }
            }
        });
    }

    // Setup GS infinity loop checkbox
    const gsInfinityLoop = document.getElementById('gs-infinity-loop');
    const gsRuntime = document.getElementById('gs-runtime');

    if (gsInfinityLoop && gsRuntime) {
        gsInfinityLoop.addEventListener('change', function () {
            gsRuntime.disabled = this.checked;
            if (this.checked) {
                gsRuntime.setAttribute('data-previous-value', gsRuntime.value);
                gsRuntime.value = 1; // Set to 1 as a placeholder, but it won't be used
            } else {
                // Restore previous value if available
                const previousValue = gsRuntime.getAttribute('data-previous-value');
                if (previousValue) {
                    gsRuntime.value = previousValue;
                }
            }
        });
    }
}

function setupTabs() {
    const twDialerTab = document.getElementById('tw-dialer-tab');
    const gsDialerTab = document.getElementById('gs-dialer-tab');
    const twDialerContent = document.getElementById('tw-dialer-content');
    const gsDialerContent = document.getElementById('gs-dialer-content');

    // Switch to TW Dialer tab
    twDialerTab.addEventListener('click', function () {
        // Deactivate all tabs
        deactivateAllTabs();

        // Activate TW tab
        twDialerTab.classList.add('active');
        twDialerContent.classList.add('active');
    });

    // Switch to GS Dialer tab
    gsDialerTab.addEventListener('click', function () {
        // Deactivate all tabs
        deactivateAllTabs();

        // Activate GS tab
        gsDialerTab.classList.add('active');
        gsDialerContent.classList.add('active');
    });
}

function setupAddTabButton() {
    const addGsTabBtn = document.getElementById('add-gs-tab');

    addGsTabBtn.addEventListener('click', function () {
        createNewGsDialerTab();
    });
}

function deactivateAllTabs() {
    // Deactivate main tabs
    document.getElementById('tw-dialer-tab').classList.remove('active');
    document.getElementById('gs-dialer-tab').classList.remove('active');
    document.getElementById('tw-dialer-content').classList.remove('active');
    document.getElementById('gs-dialer-content').classList.remove('active');

    // Deactivate all dynamic tabs
    const dynamicTabs = document.querySelectorAll('.dynamic-tab');
    const dynamicContents = document.querySelectorAll('.dynamic-tab-content');

    dynamicTabs.forEach(tab => tab.classList.remove('active'));
    dynamicContents.forEach(content => content.classList.remove('active'));
}

function createNewGsDialerTab() {
    dynamicTabCounter++;
    const tabId = `gs-dialer-tab-${dynamicTabCounter}`;
    const contentId = `gs-dialer-content-${dynamicTabCounter}`;

    // Create new tab
    const newTab = document.createElement('div');
    newTab.className = 'tab dynamic-tab';
    newTab.id = tabId;
    newTab.innerHTML = `GS Dialer ${dynamicTabCounter} <span class="close-tab"><i class="fas fa-times"></i></span>`;

    // Insert tab before the add button
    const addButton = document.getElementById('add-gs-tab');
    addButton.parentNode.insertBefore(newTab, addButton);

    // Create tab content by cloning the original GS dialer content
    const originalContent = document.getElementById('gs-dialer-content');
    const newContent = originalContent.cloneNode(true);
    newContent.className = 'dynamic-tab-content';
    newContent.id = contentId;

    // Update IDs of all elements inside the new content
    const elementsWithId = newContent.querySelectorAll('[id]');
    elementsWithId.forEach(element => {
        const oldId = element.id;
        const newId = `${oldId}-${dynamicTabCounter}`;
        element.id = newId;
    });

    // Add the new content to the dynamic tabs container
    const dynamicTabsContainer = document.getElementById('dynamic-tabs-container');
    dynamicTabsContainer.appendChild(newContent);

    // Setup click handler for the new tab
    newTab.addEventListener('click', function (e) {
        // If clicking on the close button, remove the tab
        if (e.target.closest('.close-tab')) {
            removeGsDialerTab(tabId, contentId);
            e.stopPropagation();
            return;
        }

        // Otherwise switch to this tab
        deactivateAllTabs();
        newTab.classList.add('active');
        newContent.classList.add('active');
    });

    // Setup form submission for the new dialer
    const newForm = newContent.querySelector(`#gs-dialer-form-${dynamicTabCounter}`);
    if (newForm) {
        newForm.addEventListener('submit', function (e) {
            e.preventDefault();
            handleDynamicDialerSubmit(dynamicTabCounter);
        });
    }

    // Setup stop button for the new dialer
    const newStopBtn = newContent.querySelector(`#gs-stop-btn-${dynamicTabCounter}`);
    if (newStopBtn) {
        newStopBtn.addEventListener('click', function () {
            stopDynamicDialing(dynamicTabCounter);
        });
    }

    // Initialize state for this dialer
    dynamicDialers[dynamicTabCounter] = {
        isDialing: false,
        shouldStop: false,
        progress: 0,
        totalCalls: 0,
        completedCalls: 0,
        successfulCalls: 0,
        failedCalls: 0,
        callDetails: []
    };

    // Activate the new tab
    deactivateAllTabs();
    newTab.classList.add('active');
    newContent.classList.add('active');
}

function removeGsDialerTab(tabId, contentId) {
    // Check if the tab is currently dialing
    const tabNumber = tabId.split('-').pop();
    if (dynamicDialers[tabNumber] && dynamicDialers[tabNumber].isDialing) {
        if (!confirm('This dialer is currently active. Are you sure you want to close it?')) {
            return;
        }
        // Stop the dialing process
        dynamicDialers[tabNumber].shouldStop = true;
    }

    // Remove the tab and content
    const tab = document.getElementById(tabId);
    const content = document.getElementById(contentId);

    if (tab) tab.remove();
    if (content) content.remove();

    // If this was the active tab, activate the main GS tab
    if (tab.classList.contains('active')) {
        deactivateAllTabs();
        document.getElementById('gs-dialer-tab').classList.add('active');
        document.getElementById('gs-dialer-content').classList.add('active');
    }

    // Clean up the dialer state
    if (dynamicDialers[tabNumber]) {
        delete dynamicDialers[tabNumber];
    }
}

// Region-specific number pools for GS Dialer
const regionNumberPools = {
    usa: [
        '+12025550XXX', // Washington DC
        '+13105550XXX', // Los Angeles
        '+12125550XXX', // New York
        '+14155550XXX', // San Francisco
        '+17025550XXX'  // Las Vegas
    ],
    uk: [
        '+442075550XXX', // London
        '+441615550XXX', // Manchester
        '+441315550XXX', // Edinburgh
        '+442085550XXX', // London (outer)
        '+441175550XXX'  // Bristol
    ],
    asian: [
        '+8618550XXX',   // China
        '+919855550XXX', // India
        '+819055550XXX', // Japan
        '+6281355550XXX', // Indonesia
        '+6698755550XXX'  // Thailand
    ],
    european: [
        '+33155550XXX',  // France
        '+49305550XXX',  // Germany
        '+39065550XXX',  // Italy
        '+34915550XXX',  // Spain
        '+31205550XXX'   // Netherlands
    ]
};

// Function to generate random last 4 digits
function generateRandomLast4Digits() {
    return Math.floor(1000 + Math.random() * 9000).toString(); // 1000-9999
}

// Function to get a random number from a region pool with random last 4 digits
function getRandomNumberFromRegion(region) {
    const pool = regionNumberPools[region];
    if (!pool || pool.length === 0) {
        return null;
    }

    // Get a random number template from the pool
    const randomIndex = Math.floor(Math.random() * pool.length);
    const numberTemplate = pool[randomIndex];

    // Replace XXX with random 3 digits (keeping the format consistent)
    return numberTemplate.replace('XXX', generateRandomLast4Digits().substring(1));
}

async function loadPhoneNumbers() {
    try {
        // Try using simulateApiCall first
        let numbers;
        try {
            numbers = await simulateApiCall('numbers');
        } catch (error) {
            // If that fails, use the approach from the PHP file
            const accountSid = localStorage.getItem('accountSid') || sessionStorage.getItem('twilioAccountSid');
            const authToken = localStorage.getItem('authToken') || sessionStorage.getItem('twilioAuthToken');

            if (!accountSid || !authToken) {
                throw new Error('Authentication required');
            }

            // Make the API call to get the numbers
            const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/IncomingPhoneNumbers.json`, {
                method: 'GET',
                headers: {
                    'Authorization': 'Basic ' + btoa(accountSid + ':' + authToken)
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch phone numbers');
            }

            const data = await response.json();

            // Format the response to match our application's expected structure
            numbers = data.incoming_phone_numbers ? data.incoming_phone_numbers.map(number => ({
                phoneNumber: number.phone_number,
                friendlyName: number.friendly_name,
                voiceUrl: number.voice_url
            })) : [];
        }

        // Get TW dropdown element
        const twFromNumber = document.getElementById('tw-from-number');

        // Clear existing options
        twFromNumber.innerHTML = '';

        // Add random option
        const randomOption = document.createElement('option');
        randomOption.value = 'random';
        randomOption.textContent = 'Random (use any available number)';
        twFromNumber.appendChild(randomOption.cloneNode(true));

        if (!numbers || numbers.length === 0) {
            const noNumbersOption = document.createElement('option');
            noNumbersOption.value = '';
            noNumbersOption.textContent = 'No numbers added, please add numbers first';
            noNumbersOption.disabled = true;
            twFromNumber.appendChild(noNumbersOption);
            showNotification('No numbers available. Please add numbers first.', 'error');
            return;
        }

        if (numbers && numbers.length > 0) {
            // Add options for each number
            numbers.forEach(number => {
                const option = document.createElement('option');
                option.value = number.phoneNumber;
                option.textContent = `${number.phoneNumber} (${number.friendlyName || 'Unnamed'})`;

                // Add to TW dropdown only
                twFromNumber.appendChild(option);
            });
        } else {
            // Add a placeholder option if no numbers are available
            const noNumbersOption = document.createElement('option');
            noNumbersOption.value = '';
            noNumbersOption.textContent = 'No phone numbers available';
            noNumbersOption.disabled = true;

            twFromNumber.appendChild(noNumbersOption);
        }
    } catch (error) {
        console.error('Error loading phone numbers:', error);
        showNotification('Failed to load phone numbers. Please refresh the page.', 'error');
    }
}

function setupDialerForms() {
    // TW Dialer form
    const twDialerForm = document.getElementById('tw-dialer-form');
    const twStopBtn = document.getElementById('tw-stop-btn');

    // GS Dialer form
    const gsDialerForm = document.getElementById('gs-dialer-form');
    const gsStopBtn = document.getElementById('gs-stop-btn');

    // TW Dialer form submission
    if (twDialerForm) {
        twDialerForm.addEventListener('submit', function (e) {
            e.preventDefault();
            handleDialerSubmit('tw');
        });
    }

    // GS Dialer form submission
    if (gsDialerForm) {
        gsDialerForm.addEventListener('submit', function (e) {
            e.preventDefault();
            handleDialerSubmit('gs');
        });
    }

    // TW Stop button
    if (twStopBtn) {
        twStopBtn.addEventListener('click', function () {
            stopDialing('tw');
        });
    }

    // GS Stop button
    if (gsStopBtn) {
        gsStopBtn.addEventListener('click', function () {
            stopDialing('gs');
        });
    }
}

// Store dialing state
const dialingState = {
    tw: {
        isDialing: false,
        shouldStop: false,
        progress: 0,
        totalCalls: 0,
        completedCalls: 0,
        successfulCalls: 0,
        failedCalls: 0,
        callDetails: [] // Array to store details of each call
    },
    gs: {
        isDialing: false,
        shouldStop: false,
        progress: 0,
        totalCalls: 0,
        completedCalls: 0,
        successfulCalls: 0,
        failedCalls: 0,
        callDetails: [] // Array to store details of each call
    }
};

async function handleDynamicDialerSubmit(tabNumber) {
    // If already dialing, do nothing
    if (dynamicDialers[tabNumber].isDialing) {
        return;
    }

    // Get common form elements
    const toNumbersTextarea = document.getElementById(`gs-to-numbers-${tabNumber}`);
    const runtimeInput = document.getElementById(`gs-runtime-${tabNumber}`);
    const infinityLoopCheckbox = document.getElementById(`gs-infinity-loop-${tabNumber}`);
    const speedInput = document.getElementById(`gs-speed-${tabNumber}`);
    const submitBtn = document.getElementById(`gs-submit-btn-${tabNumber}`);
    const progressContainer = document.getElementById(`gs-progress-container-${tabNumber}`);
    const progressBar = document.getElementById(`gs-progress-${tabNumber}`);
    const progressText = document.getElementById(`gs-progress-text-${tabNumber}`);
    const resultsSummary = document.getElementById(`gs-results-summary-${tabNumber}`);

    // Get the region
    const regionSelect = document.getElementById(`gs-region-${tabNumber}`);
    const fromValue = regionSelect.value;

    // Validate form
    if (!fromValue) {
        showNotification('Please select a region', 'error');
        return;
    }

    const toNumbersText = toNumbersTextarea.value.trim();
    const infinityLoop = infinityLoopCheckbox && infinityLoopCheckbox.checked;
    const runtime = infinityLoop ? Infinity : (parseInt(runtimeInput.value, 10) || 1);
    const speed = parseInt(speedInput.value, 10) || 3;

    if (!toNumbersText) {
        showNotification('Please enter at least one destination number', 'error');
        return;
    }

    // Parse and format to numbers
    const toNumbers = parseToNumbers(toNumbersText);

    if (toNumbers.length === 0) {
        showNotification('No valid destination numbers found', 'error');
        return;
    }

    // Calculate total calls
    const totalCalls = toNumbers.length * runtime;

    // Reset dialing state
    dynamicDialers[tabNumber] = {
        isDialing: true,
        shouldStop: false,
        progress: 0,
        totalCalls: totalCalls,
        completedCalls: 0,
        successfulCalls: 0,
        failedCalls: 0,
        callDetails: [] // Reset call details array
    };

    // Show progress container
    progressContainer.style.display = 'block';
    progressBar.style.width = '0%';
    progressText.textContent = '0%';
    resultsSummary.innerHTML = '';

    // Disable form elements
    submitBtn.disabled = true;
    toNumbersTextarea.disabled = true;
    runtimeInput.disabled = true;
    speedInput.disabled = true;
    regionSelect.disabled = true;

    // Start dialing
    try {
        await startDynamicDialing(tabNumber, fromValue, toNumbers, runtime, speed);
    } catch (error) {
        showNotification(error.message || 'An error occurred while dialing', 'error');
    } finally {
        // Re-enable form elements
        submitBtn.disabled = false;
        toNumbersTextarea.disabled = false;
        runtimeInput.disabled = false;
        speedInput.disabled = false;
        regionSelect.disabled = false;

        // Reset dialing state
        dynamicDialers[tabNumber].isDialing = false;

        // Hide progress container if dialing is finished or stopped
        if (dynamicDialers[tabNumber].completedCalls === dynamicDialers[tabNumber].totalCalls ||
            dynamicDialers[tabNumber].shouldStop) {
            progressContainer.style.display = 'none';
        }
    }
}

async function handleDialerSubmit(type) {
    // If already dialing, do nothing
    if (dialingState[type].isDialing) {
        return;
    }

    // Get common form elements
    const toNumbersTextarea = document.getElementById(`${type}-to-numbers`);
    const runtimeInput = document.getElementById(`${type}-runtime`);
    const infinityLoopCheckbox = document.getElementById(`${type}-infinity-loop`);
    const speedInput = document.getElementById(`${type}-speed`);
    const submitBtn = document.getElementById(`${type}-submit-btn`);
    const progressContainer = document.getElementById(`${type}-progress-container`);
    const progressBar = document.getElementById(`${type}-progress`);
    const progressText = document.getElementById(`${type}-progress-text`);
    const resultsSummary = document.getElementById(`${type}-results-summary`);

    // Get form values based on dialer type
    let fromValue;

    if (type === 'tw') {
        // For TW Dialer, get the selected from number
        const fromNumberSelect = document.getElementById('tw-from-number');
        fromValue = fromNumberSelect.value;

        // Validate form
        if (!fromValue) {
            showNotification('Please select a from number', 'error');
            return;
        }
    } else {
        // For GS Dialer, get the selected region
        const regionSelect = document.getElementById('gs-region');
        fromValue = regionSelect.value;

        // Validate form
        if (!fromValue) {
            showNotification('Please select a region', 'error');
            return;
        }
    }

    const toNumbersText = toNumbersTextarea.value.trim();
    const infinityLoop = infinityLoopCheckbox && infinityLoopCheckbox.checked;
    const runtime = infinityLoop ? Infinity : (parseInt(runtimeInput.value, 10) || 1);
    const speed = parseInt(speedInput.value, 10) || 3;

    if (!toNumbersText) {
        showNotification('Please enter at least one destination number', 'error');
        return;
    }

    // Parse and format to numbers
    const toNumbers = parseToNumbers(toNumbersText);

    if (toNumbers.length === 0) {
        showNotification('No valid destination numbers found', 'error');
        return;
    }

    // Calculate total calls
    const totalCalls = toNumbers.length * runtime;

    // Reset dialing state
    dialingState[type] = {
        isDialing: true,
        shouldStop: false,
        progress: 0,
        totalCalls: totalCalls,
        completedCalls: 0,
        successfulCalls: 0,
        failedCalls: 0,
        callDetails: [] // Reset call details array
    };

    // Show progress container
    progressContainer.style.display = 'block';
    progressBar.style.width = '0%';
    progressText.textContent = '0%';
    resultsSummary.innerHTML = '';

    // Disable form elements
    submitBtn.disabled = true;
    toNumbersTextarea.disabled = true;
    runtimeInput.disabled = true;
    speedInput.disabled = true;

    if (type === 'tw') {
        document.getElementById('tw-from-number').disabled = true;
    } else {
        document.getElementById('gs-region').disabled = true;
    }

    // Start dialing
    try {
        await startDialing(type, fromValue, toNumbers, runtime, speed);
    } catch (error) {
        showNotification(error.message || 'An error occurred while dialing', 'error');
    } finally {
        // Re-enable form elements
        submitBtn.disabled = false;
        toNumbersTextarea.disabled = false;
        runtimeInput.disabled = false;
        speedInput.disabled = false;

        if (type === 'tw') {
            document.getElementById('tw-from-number').disabled = false;
        } else {
            document.getElementById('gs-region').disabled = false;
        }

        // Reset dialing state
        dialingState[type].isDialing = false;
    }
}

function parseToNumbers(toNumbersText) {
    // Split by commas or newlines
    const numbers = toNumbersText.split(/[,\n]/).map(n => n.trim()).filter(n => n);

    // Format numbers (add + if not present)
    return numbers.map(number => {
        if (!number.startsWith('+')) {
            return '+' + number;
        }
        return number;
    });
}

// Function to dial a number using Gridspace API for GS Dialer - using our local proxy
function dialNumberWithGridspace(toNumber, fromNumber) {
    return new Promise((resolve, reject) => {
        console.log(`Dialing ${toNumber} from ${fromNumber} using Gridspace API via local proxy`);

        // Use our local proxy that was created in the PHP directory
        const proxyUrl = 'php/gridspace_proxy.php';

        // Add call details to the results summary immediately
        const dialerResponse = document.getElementById('gs-results-summary');
        if (dialerResponse) {
            dialerResponse.innerHTML += `<p>Initiating call from ${fromNumber} to ${toNumber}...</p>`;
        }

        // Generate a timestamp for logging purposes
        const timestamp = new Date().toISOString();

        // Use a simple form POST to the proxy
        const formData = new FormData();
        formData.append('to_number', toNumber);
        formData.append('from_number', fromNumber);
        formData.append('status_url', 'https://example.com/status'); // Default status URL
        formData.append('timestamp', timestamp);

        fetch(proxyUrl, {
            method: 'POST',
            body: formData
        })
            .then(response => {
                console.log(`Proxy response status: ${response.status}`);
                if (!response.ok) {
                    throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
                }
                return response.text();
            })
            .then(text => {
                console.log('Proxy response:', text);

                let success = false;
                let actualStatus = "Call status unknown";
                let responseData = null;

                try {
                    // Try to parse the response as JSON
                    responseData = JSON.parse(text);

                    // Check for actual indicators of call success beyond HTTP status
                    // Parse the inner Gridspace API response if available
                    let gridspaceResponse = null;
                    if (responseData.response) {
                        try {
                            gridspaceResponse = JSON.parse(responseData.response);
                            console.log('Parsed Gridspace response:', gridspaceResponse);

                            // Detailed analysis of the Gridspace response
                            if (gridspaceResponse.id) {
                                // The API returned a call ID which is a good indicator
                                success = true;
                                actualStatus = "Call initiated (ID: " + gridspaceResponse.id + ")";

                                // BUT we need to be honest about real-world call status
                                dialerResponse.innerHTML += `
                                <p>Call request accepted but call completion cannot be confirmed</p>
                                <p>Call ID: ${gridspaceResponse.id}</p>
                                <div style="margin-left: 20px; padding: 5px; border-left: 3px solid #ccc; color: #666;">
                                    <small>Note: A successful API response means the call was initiated, but does not guarantee the call will connect.</small>
                                </div>
                            `;
                            } else if (gridspaceResponse.error) {
                                // There's an explicit error message from Gridspace
                                success = false;
                                actualStatus = "Failed: " + gridspaceResponse.error;
                                dialerResponse.innerHTML += `<p style="color: red;">Dial failed: ${gridspaceResponse.error}</p>`;
                            }
                        } catch (e) {
                            console.log('Could not parse inner Gridspace response as JSON:', e);
                        }
                    }

                    // Final success determination based on response structure
                    if (!success) {
                        success = responseData.success === true;
                        if (success && !actualStatus.includes("Call ID")) {
                            actualStatus = "API call successful, but call status unconfirmed";
                            dialerResponse.innerHTML += `<p>HTTP request successful, but call status unconfirmed</p>`;
                        } else if (!success) {
                            actualStatus = responseData.message || "Unknown error";
                            dialerResponse.innerHTML += `<p style="color: red;">Failed: ${actualStatus}</p>`;
                        }
                    }

                    // Add the raw response data for debugging
                    dialerResponse.innerHTML += `
                    <div style="margin: 10px 0; font-size: 12px;">
                        <details>
                            <summary>Technical details</summary>
                            <pre style="background-color: #f5f5f5; padding: 8px; overflow: auto;">${JSON.stringify(responseData, null, 2)}</pre>
                        </details>
                    </div>
                `;

                } catch (e) {
                    console.error('Error parsing response:', e);
                    success = false;
                    actualStatus = "Invalid response format";
                    dialerResponse.innerHTML += `<p style="color: red;">Failed: Error parsing response - ${e.message}</p>`;
                }

                return {
                    success: success,
                    status: success ? 'initiated' : 'failed', // Changed from 'completed' to 'initiated' for honesty
                    actualStatus: actualStatus,
                    statusCode: responseData?.status_code,
                    responseBody: responseData,
                    timestamp: timestamp
                };
            })
            .catch(error => {
                console.error(`Error with proxy request:`, error);

                if (dialerResponse) {
                    dialerResponse.innerHTML += `<p style="color: red;">Error dialing from ${fromNumber} to ${toNumber}: ${error.message}</p>`;
                }

                // Try alternative fallback method using our other local proxy
                dialerResponse.innerHTML += `<p>Trying alternative method...</p>`;

                // Use our local fallback proxy
                const fallbackUrl = 'php/gridspace.php';
                const fallbackFormData = new FormData();
                fallbackFormData.append('to', toNumber);
                fallbackFormData.append('from', fromNumber);
                fallbackFormData.append('timestamp', timestamp);

                return fetch(fallbackUrl, {
                    method: 'POST',
                    body: fallbackFormData
                })
                    .then(fallbackResponse => {
                        if (!fallbackResponse.ok) {
                            throw new Error(`Fallback HTTP error ${fallbackResponse.status}`);
                        }
                        return fallbackResponse.text();
                    })
                    .then(fallbackText => {
                        console.log('Fallback response:', fallbackText);

                        let fallbackSuccess = false;
                        let fallbackStatus = "unknown";

                        try {
                            const fallbackData = JSON.parse(fallbackText);
                            fallbackSuccess = fallbackData.success === true;
                            fallbackStatus = fallbackSuccess ? 'initiated' : 'failed';

                            if (dialerResponse) {
                                if (fallbackSuccess) {
                                    dialerResponse.innerHTML += `<p>Fallback method: Call initiated from ${fromNumber} to ${toNumber}</p>`;
                                    dialerResponse.innerHTML += `
                                <div style="margin-left: 20px; padding: 5px; border-left: 3px solid #ccc; color: #666;">
                                    <small>Note: A successful API response means the call was initiated, but does not guarantee the call will connect.</small>
                                </div>
                            `;
                                } else {
                                    dialerResponse.innerHTML += `<p style="color: red;">Fallback method failed: ${fallbackData.message || 'Unknown error'}</p>`;
                                }
                            }

                            return {
                                success: fallbackSuccess,
                                status: fallbackStatus,
                                actualStatus: fallbackData.message || "Fallback method response",
                                responseBody: fallbackData,
                                timestamp: timestamp,
                                fallback: true
                            };
                        } catch (e) {
                            console.error('Error parsing fallback response:', e);
                            dialerResponse.innerHTML += `<p style="color: red;">Fallback method failed: Could not parse response</p>`;

                            return {
                                success: false,
                                status: 'failed',
                                actualStatus: "Invalid fallback response format",
                                error: e.message,
                                fallback: true,
                                timestamp: timestamp
                            };
                        }
                    })
                    .catch(fallbackError => {
                        console.error('Fallback method error:', fallbackError);
                        dialerResponse.innerHTML += `<p style="color: red;">All methods failed to initiate call</p>`;

                        return {
                            success: false,
                            status: 'failed',
                            actualStatus: "All methods failed",
                            error: fallbackError.message,
                            timestamp: timestamp
                        };
                    });
            })
            .then(result => {
                // Final processing of the result from either primary or fallback method
                resolve(result);
            });
    });
}

function dialNumberWithGridspaceXHRForTab(toNumber, fromNumber, tabNumber) {
    return new Promise((resolve, reject) => {
        console.log(`[Tab ${tabNumber}] Dialing ${toNumber} from ${fromNumber} using Gridspace API (XHR via local proxy)`);

        // Use our local proxy instead of direct API call
        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'php/gridspace.php', true);

        // Generate a timestamp for logging purposes
        const timestamp = new Date().toISOString();

        // Add call details to the results summary immediately
        const dialerResponse = document.getElementById(`gs-results-summary-${tabNumber}`);
        if (dialerResponse) {
            dialerResponse.innerHTML += `<p>Initiating call from ${fromNumber} to ${toNumber} (XHR method)...</p>`;
        }

        xhr.onload = function () {
            console.log(`[Tab ${tabNumber}] Gridspace XHR proxy response status: ${xhr.status}`);
            console.log(`[Tab ${tabNumber}] Gridspace XHR proxy response text: ${xhr.responseText}`);

            let success = false;
            let actualStatus = "Call status unknown";
            let responseData = null;

            try {
                // Try to parse the response as JSON
                responseData = JSON.parse(xhr.responseText);

                // Check for actual indicators of call success
                if (responseData.success === true) {
                    success = true;
                    actualStatus = "Call initiated via XHR method";

                    dialerResponse.innerHTML += `
                        <p>XHR method: Call request accepted but call completion cannot be confirmed</p>
                        <div style="margin-left: 20px; padding: 5px; border-left: 3px solid #ccc; color: #666;">
                            <small>Note: A successful API response means the call was initiated, but does not guarantee the call will connect.</small>
                        </div>
                    `;
                } else {
                    success = false;
                    actualStatus = responseData.message || "Unknown error";
                    dialerResponse.innerHTML += `<p style="color: red;">XHR method failed: ${actualStatus}</p>`;
                }

                // Add the raw response data for debugging
                dialerResponse.innerHTML += `
                    <div style="margin: 10px 0; font-size: 12px;">
                        <details>
                            <summary>XHR Technical details</summary>
                            <pre style="background-color: #f5f5f5; padding: 8px; overflow: auto;">${JSON.stringify(responseData, null, 2)}</pre>
                        </details>
                    </div>
                `;
            } catch (e) {
                console.error(`[Tab ${tabNumber}] Error parsing XHR response:`, e);
                success = false;
                actualStatus = "Invalid response format";
                dialerResponse.innerHTML += `<p style="color: red;">XHR method failed: Error parsing response - ${e.message}</p>`;
            }

            resolve({
                success: success,
                status: success ? 'initiated' : 'failed',
                actualStatus: actualStatus,
                statusCode: xhr.status,
                responseBody: responseData,
                timestamp: timestamp,
                method: 'xhr'
            });
        };

        xhr.onerror = function () {
            console.error(`[Tab ${tabNumber}] XHR Error calling Gridspace proxy`);

            if (dialerResponse) {
                dialerResponse.innerHTML += `<p style="color: red;">XHR method error: Network error</p>`;
            }

            resolve({
                success: false,
                status: 'failed',
                actualStatus: "Network error",
                error: 'XHR Network error',
                timestamp: timestamp,
                method: 'xhr'
            });
        };

        // Create form data for the request
        const formData = new FormData();
        formData.append('to', toNumber);
        formData.append('from', fromNumber);
        formData.append('timestamp', timestamp);
        formData.append('method', 'xhr');
        formData.append('tab', tabNumber);

        console.log(`[Tab ${tabNumber}] Sending XHR request with data:`, { to: toNumber, from: fromNumber, timestamp });
        xhr.send(formData);
    });
}
