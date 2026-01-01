import { API } from '../assets/js/api.js';
import { UI } from '../assets/js/ui.js';

// Auth Guard
if (!API.isAuthenticated()) {
    window.location.href = 'login.html';
}

// Global Exports for HTML Buttons
window.handleLogout = () => API.logout();

window.toggleEditMode = (show) => {
    const view = document.getElementById('profile-view');
    const edit = document.getElementById('profile-edit');
    const status = document.getElementById('status-message');
    
    if (show) {
        view.classList.add('hidden');
        edit.classList.remove('hidden');
    } else {
        edit.classList.add('hidden');
        view.classList.remove('hidden');
    }
    status.classList.add('hidden');
};

window.handleProfileUpdate = async (e) => {
    e.preventDefault();
    const username = document.getElementById('edit-username').value;
    const email = document.getElementById('edit-email').value;

    const res = await API.request('/api/users/profile/', 'PUT', { username, email }, true);

    if (res.ok) {
        UI.showStatus('status-message', "IDENTITY REWRITTEN", "success");
        updateUI(res.data);
        setTimeout(() => window.toggleEditMode(false), 1000);
    } else {
        UI.showStatus('status-message', "UPDATE FAILED", "error");
    }
};

// Internal Logic
async function fetchProfile() {
    const res = await API.request('/api/users/profile/', 'GET', null, true);
    if (res.ok) {
        updateUI(res.data);
    } else {
        if (res.status === 401) API.logout();
        UI.showStatus('status-message', "FAILED TO LOAD DATA", "error");
    }
}

function updateUI(user) {
    document.getElementById('nav-username').textContent = user.username.toUpperCase();
    document.getElementById('display-username').textContent = user.username;
    document.getElementById('display-email').textContent = user.email || "N/A";
    
    document.getElementById('edit-username').value = user.username;
    document.getElementById('edit-email').value = user.email || "";
}

// Init
fetchProfile();