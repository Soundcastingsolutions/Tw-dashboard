document.addEventListener('DOMContentLoaded', function() {
    const enableGeoBtn = document.getElementById('enableGeoBtn');
    if (enableGeoBtn) {
        enableGeoBtn.addEventListener('click', async function() {
            try {
                // Disable button and show loading state
                enableGeoBtn.disabled = true;
                enableGeoBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enabling GEO...';
                
                // Perform the actual request to the PHP endpoint
                const response = await fetch('php/enable_geo.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    // Provide any necessary data in the request body; using empty object if not required
                    body: JSON.stringify({})
                });
                const result = await response.json();
                if (response.ok) {
                    showNotification(result.message || 'Geo enabled successfully');
                } else {
                    showNotification(result.message || 'Failed to enable GEO', 'error');
                }
            } catch (error) {
                showNotification(error.message || 'Error enabling GEO', 'error');
            } finally {
                // Reset the button after request completes
                enableGeoBtn.disabled = false;
                enableGeoBtn.innerHTML = '<i class="fas fa-globe"></i> Enable GEO';
            }
        });
    }
});
