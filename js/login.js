document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('login-form');
    const accountSidInput = document.getElementById('account-sid');
    const authTokenInput = document.getElementById('auth-token');
    const errorMessage = document.getElementById('error-message');

    // Add input/paste event listeners to both fields for auto-parsing
    accountSidInput.addEventListener('input', handleCredentialInput);
    authTokenInput.addEventListener('input', handleCredentialInput);

    // Function to handle credential input and auto-parse if needed
    function handleCredentialInput(e) {
        const input = e.target.value.trim();

        // Check if input contains a colon (potential combined format)
        if (input.includes(':')) {
            // Try to parse as AccountSID:AuthToken format
            const parts = input.split(':');
            if (parts.length === 2) {
                const potentialSid = parts[0].trim();
                const potentialToken = parts[1].trim();

                // Basic validation
                if (potentialSid.startsWith('AC') && potentialSid.length >= 32 && potentialToken.length >= 10) {
                    // Valid format detected, populate both fields
                    accountSidInput.value = potentialSid;
                    authTokenInput.value = potentialToken;

                    // If the current field is the auth token field, move focus to submit button
                    if (e.target === authTokenInput) {
                        loginForm.querySelector('button[type="submit"]').focus();
                    } else {
                        // Otherwise, move focus to auth token field
                        authTokenInput.focus();
                    }
                }
            }
        } else if (input.length > 40) {
            // Try to parse from a pasted string (might contain spaces, newlines, etc.)
            const matches = input.match(/([A-Za-z0-9]{32,})[^A-Za-z0-9]+([A-Za-z0-9]{32,})/);
            if (matches && matches.length >= 3) {
                const potentialSid = matches[1].trim();
                const potentialToken = matches[2].trim();

                // Basic validation
                if (potentialSid.startsWith('AC') && potentialToken.length >= 10) {
                    // Valid format detected, populate both fields
                    accountSidInput.value = potentialSid;
                    authTokenInput.value = potentialToken;

                    // Move focus to submit button
                    loginForm.querySelector('button[type="submit"]').focus();
                }
            }
        }
    }

    loginForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const accountSid = accountSidInput.value.trim();
        const authToken = authTokenInput.value.trim();

        // Basic validation
        if (!accountSid || !authToken) {
            showError('Please enter both Account SID and Auth Token');
            return;
        }

        // Show loading state
        const submitButton = loginForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';

        // Attempt to authenticate with Twilio
        authenticateWithTwilio(accountSid, authToken)
            .then(response => {
                // Store credentials in both session storage and local storage for compatibility with PHP endpoints
                sessionStorage.setItem('twilioAccountSid', accountSid);
                sessionStorage.setItem('twilioAuthToken', authToken);
                sessionStorage.setItem('twilioAccountData', JSON.stringify(response));

                // Also store in localStorage for PHP compatibility
                localStorage.setItem('accountSid', accountSid);
                localStorage.setItem('authToken', authToken);

                // Redirect to dashboard
                window.location.href = 'dashboard.html';
            })
            .catch(error => {
                showError(error.message || 'Authentication failed. Please check your credentials.');

                // Reset button
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;
            });
    });

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';

        // Hide error after 5 seconds
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 5000);
    }

    async function authenticateWithTwilio(accountSid, authToken) {
        try {
            // Check for test credentials
            const isTestCredentials = accountSid === 'AC55cafa7e49f6e7d30ff43ee318f6e145' &&
                authToken === '47aa239f3f17670916f5cddf73799015';

            // Basic format validation
            if (!accountSid.startsWith('AC') || authToken.length < 10) {
                throw new Error('Invalid credentials format. Account SID should start with "AC" and Auth Token should be at least 10 characters.');
            }

            // If using test credentials, bypass API call and return mock data
            if (isTestCredentials) {
                console.log('Using test credentials - bypassing API call');
                return {
                    friendlyName: 'Test Account',
                    type: 'subaccount', // Changed from 'owner' to 'subaccount' to show inherit permission button
                    status: 'active',
                    balance: '$250.00',
                    subscription: 'Trial'
                };
            }

            // Try multiple CORS proxies in case one fails
            const corsProxies = [
                'https://cors-anywhere.herokuapp.com/',
                'https://api.allorigins.win/raw?url=',
                'https://corsproxy.io/?'
            ];

            let lastError = null;

            // Try each proxy until one works
            for (const corsProxy of corsProxies) {
                try {
                    console.log(`Trying CORS proxy: ${corsProxy}`);
                    const twilioApiUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`;
                    const proxyUrl = corsProxy + encodeURIComponent(twilioApiUrl);

                    const response = await fetch(proxyUrl, {
                        method: 'GET',
                        headers: {
                            'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
                            'Content-Type': 'application/json',
                            'Origin': window.location.origin
                        }
                    });

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.message || `API returned ${response.status}: ${response.statusText}`);
                    }

                    const accountData = await response.json();

                    // Log the raw account data for debugging
                    console.log('Raw account data from Twilio API:', accountData);

                    // Determine if this is a subaccount or owner account
                    // The 'type' field from Twilio API is actually the opposite of what we want to display
                    // If type is 'Full', it's actually a subaccount
                    // If type is 'Subaccount', it's actually the owner/main account
                    const isSubaccount = accountData.type === 'Full';
                    const accountType = isSubaccount ? 'subaccount' : 'owner';

                    console.log(`Account SID: ${accountSid}, Type from API: ${accountData.type}, Determined type: ${accountType}`);

                    // Determine subscription type
                    // The correct way to check if an account is a trial account is to look at the 'type' field
                    // If type is 'Trial', it's a trial account
                    const isTrialAccount = accountData.type === 'Trial';
                    const subscriptionType = isTrialAccount ? 'Trial' : 'Full';

                    console.log(`Account SID: ${accountSid}, Subscription from API: ${accountData.type}, Determined subscription: ${subscriptionType}`);

                    // Format the response to match our application's expected structure
                    return {
                        friendlyName: accountData.friendly_name || 'Twilio Account',
                        type: accountType, // Use our corrected account type
                        status: accountData.status || 'unknown',
                        balance: accountData.balance || '$0.00',
                        subscription: subscriptionType // Use our corrected subscription type
                    };
                } catch (error) {
                    console.error(`Error with proxy ${corsProxy}:`, error);
                    lastError = error;
                    // Continue to next proxy
                }
            }

            // If we've tried all proxies and none worked, try direct request as last resort
            try {
                console.log('Trying direct request (may fail due to CORS)');
                const twilioApiUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`;

                const response = await fetch(twilioApiUrl, {
                    method: 'GET',
                    headers: {
                        'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.message || `API returned ${response.status}: ${response.statusText}`);
                }

                const accountData = await response.json();

                // Log the raw account data for debugging
                console.log('Raw account data from direct Twilio API call:', accountData);

                // Use the same account type detection logic as above
                const isSubaccount = accountData.type === 'Full';
                const accountType = isSubaccount ? 'subaccount' : 'owner';

                console.log(`Direct call - Account SID: ${accountSid}, Type from API: ${accountData.type}, Determined type: ${accountType}`);

                // Determine subscription type using the same logic as above
                const isTrialAccount = accountData.type === 'Trial';
                const subscriptionType = isTrialAccount ? 'Trial' : 'Full';

                console.log(`Direct call - Account SID: ${accountSid}, Subscription from API: ${accountData.type}, Determined subscription: ${subscriptionType}`);

                return {
                    friendlyName: accountData.friendly_name || 'Twilio Account',
                    type: accountType, // Use our corrected account type
                    status: accountData.status || 'unknown',
                    balance: accountData.balance || '$0.00',
                    subscription: subscriptionType // Use our corrected subscription type
                };
            } catch (directError) {
                console.error('Direct request failed:', directError);
                // Fall through to final error handling
            }

            // If all methods failed, provide a fallback option for demo purposes
            console.log('All API methods failed. Offering fallback option.');

            // Show a special error message with fallback option
            const useFallback = confirm(
                'Could not connect to Twilio API. This may be due to CORS restrictions in your browser.\n\n' +
                'Would you like to use demo mode instead? (Click OK to continue with demo data)'
            );

            if (useFallback) {
                return {
                    friendlyName: 'Demo Account',
                    type: Math.random() > 0.5 ? 'owner' : 'subaccount',
                    status: 'active',
                    balance: '$' + (Math.random() * 1000).toFixed(2),
                    subscription: Math.random() > 0.5 ? 'Trial' : 'Full'
                };
            }

            // If user declined fallback, throw the last error
            throw lastError || new Error('Authentication failed. Please check your credentials or try again later.');
        } catch (error) {
            console.error('Authentication error:', error);
            throw error;
        }
    }
});
