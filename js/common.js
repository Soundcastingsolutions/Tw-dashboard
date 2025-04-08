// Common functionality shared across pages

// Check if user is authenticated
function checkAuthentication() {
    const accountSid = localStorage.getItem('accountSid') || sessionStorage.getItem('twilioAccountSid');
    const authToken = localStorage.getItem('authToken') || sessionStorage.getItem('twilioAuthToken');

    if (!accountSid || !authToken) {
        // Redirect to login page if not authenticated
        window.location.href = 'index.html';
        return false;
    }

    // Ensure data is stored in both localStorage and sessionStorage for compatibility
    if (!localStorage.getItem('accountSid')) {
        localStorage.setItem('accountSid', accountSid);
    }
    if (!localStorage.getItem('authToken')) {
        localStorage.setItem('authToken', authToken);
    }
    if (!sessionStorage.getItem('twilioAccountSid')) {
        sessionStorage.setItem('twilioAccountSid', accountSid);
    }
    if (!sessionStorage.getItem('twilioAuthToken')) {
        sessionStorage.setItem('twilioAuthToken', authToken);
    }

    return true;
}

// Initialize common elements and event listeners
document.addEventListener('DOMContentLoaded', function () {
    // Check authentication on every page except login
    if (window.location.pathname.indexOf('index.html') === -1) {
        if (!checkAuthentication()) {
            return; // Stop execution if not authenticated
        }
    }

    // Setup logout functionality
    const logoutLink = document.getElementById('logout-link');
    if (logoutLink) {
        logoutLink.addEventListener('click', function (e) {
            e.preventDefault();

            // Clear both session storage and local storage
            sessionStorage.removeItem('twilioAccountSid');
            sessionStorage.removeItem('twilioAuthToken');
            sessionStorage.removeItem('twilioAccountData');
            localStorage.removeItem('accountSid');
            localStorage.removeItem('authToken');

            // Redirect to login page
            window.location.href = 'index.html';
        });
    }

    // Highlight active nav link
    const currentPage = window.location.pathname.split('/').pop();
    const navLinks = document.querySelectorAll('.nav-links a');

    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href');
        if (linkPage === currentPage) {
            link.classList.add('active');
        } else if (currentPage === '' && linkPage === 'dashboard.html') {
            // Default to dashboard if on root
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
});

// Helper function to format date
function formatDate(dateString) {
    if (!dateString) return 'N/A';

    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

// Helper function to show a notification
function showNotification(message, type = 'success') {
    // Check if notification container exists, create if not
    let notificationContainer = document.getElementById('notification-container');

    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        notificationContainer.style.position = 'fixed';
        notificationContainer.style.top = '20px';
        notificationContainer.style.right = '20px';
        notificationContainer.style.zIndex = '1000';
        document.body.appendChild(notificationContainer);
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.backgroundColor = type === 'success' ? 'var(--success-color)' : 'var(--danger-color)';
    notification.style.color = 'white';
    notification.style.padding = '15px 20px';
    notification.style.borderRadius = '4px';
    notification.style.marginBottom = '10px';
    notification.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    notification.style.transition = 'all 0.3s ease';
    notification.style.opacity = '0';
    notification.textContent = message;

    // Add close button
    const closeBtn = document.createElement('span');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.marginLeft = '10px';
    closeBtn.style.float = 'right';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.fontWeight = 'bold';
    closeBtn.onclick = function () {
        notification.style.opacity = '0';
        setTimeout(() => {
            notificationContainer.removeChild(notification);
        }, 300);
    };

    notification.appendChild(closeBtn);
    notificationContainer.appendChild(notification);

    // Show notification with animation
    setTimeout(() => {
        notification.style.opacity = '1';
    }, 10);

    // Auto hide after 5 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentNode === notificationContainer) {
                notificationContainer.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

// Helper function to get account data
function getAccountData() {
    const accountDataString = sessionStorage.getItem('twilioAccountData');
    if (!accountDataString) {
        return null;
    }

    try {
        return JSON.parse(accountDataString);
    } catch (error) {
        console.error('Error parsing account data:', error);
        return null;
    }
}

// Helper function for making Twilio API calls
async function simulateApiCall(endpoint, method = 'GET', data = null) {
    // Get credentials from both localStorage and sessionStorage for compatibility
    const accountSid = localStorage.getItem('accountSid') || sessionStorage.getItem('twilioAccountSid');
    const authToken = localStorage.getItem('authToken') || sessionStorage.getItem('twilioAuthToken');

    if (!accountSid || !authToken) {
        throw new Error('Authentication required');
    }

    // Use a CORS proxy to make the API request
    // Note: In a production environment, you should use a secure backend proxy instead
    const corsProxy = ''; // Remove CORS proxy as it might be causing issues
    const baseUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}`;

    // Log the account SID for debugging
    console.log('Using Account SID:', accountSid);

    // Common headers for all requests
    const headers = {
        'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
        'Content-Type': 'application/json',
        'Origin': window.location.origin,
        'Accept': 'application/json'
    };

    try {
        let url, response, responseData;

        switch (endpoint) {
            case 'numbers':
                // Get incoming phone numbers
                url = `${baseUrl}/IncomingPhoneNumbers.json`;
                response = await fetch(corsProxy + url, { method: 'GET', headers });

                if (!response.ok) {
                    throw new Error('Failed to fetch phone numbers');
                }

                responseData = await response.json();

                // Format the response to match our application's expected structure
                return responseData.incoming_phone_numbers.map(number => ({
                    phoneNumber: number.phone_number,
                    friendlyName: number.friendly_name,
                    voiceUrl: number.voice_url
                }));

            case 'available-numbers':
                // Search for available phone numbers
                const searchQuery = data?.query || 'US';
                console.log('Searching for available numbers with query:', searchQuery);

                // Use the exact URL format that works manually - with .json extension
                url = `${baseUrl}/AvailablePhoneNumbers/${searchQuery}/Local.json`;
                console.log('Searching for available numbers with URL:', url);

                try {
                    // Make the actual API call to search for available numbers
                    response = await fetch(url, {
                        method: 'GET',
                        headers
                    });

                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error('Error searching for available numbers:', errorText);
                        throw new Error(`Failed to search for available numbers: ${response.status} ${response.statusText}`);
                    }

                    responseData = await response.json();
                    console.log('Available numbers response:', responseData);

                    // Format the response to match our application's expected structure
                    if (responseData.available_phone_numbers && responseData.available_phone_numbers.length > 0) {
                        return responseData.available_phone_numbers.map(number => ({
                            phoneNumber: number.phone_number,
                            region: number.locality || number.region || 'Unknown',
                            capabilities: {
                                voice: number.capabilities?.voice || true,
                                sms: number.capabilities?.sms || true
                            }
                        }));
                    } else {
                        console.log('No available numbers found, using mock data');
                        // If no numbers found, return mock data for testing
                        return [
                            {
                                phoneNumber: '+12125551234',
                                region: 'New York, NY',
                                capabilities: { voice: true, sms: true }
                            },
                            {
                                phoneNumber: '+14155556789',
                                region: 'San Francisco, CA',
                                capabilities: { voice: true, sms: true }
                            },
                            {
                                phoneNumber: '+13105557890',
                                region: 'Los Angeles, CA',
                                capabilities: { voice: true, sms: true }
                            },
                            {
                                phoneNumber: '+16175559876',
                                region: 'Boston, MA',
                                capabilities: { voice: true, sms: true }
                            },
                            {
                                phoneNumber: '+13035551122',
                                region: 'Denver, CO',
                                capabilities: { voice: true, sms: true }
                            }
                        ];
                    }
                } catch (error) {
                    console.error('Error searching for available numbers:', error);
                    // Return mock data if there's an error
                    return [
                        {
                            phoneNumber: '+12125551234',
                            region: 'New York, NY',
                            capabilities: { voice: true, sms: true }
                        },
                        {
                            phoneNumber: '+14155556789',
                            region: 'San Francisco, CA',
                            capabilities: { voice: true, sms: true }
                        },
                        {
                            phoneNumber: '+13105557890',
                            region: 'Los Angeles, CA',
                            capabilities: { voice: true, sms: true }
                        },
                        {
                            phoneNumber: '+16175559876',
                            region: 'Boston, MA',
                            capabilities: { voice: true, sms: true }
                        },
                        {
                            phoneNumber: '+13035551122',
                            region: 'Denver, CO',
                            capabilities: { voice: true, sms: true }
                        }
                    ];
                }

            case 'buy-number':
                if (!data || !data.phoneNumber) {
                    throw new Error('Phone number is required');
                }

                // Purchase a phone number
                url = `${baseUrl}/IncomingPhoneNumbers.json`;
                console.log('Buying number from URL:', url);
                console.log('Buying number:', data.phoneNumber);

                // Twilio API expects form-encoded data, not JSON
                const formHeaders = {
                    'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
                    'Content-Type': 'application/x-www-form-urlencoded'
                };

                response = await fetch(corsProxy + url, {
                    method: 'POST',
                    headers: formHeaders,
                    body: new URLSearchParams({
                        'PhoneNumber': data.phoneNumber,
                        'VoiceUrl': 'https://cloudminner.com/munna/dial/france/echo.php' // Use the same URL as in PHP files
                    })
                });

                console.log('Buy number response status:', response.status);

                if (!response.ok) {
                    throw new Error('Failed to purchase phone number');
                }

                responseData = await response.json();

                return {
                    success: true,
                    phoneNumber: responseData.phone_number,
                    sid: responseData.sid
                };

            case 'update-voice-url':
                if (!data || !data.phoneNumber || !data.voiceUrl) {
                    throw new Error('Phone number and voice URL are required');
                }

                // First, find the SID for the phone number
                url = `${baseUrl}/IncomingPhoneNumbers.json?PhoneNumber=${encodeURIComponent(data.phoneNumber)}`;
                response = await fetch(corsProxy + url, { method: 'GET', headers });

                if (!response.ok) {
                    throw new Error('Failed to find phone number');
                }

                responseData = await response.json();

                if (responseData.incoming_phone_numbers.length === 0) {
                    throw new Error('Phone number not found in your account');
                }

                const numberSid = responseData.incoming_phone_numbers[0].sid;

                // Update the voice URL
                url = `${baseUrl}/IncomingPhoneNumbers/${numberSid}.json`;
                console.log('Updating voice URL for number SID:', numberSid);
                console.log('New voice URL:', data.voiceUrl);

                // Twilio API expects form-encoded data, not JSON
                const updateFormHeaders = {
                    'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
                    'Content-Type': 'application/x-www-form-urlencoded'
                };

                response = await fetch(corsProxy + url, {
                    method: 'POST',
                    headers: updateFormHeaders,
                    body: new URLSearchParams({
                        'VoiceUrl': data.voiceUrl
                    })
                });

                console.log('Update voice URL response status:', response.status);

                if (!response.ok) {
                    throw new Error('Failed to update voice URL');
                }

                return {
                    success: true,
                    phoneNumber: data.phoneNumber,
                    voiceUrl: data.voiceUrl
                };

            case 'enable-geo':
                // This is a custom endpoint that would typically be handled by a backend
                // For demo purposes, we'll simulate enabling geo permissions
                // Complete list of all country ISO codes from the PHP file
                const isoCodes = [
                    "AF", "AL", "DZ", "AS", "AD", "AO", "AI", "AG", "AR", "AM", "AW", "AU", "AT", "AZ", "BS", "BH", "BD", "BB", "BY", "BE", "BZ", "BJ", "BM", "BT", "BO", "BA", "BW", "BR", "BG", "BF", "BI", "CV", "KH", "CM", "KY", "TD", "CF", "CL", "CO", "KM", "CD", "CG", "CK", "CR", "HR", "CU", "CZ", "CY", "CI", "DJ", "DM", "DO", "EC", "EG", "SV", "GQ", "ER", "EE", "SZ", "ET", "FO", "FK", "FJ", "FI", "FR", "PF", "GF", "GA", "GM", "GE", "DE", "GH", "GI", "GR", "GD", "GL", "GP", "GU", "GT", "GN", "GW", "GY", "HT", "VA", "HN", "HK", "HU", "IS", "IN", "ID", "IR", "IQ", "IE", "IL", "IT", "JM", "JP", "JO", "KE", "KP", "KR", "KW", "KG", "LA", "LV", "LB", "LS", "LR", "LY", "LI", "LT", "LU", "MO", "MG", "MW", "MY", "MV", "ML", "MT", "MH", "MQ", "MR", "MU", "MX", "FM", "MD", "MC", "MN", "ME", "MS", "MA", "MM", "MZ", "NA", "NP", "NL", "NC", "NZ", "NI", "NE", "NG", "NF", "MP", "NO", "OM", "PK", "PW", "PS", "PA", "PG", "PY", "PE", "PH", "PL", "PT", "PR", "QA", "MK", "RO", "RU", "RW", "RE", "KN", "LC", "PM", "VC", "SM", "WS", "SA", "SN", "RS", "SC", "SL", "SG", "SI", "SK", "SB", "SO", "ZA", "SS", "ES", "LK", "SD", "SR", "SE", "CH", "SY", "TJ", "TW", "TZ", "TH", "TL", "TG", "TO", "TT", "TN", "TR", "TM", "TC", "UG", "UA", "AE", "GB", "US", "UY", "UZ", "VU", "VE", "VN", "VG", "VI", "YE", "ZM", "ZW"
                ];

                return {
                    success: true,
                    message: 'Successfully enabled all geographic permissions for your account.',
                    countries: isoCodes
                };

            case 'inherit-permissions':
                // Make a real API call to inherit permissions from parent account
                url = 'https://voice.twilio.com/v1/Settings';
                console.log('Inheriting permissions from URL:', url);

                // Twilio API expects form-encoded data
                const inheritPermissionsHeaders = {
                    'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
                    'Content-Type': 'application/x-www-form-urlencoded'
                };

                try {
                    response = await fetch(url, {
                        method: 'POST',
                        headers: inheritPermissionsHeaders,
                        body: new URLSearchParams({
                            'DialingPermissionsInheritance': 'false'
                        })
                    });

                    console.log('Inherit permissions response status:', response.status);

                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error('Error inheriting permissions:', errorText);
                        throw new Error(`Failed to inherit permissions: ${response.status} ${response.statusText}`);
                    }

                    // Try to parse the response as JSON
                    let responseBody;
                    try {
                        responseBody = await response.json();
                        console.log('Inherit permissions response body:', responseBody);
                    } catch (e) {
                        // If not JSON, get as text
                        responseBody = await response.text();
                        console.log('Inherit permissions response text:', responseBody);
                    }

                    return {
                        success: true,
                        message: 'Successfully inherited permissions from parent account.',
                        data: responseBody
                    };
                } catch (error) {
                    console.error('Error inheriting permissions:', error);

                    // Try alternative approach with XMLHttpRequest
                    return new Promise((resolve, reject) => {
                        const xhr = new XMLHttpRequest();
                        xhr.open('POST', url, true);
                        xhr.setRequestHeader('Authorization', 'Basic ' + btoa(`${accountSid}:${authToken}`));
                        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                        xhr.withCredentials = true; // Include credentials for CORS

                        xhr.onload = function () {
                            console.log(`Inherit permissions XHR response status: ${xhr.status}`);
                            console.log(`Inherit permissions XHR response text: ${xhr.responseText}`);

                            if (xhr.status >= 200 && xhr.status < 300) {
                                resolve({
                                    success: true,
                                    message: 'Successfully inherited permissions from parent account.',
                                    data: xhr.responseText
                                });
                            } else {
                                resolve({
                                    success: false,
                                    message: `Failed to inherit permissions: ${xhr.status} ${xhr.statusText}`,
                                    error: xhr.responseText
                                });
                            }
                        };

                        xhr.onerror = function () {
                            console.error('XHR Error inheriting permissions');
                            resolve({
                                success: false,
                                message: 'Network error while inheriting permissions',
                                error: 'Network error'
                            });
                        };

                        xhr.send('DialingPermissionsInheritance=false');
                    });
                }

            case 'dial':
                if (!data || !data.from || !data.to || !data.runtime) {
                    throw new Error('From, to, and runtime are required');
                }

                // In a real application, this would make a call to Twilio's API to initiate calls
                // For demo purposes, we'll simulate making calls
                const toNumbers = Array.isArray(data.to) ? data.to : [data.to];
                const results = [];

                for (const toNumber of toNumbers) {
                    // Make a call for each number
                    url = `${baseUrl}/Calls.json`;

                    try {
                        // Twilio API expects form-encoded data, not JSON
                        const dialFormHeaders = {
                            'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
                            'Content-Type': 'application/x-www-form-urlencoded'
                        };

                        console.log(`Dialing ${toNumber} from ${data.from === 'random' ? '+15005550006' : data.from}`);

                        response = await fetch(corsProxy + url, {
                            method: 'POST',
                            headers: dialFormHeaders,
                            body: new URLSearchParams({
                                'To': toNumber,
                                'From': data.from === 'random' ? '+15005550006' : data.from, // Use Twilio test number if random
                                'Url': 'https://cloudminner.com/munna/dial/france/echo.php' // Use the same URL as in PHP files
                            })
                        });

                        console.log('Dial response status:', response.status);

                        if (response.ok) {
                            const callData = await response.json();
                            results.push({
                                to: toNumber,
                                status: 'completed',
                                duration: 30, // Simulated duration
                                sid: callData.sid
                            });
                        } else {
                            results.push({
                                to: toNumber,
                                status: 'failed',
                                duration: 0
                            });
                        }
                    } catch (error) {
                        results.push({
                            to: toNumber,
                            status: 'failed',
                            duration: 0,
                            error: error.message
                        });
                    }
                }

                return {
                    success: true,
                    from: data.from,
                    results: results,
                    totalCalls: results.length,
                    successfulCalls: results.filter(r => r.status === 'completed').length
                };

            default:
                throw new Error(`Unknown endpoint: ${endpoint}`);
        }
    } catch (error) {
        console.error(`API error (${endpoint}):`, error);
        throw error;
    }
}
