import { API } from '../assets/js/api.js';
import { UI } from '../assets/js/ui.js';

window.switchTab = (tab) => {
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.getElementById(`${tab}-form`).classList.add('active');
    document.getElementById(`tab-${tab}`).classList.add('active');
};

window.handleLogin = async (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    UI.showStatus('status-message', "VALIDATING...", "success");
    
    const res = await API.request('/api/users/login/', 'POST', { username, password });
    if (res.ok) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('username', res.data.username);
        window.location.href = 'home.html'; // Connection Fixed
    } else {
        UI.showStatus('status-message', res.data.detail || "LOGIN FAILED", "error");
    }
};

window.handleRegister = async (e) => {
    e.preventDefault();
    const data = {
        username: document.getElementById('reg-username').value,
        email: document.getElementById('reg-email').value,
        password: document.getElementById('reg-password').value
    };
    const res = await API.request('/api/users/register/', 'POST', data);
    if (res.ok) { UI.showStatus('status-message', "CREATED. PLEASE LOGIN.", "success"); window.switchTab('login'); }
    else { UI.showStatus('status-message', "REGISTRATION FAILED", "error"); }
};