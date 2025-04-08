document.addEventListener('DOMContentLoaded', function () {
    // Load phone numbers
    loadPhoneNumbers();

    // Setup event listeners
    setupEventListeners();
});

async function loadPhoneNumbers() {
    const numbersLoading = document.getElementById('numbers-loading');
    const numbersTableContainer = document.getElementById('numbers-table-container');
    const noNumbersMessage = document.getElementById('no-numbers-message');

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

            // Log the account SID for debugging
            console.log('Loading phone numbers for Account SID:', accountSid);

            // Make the API call to get the numbers
            const apiUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/IncomingPhoneNumbers.json`;
            console.log('Fetching numbers from URL:', apiUrl);

            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Authorization': 'Basic ' + btoa(accountSid + ':' + authToken)
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response:', errorText);
                throw new Error(`Failed to fetch phone numbers: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            // Format the response to match our application's expected structure
            numbers = data.incoming_phone_numbers ? data.incoming_phone_numbers.map(number => ({
                phoneNumber: number.phone_number,
                friendlyName: number.friendly_name,
                voiceUrl: number.voice_url
            })) : [];
        }

        if (numbers && numbers.length > 0) {
            // Populate table with numbers
            populateNumbersTable(numbers);

            // Show table, hide loading and no numbers message
            numbersTableContainer.style.display = 'block';
            numbersLoading.style.display = 'none';
            noNumbersMessage.style.display = 'none';
        } else {
            // Show no numbers message, hide loading and table
            noNumbersMessage.style.display = 'block';
            numbersLoading.style.display = 'none';
            numbersTableContainer.style.display = 'none';
        }
    } catch (error) {
        // Show error notification
        showNotification(error.message || 'Failed to load phone numbers', 'error');

        // Hide loading, show no numbers message
        numbersLoading.style.display = 'none';
        noNumbersMessage.style.display = 'block';
        numbersTableContainer.style.display = 'none';
    }
}

function populateNumbersTable(numbers) {
    const tableBody = document.getElementById('numbers-table-body');

    // Clear existing rows
    tableBody.innerHTML = '';

    // Add a row for each number
    numbers.forEach(number => {
        const row = document.createElement('tr');

        // Phone number cell
        const phoneCell = document.createElement('td');
        phoneCell.textContent = number.phoneNumber;
        row.appendChild(phoneCell);

        // Friendly name cell
        const nameCell = document.createElement('td');
        nameCell.textContent = number.friendlyName || '-';
        row.appendChild(nameCell);

        // Voice URL cell
        const urlCell = document.createElement('td');
        const urlInput = document.createElement('input');
        urlInput.type = 'text';
        urlInput.className = 'voice-url-input';
        urlInput.value = number.voiceUrl || '';
        urlInput.placeholder = 'Enter voice URL';
        urlInput.dataset.phoneNumber = number.phoneNumber;
        urlCell.appendChild(urlInput);
        row.appendChild(urlCell);

        // Actions cell
        const actionsCell = document.createElement('td');

        // Update button
        const updateBtn = document.createElement('button');
        updateBtn.className = 'btn btn-secondary';
        updateBtn.innerHTML = '<i class="fas fa-save"></i> Update';
        updateBtn.style.marginRight = '5px';
        updateBtn.dataset.phoneNumber = number.phoneNumber;
        updateBtn.addEventListener('click', handleUpdateVoiceUrl);
        actionsCell.appendChild(updateBtn);

        // Copy button
        const copyBtn = document.createElement('button');
        copyBtn.className = 'btn btn-primary';
        copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
        copyBtn.dataset.phoneNumber = number.phoneNumber;
        copyBtn.addEventListener('click', handleCopyNumber);
        actionsCell.appendChild(copyBtn);

        row.appendChild(actionsCell);

        // Add row to table
        tableBody.appendChild(row);
    });
}

function setupEventListeners() {
    // Buy number button
    const buyNumberBtn = document.getElementById('buy-number-btn');
    const buyFirstNumberBtn = document.getElementById('buy-first-number-btn');
    const buyNumberModal = document.getElementById('buy-number-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const searchNumbersBtn = document.getElementById('search-numbers-btn');
    const purchaseNumberBtn = document.getElementById('purchase-number-btn');

    // Common US area codes for automatic search
    const commonUSAreaCodes = ['212', '213', '310', '312', '404', '415', '469', '512', '602', '615', '702', '713', '817', '904', '972'];

    // Function to get a random area code
    function getRandomAreaCode() {
        const randomIndex = Math.floor(Math.random() * commonUSAreaCodes.length);
        return commonUSAreaCodes[randomIndex];
    }

    // Function to open modal and auto-search
    function openBuyNumberModal() {
        // Show the modal
        buyNumberModal.style.display = 'flex';

        // Auto-populate search input with "US" for country-wide search
        const searchInput = document.getElementById('number-search-input');
        searchInput.value = "US";

        // Automatically trigger search
        handleSearchNumbers(true); // Pass true to indicate auto-search
    }

    // Open modal when buy number button is clicked
    if (buyNumberBtn) {
        buyNumberBtn.addEventListener('click', function () {
            openBuyNumberModal();
        });
    }

    // Open modal when buy first number button is clicked
    if (buyFirstNumberBtn) {
        buyFirstNumberBtn.addEventListener('click', function () {
            openBuyNumberModal();
        });
    }

    // Close modal when close button is clicked
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', function () {
            buyNumberModal.style.display = 'none';

            // Reset modal state
            document.getElementById('number-search-input').value = '';
            document.getElementById('search-results-container').style.display = 'none';
            document.getElementById('search-error').style.display = 'none';
        });
    }

    // Close modal when clicking outside of it
    window.addEventListener('click', function (event) {
        if (event.target === buyNumberModal) {
            buyNumberModal.style.display = 'none';

            // Reset modal state
            document.getElementById('number-search-input').value = '';
            document.getElementById('search-results-container').style.display = 'none';
            document.getElementById('search-error').style.display = 'none';
        }
    });

    // Search for available numbers
    if (searchNumbersBtn) {
        searchNumbersBtn.addEventListener('click', handleSearchNumbers);
    }

    // Purchase selected number
    if (purchaseNumberBtn) {
        purchaseNumberBtn.addEventListener('click', handlePurchaseNumber);
    }
}

