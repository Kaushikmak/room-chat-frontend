import { CONFIG } from '../assets/js/config.js';
import { API } from '../assets/js/api.js';
import { UI } from '../assets/js/ui.js';

// Global Scope Attachment for HTML onclick events
window.switchTab = (tab) => {
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.getElementById(`${tab}-form`).classList.add('active');
    document.getElementById(`tab-${tab}`).classList.add('active');
    UI.hideStatus('status-message');
};

window.handleLogin = async (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    const res = await API.request('/api/users/login/', 'POST', { username, password });

    if (res.ok) {
        UI.showStatus('status-message', "ACCESS GRANTED", "success");
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user_id', res.data.user_id);
        localStorage.setItem('username', res.data.username);
        setTimeout(() => window.location.href = 'dashboard.html', 1000);
    } else {
        UI.showStatus('status-message', res.data.detail || "LOGIN FAILED", "error");
    }
};

window.handleRegister = async (e) => {
    e.preventDefault();
    const username = document.getElementById('reg-username').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;

    const res = await API.request('/api/users/register/', 'POST', { username, email, password });

    if (res.ok) {
        UI.showStatus('status-message', "IDENTITY CREATED. PLEASE LOGIN.", "success");
        setTimeout(() => window.switchTab('login'), 1500);
    } else {
        let msg = "REGISTRATION FAILED";
        if (typeof res.data === 'object') msg = Object.values(res.data).flat().join(', ');
        UI.showStatus('status-message', msg, "error");
    }
};

window.initiateGoogleLogin = () => {
    const params = new URLSearchParams({
        client_id: CONFIG.GOOGLE_CLIENT_ID,
        redirect_uri: CONFIG.FRONTEND_URL, // Points to login.html
        response_type: 'code',
        scope: 'email profile',
        prompt: 'select_account'
    });
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
};

window.initiateGithubLogin = () => {
    // FIXED: Redirect to Frontend, NOT Backend
    const params = new URLSearchParams({
        client_id: CONFIG.GITHUB_CLIENT_ID,
        redirect_uri: CONFIG.FRONTEND_URL, // Points to login.html
        scope: 'user:email read:user'
    });
    window.location.href = `https://github.com/login/oauth/authorize?${params}`;
};

// OAuth Code Handler
window.onload = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');

    // Determine which provider sent us back
    // (In a real app, you might store a 'provider' in sessionStorage before redirecting)
    // For now, we try Google first, if that fails (400), we try GitHub.
    
    if (code) {
        UI.showStatus('status-message', "ANALYZING SECURITY TOKEN...", "success");
        
        // 1. Try Google
        let res = await API.request('/api/auth/google/', 'POST', { code });
        
        // 2. If Google fails, Try GitHub
        if (!res.ok) {
            console.log("Not Google, trying GitHub...");
            res = await API.request('/api/auth/github/', 'POST', { code });
        }

        if (res.ok) {
            UI.showStatus('status-message', "ACCESS GRANTED", "success");
            localStorage.setItem('token', res.data.key);
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
            // Redirect
            setTimeout(() => window.location.href = 'dashboard.html', 1000);
        } else {
            UI.showStatus('status-message', "AUTHENTICATION FAILED: " + JSON.stringify(res.data), "error");
        }
    }
};