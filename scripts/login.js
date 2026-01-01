import { CONFIG } from '../assets/js/config.js';
import { API } from '../assets/js/api.js';
import { UI } from '../assets/js/ui.js';

// Tab Switching Logic
window.switchTab = (tab) => {
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.getElementById(`${tab}-form`).classList.add('active');
    document.getElementById(`tab-${tab}`).classList.add('active');
    UI.hideStatus('status-message');
};

// Standard Login Handler
window.handleLogin = async (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    UI.showStatus('status-message', "VALIDATING CREDENTIALS...", "success");
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

// Standard Registration Handler
window.handleRegister = async (e) => {
    e.preventDefault();
    const username = document.getElementById('reg-username').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;

    UI.showStatus('status-message', "TRANSMITTING IDENTITY DATA...", "success");
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