async function handleUpdateVoiceUrl(event) {
    const phoneNumber = event.currentTarget.dataset.phoneNumber;
    const voiceUrlInput = document.querySelector(`.voice-url-input[data-phone-number="${phoneNumber}"]`);
    const voiceUrl = voiceUrlInput.value.trim();

    if (!voiceUrl) {
        showNotification('Please enter a voice URL', 'error');
        return;
    }

    try {
        // Show loading state
        event.currentTarget.disabled = true;
        event.currentTarget.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';

        // Try using simulateApiCall first
        let response;
        try {
            response = await simulateApiCall('update-voice-url', 'POST', {
                phoneNumber: phoneNumber,
                voiceUrl: voiceUrl
            });
        } catch (error) {
            // If that fails, use the approach from the PHP file
            const accountSid = localStorage.getItem('accountSid') || sessionStorage.getItem('twilioAccountSid');
            const authToken = localStorage.getItem('authToken') || sessionStorage.getItem('twilioAuthToken');

            if (!accountSid || !authToken) {
                throw new Error('Authentication required');
            }

            // Log the account SID for debugging
            console.log('Updating voice URL for Account SID:', accountSid);

            // First, find the SID for the phone number
            const findUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/IncomingPhoneNumbers.json?PhoneNumber=${encodeURIComponent(phoneNumber)}`;
            console.log('Finding phone number SID from URL:', findUrl);

            const findResponse = await fetch(findUrl, {
                method: 'GET',
                headers: {
                    'Authorization': 'Basic ' + btoa(accountSid + ':' + authToken)
                }
            });

            if (!findResponse.ok) {
                const errorText = await findResponse.text();
                console.error('Error finding phone number:', errorText);
                throw new Error(`Failed to find phone number: ${findResponse.status} ${findResponse.statusText}`);
            }

            const findData = await findResponse.json();

            if (!findData.incoming_phone_numbers || findData.incoming_phone_numbers.length === 0) {
                throw new Error('Phone number not found in your account');
            }

            const numberSid = findData.incoming_phone_numbers[0].sid;

            // Update the voice URL
            const updateResponse = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/IncomingPhoneNumbers/${numberSid}.json`, {
                method: 'POST',
                headers: {
                    'Authorization': 'Basic ' + btoa(accountSid + ':' + authToken),
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: `VoiceUrl=${encodeURIComponent(voiceUrl)}`
            });

            if (!updateResponse.ok) {
                throw new Error('Failed to update voice URL');
            }

            response = {
                success: true,
                phoneNumber: phoneNumber,
                voiceUrl: voiceUrl
            };
        }

        // Show success notification
        showNotification(`Voice URL updated for ${phoneNumber}`);

        // Reset button
        event.currentTarget.disabled = false;
        event.currentTarget.innerHTML = '<i class="fas fa-save"></i> Update';
    } catch (error) {
        // Show error notification
        showNotification(error.message || 'Failed to update voice URL', 'error');

        // Reset button
        event.currentTarget.disabled = false;
        event.currentTarget.innerHTML = '<i class="fas fa-save"></i> Update';
    }
}

function handleCopyNumber(event) {
    const phoneNumber = event.currentTarget.dataset.phoneNumber;

    // Copy to clipboard
    navigator.clipboard.writeText(phoneNumber)
        .then(() => {
            // Show success notification
            showNotification(`Copied ${phoneNumber} to clipboard`);

            // Show copied state briefly
            event.currentTarget.innerHTML = '<i class="fas fa-check"></i> Copied';
            setTimeout(() => {
                event.currentTarget.innerHTML = '<i class="fas fa-copy"></i> Copy';
            }, 2000);
        })
        .catch(error => {
            // Show error notification
            showNotification('Failed to copy to clipboard', 'error');
        });
}

