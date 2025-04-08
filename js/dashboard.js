document.addEventListener('DOMContentLoaded', function () {
    // Get account data from session storage
    const accountData = getAccountData();

    if (!accountData) {
        showNotification('Error loading account data', 'error');
        return;
    }

    // Populate account information
    populateAccountInfo(accountData);

    // Setup inherit permission button if it's a subaccount
    setupInheritPermission(accountData);
});

function populateAccountInfo(accountData) {
    // Account name
    const accountNameElement = document.getElementById('account-name');
    if (accountNameElement) {
        accountNameElement.textContent = accountData.friendlyName || 'Twilio Account';
    }

    // Account type
    const accountTypeElement = document.getElementById('account-type');
    if (accountTypeElement) {
        const isOwner = accountData.ownerAccountSid && accountData.sid && (accountData.ownerAccountSid.toLowerCase() === accountData.sid.toLowerCase());
        accountTypeElement.textContent = isOwner ? 'Owner Account' : 'Subaccount';
        accountTypeElement.innerHTML += ` <span class="badge ${isOwner ? 'badge-primary' : 'badge-secondary'}">${isOwner ? 'Primary' : 'Secondary'}</span>`;
    }

    // Account status
    const accountStatusElement = document.getElementById('account-status');
    if (accountStatusElement) {
        accountStatusElement.textContent = accountData.status || 'Active';
    }

    // Subscription type
    const subscriptionTypeElement = document.getElementById('subscription-type');
    if (subscriptionTypeElement) {
        const isTrial = accountData.subscription === 'Trial';
        subscriptionTypeElement.textContent = accountData.subscription || 'Unknown';
        subscriptionTypeElement.innerHTML += ` <span class="badge ${isTrial ? 'badge-warning' : 'badge-success'}">${isTrial ? 'Limited' : 'Full'}</span>`;
    }

    // Account balance
    const accountBalanceElement = document.getElementById('account-balance');
    if (accountBalanceElement) {
        accountBalanceElement.textContent = accountData.balance || '$0.00';
    }

    // Account SID
    const accountSidElement = document.getElementById('account-sid');
    if (accountSidElement) {
        const accountSid = sessionStorage.getItem('twilioAccountSid');
        accountSidElement.textContent = accountSid || 'Not available';
    }

    // Created and updated dates (using mock data for demo)
    const now = new Date();
    const createdDate = new Date(now);
    createdDate.setMonth(now.getMonth() - 3); // 3 months ago

    const updatedDate = new Date(now);
    updatedDate.setDate(now.getDate() - 5); // 5 days ago

    const accountCreatedElement = document.getElementById('account-created');
    if (accountCreatedElement) {
        accountCreatedElement.textContent = formatDate(createdDate);
    }

    const accountUpdatedElement = document.getElementById('account-updated');
    if (accountUpdatedElement) {
        accountUpdatedElement.textContent = formatDate(updatedDate);
    }
}

function setupInheritPermission(accountData) {
    const container = document.getElementById('inherit-permission-container');
    const btn = document.getElementById('inherit-permission-btn');
    if (!container || !btn) {
        return;
    }
    
    // Use the twilioAccountSid stored in session as the definitive owner SID if available.
    const sessionOwnerSid = sessionStorage.getItem('twilioAccountSid');
    let isOwner = false;
    if (sessionOwnerSid && accountData.sid) {
        isOwner = (sessionOwnerSid.toLowerCase() === accountData.sid.toLowerCase());
    } else if (accountData.ownerAccountSid && accountData.sid) {
        isOwner = (accountData.ownerAccountSid.toLowerCase() === accountData.sid.toLowerCase());
    } else if (accountData.type && accountData.type.toLowerCase() === 'owner') {
        isOwner = true;
    }
    
    if (!isOwner) {
        container.style.display = 'block';
        btn.addEventListener('click', async function() {
            try {
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
                const response = await simulateApiCall('inherit-permissions', 'POST');
                showNotification(response.message || 'Successfully inherited permissions');
            } catch (error) {
                showNotification(error.message || 'Failed to inherit permissions', 'error');
            } finally {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-key"></i> Inherit Permission';
            }
        });
    } else {
        container.style.display = 'none';
    }
}
