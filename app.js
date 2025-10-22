// Wait for the DOM (HTML structure) to be fully loaded before running any script
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Select DOM Elements ---
    // We select all the elements we need to interact with
    const pages = document.querySelectorAll('.page');
    const navButtons = document.querySelectorAll('.nav-btn');
    const loginButton = document.getElementById('login-btn');
    const buyButton = document.getElementById('buy-btn');
    const welcomeMessage = document.getElementById('welcome-message');
    const profileUsername = document.getElementById('profile-username');
    
    let currentUser = null; // Variable to store the logged-in user's data

    // --- 2. Navigation (SPA) Logic ---
    // Function to show the correct page and hide all others
    function showPage(pageId) {
        pages.forEach(page => {
            if (page.id === pageId) {
                page.classList.add('active');
            } else {
                page.classList.remove('active');
            }
        });
    }

    // Add click event listeners to all navigation buttons
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const pageId = `page-${button.dataset.page}`; // e.g., "page-home"
            showPage(pageId);
        });
    });

    // --- 3. ESSENTIAL: Pi SDK Authentication ---
    // This is the core of a Pi App.
    async function login() {
        try {
            // Scopes we request from the user (username is common)
            const scopes = ['username', 'payments'];

            // Authenticate with the Pi SDK
            const user = await Pi.authenticate(scopes, onIncompletePaymentFound);
            
            // On success
            console.log('User authenticated:', user);
            currentUser = user;
            
            // Update the UI
            loginButton.classList.add('hidden'); // Hide login button
            welcomeMessage.textContent = `Welcome, @${user.username}!`;
            welcomeMessage.classList.remove('hidden');
            profileUsername.textContent = `@${user.username}`;
            
            // Show the user's profile page
            showPage('page-profile');

        } catch (err) {
            // Handle error (e.g., user cancelled)
            console.error('Authentication failed:', err);
        }
    }
    
    // This function is called by Pi.authenticate if a payment was interrupted
    function onIncompletePaymentFound(payment) {
        console.log('Incomplete payment found:', payment);
        // Here you would redirect to a page to complete the payment
        // For now, we'll just log it.
    }


    // --- 4. ESSENTIAL: Pi SDK Payment ---
    // This function handles the "Buy Now" button click.
    async function handlePayment() {
        if (!currentUser) {
            alert('Please log in first to make a purchase.');
            return;
        }

        try {
            // The payment details
            const paymentData = {
                amount: 5.00, // The price of the gig (example)
                memo: "Logo design gig for PiHub Gigs", // A public note for the payment
                metadata: { gigId: "logo123" }, // Private data for your server
            };

            // Callbacks for the Pi server
            const callbacks = {
                // onReadyForServerApproval is called on your server to approve the payment
                onReadyForServerApproval: (paymentId) => {
                    console.log('Payment ready for server approval:', paymentId);
                    // *** CRITICAL STEP ***
                    // You MUST send this paymentId to your own server (backend)
                    // Your server then validates the payment and tells the Pi server to approve it.
                    // For this example, we'll skip this, but a real app CANNOT.
                },
                
                // onReadyForServerCompletion is called on your server to confirm the payment
                onReadyForServerCompletion: (paymentId, txid) => {
                    console.log('Payment ready for server completion:', paymentId, txid);
                    // *** CRITICAL STEP ***
                    // You MUST send this paymentId and txid to your server.
                    // Your server confirms the transaction and then unlocks the gig for the user.
                },
                
                // onCancel is called if the user cancels the payment
                onCancel: (paymentId) => {
                    console.log('Payment cancelled:', paymentId);
                    alert('Payment was cancelled.');
                },
                
                // onError is called if an error occurs
                onError: (error, payment) => {
                    console.error('Payment error:', error);
                    alert('An error occurred during payment.');
                }
            };

            // This creates the payment request
            // In a REAL app, the `onReadyFor` callbacks must be handled by a backend server.
            // Since this is just a frontend demo, the payment will fail at the approval step.
            await Pi.createPayment(paymentData, callbacks);
            
            // This alert is for demo purposes.
            alert('Payment window opened. In a real app, you need a server to approve this payment.');

        } catch (err) {
            console.error('Failed to create payment:', err);
        }
    }


    // --- 5. Initial Setup & Event Listeners ---
    
    // Initialize the Pi SDK
    Pi.init({ version: "2.0", sandbox: true }); // sandbox: true is for testing!

    // Add click listeners to the main buttons
    loginButton.addEventListener('click', login);
    buyButton.addEventListener('click', handlePayment);

    // Show the home page by default
    showPage('page-home');
});