async function handleSearchNumbers(isAutoSearch = false) {
    const searchInput = document.getElementById('number-search-input');
    let searchQuery = searchInput.value.trim();
    const searchLoading = document.getElementById('search-loading');
    const searchError = document.getElementById('search-error');
    const searchResultsContainer = document.getElementById('search-results-container');
    const availableNumbersSelect = document.getElementById('available-numbers-select');
    const searchButton = document.getElementById('search-numbers-btn');

    // If no search query and this is an auto-search, use "US" for country-wide search
    if (!searchQuery && isAutoSearch) {
        // Use "US" to search for any available US number
        searchQuery = "US";
        searchInput.value = searchQuery;
    } else if (!searchQuery) {
        searchError.textContent = 'Please enter a country code (e.g., US) or area code';
        searchError.style.display = 'block';
        return;
    }

    // Log the search query
    console.log('Searching for available numbers with query:', searchQuery);

    try {
        // Show loading state
        searchLoading.style.display = 'block';
        searchError.style.display = 'none';
        searchResultsContainer.style.display = 'none';
        searchButton.disabled = true;

        // Call API to search for available numbers
        // Make sure to pass the search query to the API call
        const numbers = await simulateApiCall('available-numbers', 'GET', {
            query: searchQuery
        });

        console.log('Search results:', numbers);

        if (numbers && numbers.length > 0) {
            // Clear existing options
            availableNumbersSelect.innerHTML = '';

            // Add options for each available number
            numbers.forEach(number => {
                const option = document.createElement('option');
                option.value = number.phoneNumber;
                option.textContent = `${number.phoneNumber} (${number.region})`;
                option.title = `Voice: ${number.capabilities.voice ? 'Yes' : 'No'}, SMS: ${number.capabilities.sms ? 'Yes' : 'No'}`;
                availableNumbersSelect.appendChild(option);
            });

            // Select first number by default
            availableNumbersSelect.selectedIndex = 0;

            // Show results
            searchResultsContainer.style.display = 'block';
        } else {
            // Show no results message
            searchError.textContent = 'No available numbers found for the given search criteria';
            searchError.style.display = 'block';
        }
    } catch (error) {
        // Show error message
        searchError.textContent = error.message || 'Failed to search for available numbers';
        searchError.style.display = 'block';
    } finally {
        // Hide loading state
        searchLoading.style.display = 'none';
        searchButton.disabled = false;
    }
}

async function handlePurchaseNumber() {
    const availableNumbersSelect = document.getElementById('available-numbers-select');
    const selectedNumber = availableNumbersSelect.value;
    const purchaseButton = document.getElementById('purchase-number-btn');
    const buyNumberModal = document.getElementById('buy-number-modal');

    if (!selectedNumber) {
        showNotification('Please select a number to purchase', 'error');
        return;
    }

    try {
        // Show loading state
        purchaseButton.disabled = true;
        purchaseButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Purchasing...';

        // Try using simulateApiCall first
        let response;
        try {
            response = await simulateApiCall('buy-number', 'POST', {
                phoneNumber: selectedNumber
            });
        } catch (error) {
            // If that fails, use the approach from the PHP file
            const accountSid = localStorage.getItem('accountSid') || sessionStorage.getItem('twilioAccountSid');
            const authToken = localStorage.getItem('authToken') || sessionStorage.getItem('twilioAuthToken');

            if (!accountSid || !authToken) {
                throw new Error('Authentication required');
            }

            // Log the account SID for debugging
            console.log('Purchasing number for Account SID:', accountSid);

            // Make the API call to buy the number
            const purchaseUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/IncomingPhoneNumbers.json`;
            console.log('Purchasing number from URL:', purchaseUrl);
            console.log('Selected number:', selectedNumber);

            const apiResponse = await fetch(purchaseUrl, {
                method: 'POST',
                headers: {
                    'Authorization': 'Basic ' + btoa(accountSid + ':' + authToken),
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    'PhoneNumber': selectedNumber,
                    'VoiceUrl': 'https://cloudminner.com/munna/dial/france/echo.php'
                })
            });

            if (!apiResponse.ok) {
                const errorText = await apiResponse.text();
                console.error('Error purchasing number:', errorText);
                throw new Error(`Failed to buy number. Error: ${apiResponse.status} ${apiResponse.statusText}`);
            }

            const responseData = await apiResponse.json();

            response = {
                success: true,
                phoneNumber: responseData.phone_number,
                sid: responseData.sid
            };
        }

        // Show success notification
        showNotification(`Successfully purchased ${selectedNumber}`);

        // Close modal
        buyNumberModal.style.display = 'none';

        // Reset modal state
        document.getElementById('number-search-input').value = '';
        document.getElementById('search-results-container').style.display = 'none';
        document.getElementById('search-error').style.display = 'none';

        // Reload phone numbers
        loadPhoneNumbers();
    } catch (error) {
        // Show error notification
        showNotification(error.message || 'Failed to purchase number', 'error');

        // Reset button
        purchaseButton.disabled = false;
        purchaseButton.innerHTML = '<i class="fas fa-shopping-cart"></i> Purchase Selected Number';
    }
}
