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

// room-chat-frontend/scripts/login.js

window.initiateGoogleLogin = () => {
    sessionStorage.setItem('auth_provider', 'google'); // Track the provider
    const params = new URLSearchParams({
        client_id: CONFIG.GOOGLE_CLIENT_ID,
        redirect_uri: CONFIG.FRONTEND_URL,
        response_type: 'code',
        scope: 'email profile',
        prompt: 'select_account'
    });
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
};

window.initiateGithubLogin = () => {
    sessionStorage.setItem('auth_provider', 'github'); // Track the provider
    const params = new URLSearchParams({
        client_id: CONFIG.GITHUB_CLIENT_ID,
        redirect_uri: CONFIG.FRONTEND_URL,
        scope: 'user:email read:user'
    });
    window.location.href = `https://github.com/login/oauth/authorize?${params}`;
};

window.onload = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const provider = sessionStorage.getItem('auth_provider');

    if (code && provider) {
        UI.showStatus('status-message', `AUTHENTICATING VIA ${provider.toUpperCase()}...`, "success");
        
        const endpoint = provider === 'google' ? '/api/auth/google/' : '/api/auth/github/';
        const res = await API.request(endpoint, 'POST', { code });

        if (res.ok) {
            UI.showStatus('status-message', "ACCESS GRANTED", "success");
            localStorage.setItem('token', res.data.key);
            sessionStorage.removeItem('auth_provider');
            window.history.replaceState({}, document.title, window.location.pathname);
            setTimeout(() => window.location.href = 'dashboard.html', 1000);
        } else {
            UI.showStatus('status-message', "AUTH FAILED: " + JSON.stringify(res.data), "error");
        }
    }
};