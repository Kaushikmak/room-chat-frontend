import { API } from '../assets/js/api.js';
import { UI } from '../assets/js/ui.js';
import { CONFIG } from '../assets/js/config.js';

// --- TAB SWITCHING ---
window.switchTab = (tab) => {
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.getElementById(`${tab}-form`).classList.add('active');
    document.getElementById(`tab-${tab}`).classList.add('active');
};

// --- STANDARD AUTH ---
window.handleLogin = async (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    UI.showStatus('status-message', "VALIDATING...", "success");
    
    const res = await API.request('/api/users/login/', 'POST', { username, password });
    if (res.ok) completeLogin(res.data);
    else UI.showStatus('status-message', res.data.detail || "LOGIN FAILED", "error");
};

window.handleRegister = async (e) => {
    e.preventDefault();
    const data = {
        username: document.getElementById('reg-username').value,
        email: document.getElementById('reg-email').value,
        password: document.getElementById('reg-password').value
    };
    const res = await API.request('/api/users/register/', 'POST', data);
    if (res.ok) { 
        UI.showStatus('status-message', "CREATED. PLEASE LOGIN.", "success"); 
        window.switchTab('login'); 
    } else { 
        UI.showStatus('status-message', "REGISTRATION FAILED", "error"); 
    }
};

// --- SOCIAL LOGIN LOGIC ---

// 1. Redirect user to Provider
window.initiateSocialLogin = (provider) => {
    const state = generateRandomString(); // Anti-CSRF
    localStorage.setItem('oauth_state', state);
    localStorage.setItem('oauth_provider', provider);

    let authUrl = "";
    const redirectUri = encodeURIComponent(CONFIG.REDIRECT_URI);

    if (provider === 'google') {
        const clientId = encodeURIComponent(CONFIG.GOOGLE_CLIENT_ID);
        const scope = encodeURIComponent("email profile");
        authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`;
    } else if (provider === 'github') {
        const clientId = encodeURIComponent(CONFIG.GITHUB_CLIENT_ID);
        const scope = encodeURIComponent("user:email read:user");
        authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`;
    }

    if (authUrl) window.location.href = authUrl;
};

// 2. Handle Callback (Runs on Page Load)
async function checkSocialCallback() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const returnedState = params.get('state');
    const storedState = localStorage.getItem('oauth_state');
    const provider = localStorage.getItem('oauth_provider');

    // Only proceed if we have a code and it matches our initiated session
    if (code && returnedState && returnedState === storedState && provider) {
        
        // Clean URL immediately
        window.history.replaceState({}, document.title, window.location.pathname);
        UI.showStatus('status-message', `CONNECTING TO ${provider.toUpperCase()}...`, "success");

        try {
            // Exchange code for token via Django Backend
            const payload = { 
                code: code,
                callback_url: CONFIG.REDIRECT_URI // Django needs to verify this
            };
            
            const endpoint = provider === 'google' ? '/api/auth/google/' : '/api/auth/github/';
            const res = await API.request(endpoint, 'POST', payload);

            if (res.ok) {
                // If API returns just {key: "..."}
                const token = res.data.key || res.data.token;
                // We might need to fetch profile separately if backend doesn't return username
                if(token) {
                    localStorage.setItem('token', token);
                    // Fetch user details to get username
                    const profileRes = await API.request('/api/users/profile/', 'GET', null, true);
                    if(profileRes.ok) {
                        completeLogin({ token, username: profileRes.data.username });
                    } else {
                        // Fallback if profile fetch fails (rare)
                        completeLogin({ token, username: 'User' });
                    }
                }
            } else {
                console.error(res);
                UI.showStatus('status-message', `SOCIAL LOGIN FAILED: ${JSON.stringify(res.data)}`, "error");
            }
        } catch (err) {
            console.error(err);
            UI.showStatus('status-message', "CONNECTION ERROR", "error");
        }

        // Cleanup
        localStorage.removeItem('oauth_state');
        localStorage.removeItem('oauth_provider');
    }
}

// Helper: Save Session
function completeLogin(data) {
    if(data.token) localStorage.setItem('token', data.token);
    if(data.key) localStorage.setItem('token', data.key); // dj-rest-auth sometimes uses 'key'
    if(data.username) localStorage.setItem('username', data.username);
    
    window.location.href = '../pages/home.html';
}

function generateRandomString() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Run callback check on load
checkSocialCallback();