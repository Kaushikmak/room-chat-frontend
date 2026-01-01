/* CONFIGURATION */
const API_BASE_URL = "https://room-chat-api-eudf.onrender.com";
const FRONTEND_URL = "https://www.room-chat.com/login"; // Must match Backend settings

/* CREDENTIALS */
const GOOGLE_CLIENT_ID = "330254000032-a44jgat9dsffraenoa0fuucqa5tv6lo7.apps.googleusercontent.com";
const GITHUB_CLIENT_ID = "Ov23libTC9bolbUzZeBA";

// Hardcoded callback in backend base/views_auth.py:
// Google: "https://www.room-chat.com/login"
// GitHub: "https://room-chat-api-eudf.onrender.com/accounts/github/login/callback/"

/* TAB SWITCHING LOGIC */
function switchTab(tab) {
    // Hide all forms
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));

    // Show selected
    document.getElementById(`${tab}-form`).classList.add('active');
    document.getElementById(`tab-${tab}`).classList.add('active');
    
    // Clear messages
    hideStatus();
}

/* HELPERS */
function showStatus(message, type) {
    const el = document.getElementById('status-message');
    el.textContent = message;
    el.className = `status-box ${type}`; // error or success
    el.classList.remove('hidden');
}

function hideStatus() {
    document.getElementById('status-message').classList.add('hidden');
}

/* API: LOGIN */
async function handleLogin(e) {
    e.preventDefault();
    hideStatus();

    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch(`${API_BASE_URL}/api/users/login/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            showStatus("LOGIN SUCCESSFUL. INITIALIZING PROTOCOL...", "success");
            // Store token
            localStorage.setItem('token', data.token);
            localStorage.setItem('user_id', data.user_id);
            localStorage.setItem('username', data.username);
            
            // Redirect or Update UI
            setTimeout(() => {
                window.location.href = '/rooms.html'; // Or wherever the app lives
            }, 1000);
        } else {
            showStatus(data.detail || "ACCESS DENIED", "error");
        }
    } catch (err) {
        showStatus("NETWORK FAILURE", "error");
        console.error(err);
    }
}

/* API: REGISTER */
async function handleRegister(e) {
    e.preventDefault();
    hideStatus();

    const username = document.getElementById('reg-username').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;

    try {
        const response = await fetch(`${API_BASE_URL}/api/users/register/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            showStatus("IDENTITY CREATED. PLEASE LOGIN.", "success");
            // Switch to login tab automatically
            setTimeout(() => switchTab('login'), 1500);
        } else {
            // Handle validation errors (e.g., username taken)
            let msg = "REGISTRATION FAILED";
            if (typeof data === 'object') {
                msg = Object.values(data).flat().join(', ');
            }
            showStatus(msg, "error");
        }
    } catch (err) {
        showStatus("NETWORK FAILURE", "error");
    }
}

/* SOCIAL LOGIN HANDLERS */

function initiateGoogleLogin() {
    // Construct Google OAuth URL
    // Scope: profile email
    // Redirect URI MUST match the one in Django backend (base/views_auth.py)
    const params = {
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: FRONTEND_URL, 
        response_type: 'code',
        scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
        include_granted_scopes: 'true',
        prompt: 'select_account'
    };

    const queryString = new URLSearchParams(params).toString();
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${queryString}`;
    
    window.location.href = authUrl;
}

function initiateGithubLogin() {
    // Construct GitHub OAuth URL
    // WARNING: Your backend expects the callback at the *backend API URL*.
    // This will redirect the user to the API, returning JSON, not back to this page.
    const backendCallback = "https://room-chat-api-eudf.onrender.com/accounts/github/login/callback/";
    
    const params = {
        client_id: GITHUB_CLIENT_ID,
        redirect_uri: backendCallback,
        scope: 'user:email read:user'
    };

    const queryString = new URLSearchParams(params).toString();
    const authUrl = `https://github.com/login/oauth/authorize?${queryString}`;

    window.location.href = authUrl;
}

/* OAUTH CALLBACK HANDLER */
// This runs on page load to check if we came back from Google
window.onload = async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');

    if (error) {
        showStatus("SOCIAL AUTH FAILED: " + error, "error");
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
    } else if (code) {
        // We have a code from Google, send it to backend
        showStatus("VERIFYING SATELLITE UPLINK (GOOGLE)...", "success");
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/google/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: code })
            });

            const data = await response.json();

            if (response.ok) {
                // Determine token key (dj-rest-auth typically returns 'key' or 'access_token')
                const token = data.key || data.access_token || data.token;
                
                if(token) {
                    localStorage.setItem('token', token);
                    // Usually you need to fetch user details separately with this token
                    // if they aren't included in the social login response
                    showStatus("AUTHENTICATED VIA GOOGLE", "success");
                    setTimeout(() => {
                        window.location.href = '/rooms.html'; 
                    }, 1000);
                } else {
                    showStatus("NO TOKEN RECEIVED", "error");
                }
            } else {
                showStatus("GOOGLE LOGIN FAILED AT BACKEND", "error");
                console.error(data);
            }
        } catch (err) {
            showStatus("SERVER ERROR ON SOCIAL AUTH", "error");
            console.error(err);
        }
        
        // Clean URL so the code isn't stuck there
        window.history.replaceState({}, document.title, window.location.pathname);
    }
};