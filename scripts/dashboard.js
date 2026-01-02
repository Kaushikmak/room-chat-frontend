import { API } from '../assets/js/api.js';
import { UI } from '../assets/js/ui.js';

// Auth Guard
if (!API.isAuthenticated()) window.location.href = 'login.html';

// --- THEME LOGIC (NEW) ---
window.toggleTheme = () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    const icon = document.getElementById('theme-icon');
    if (icon) icon.textContent = next === 'dark' ? '🌙' : '☀️';
};

function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    const icon = document.getElementById('theme-icon');
    if (icon) icon.textContent = savedTheme === 'dark' ? '🌙' : '☀️';
}

// --- INITIALIZATION ---
async function init() {
    initTheme(); // Apply theme on load
    await fetchProfile();
    await fetchFriends();
    renderHistory();
}

// --- PROFILE LOGIC ---
async function fetchProfile() {
    const res = await API.request('/api/users/profile/', 'GET', null, true);
    if (res.ok) {
        const user = res.data;
        document.getElementById('display-username').textContent = user.username;
        document.getElementById('display-email').textContent = user.email;
        
        // Pre-fill edit form
        document.getElementById('edit-username').value = user.username;
        document.getElementById('edit-email').value = user.email;
    }
}

window.toggleEditMode = (show) => {
    const section = document.getElementById('edit-section');
    if (show) section.classList.remove('hidden');
    else section.classList.add('hidden');
};

window.handleProfileUpdate = async (e) => {
    e.preventDefault();
    const username = document.getElementById('edit-username').value;
    const email = document.getElementById('edit-email').value;
    const password = document.getElementById('edit-password').value;

    const payload = { username, email };
    if (password) payload.password = password;

    const res = await API.request('/api/users/profile/', 'PUT', payload, true);

    if (res.ok) {
        UI.showStatus('status-message', "SYSTEM UPDATED SUCCESSFULLY", "success");
        await fetchProfile(); // Refresh UI
        window.toggleEditMode(false);
    } else {
        UI.showStatus('status-message', "UPDATE FAILED: " + JSON.stringify(res.data), "error");
    }
};

window.handleLogout = () => API.logout();

// --- FRIENDS LOGIC ---
async function fetchFriends() {
    const res = await API.request('/api/users/friends/', 'GET', null, true);
    if (res.ok) {
        renderFriends(res.data);
    }
}

function renderFriends(friends) {
    const container = document.getElementById('friends-grid');
    if (friends.length === 0) {
        container.innerHTML = '<div style="padding:10px; font-style:italic;">No allies found.</div>';
        return;
    }

    container.innerHTML = friends.map(f => {
        const lastLogin = f.friend.last_login ? new Date(f.friend.last_login) : null;
        const now = new Date();
        
        // Simple logic: Online if active in last 15 minutes
        const isOnline = lastLogin && (now - lastLogin) < (15 * 60 * 1000); 
        const statusClass = isOnline ? 'status-online' : 'status-offline';
        const timeText = lastLogin ? timeAgo(lastLogin) : 'Never';

        return `
        <div class="friend-card" onclick="window.location.href='home.html'">
            <div style="font-weight:900; margin-bottom:5px;">${f.friend.username}</div>
            <div style="font-size:0.75rem; color:#555;">
                <span class="status-dot ${statusClass}"></span>
                ${isOnline ? 'ONLINE' : timeText}
            </div>
        </div>
        `;
    }).join('');
}

// --- HISTORY LOGIC ---
function renderHistory() {
    const container = document.getElementById('history-list');
    const history = JSON.parse(localStorage.getItem('room_history') || '[]');

    if (history.length === 0) {
        container.innerHTML = '<div style="padding:15px; opacity:0.6;">No dive logs recorded.</div>';
        return;
    }

    container.innerHTML = history.map(item => `
        <div class="history-item" onclick="window.location.href='home.html?room=${item.id}'">
            <div>
                <span style="font-weight:800;"># ${item.topic.toUpperCase()}</span> / 
                <span>${item.name}</span>
            </div>
            <div style="font-size:0.8rem; opacity:0.6;">
                ${new Date(item.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </div>
        </div>
    `).join('');
}

// Helper: Time Ago
function timeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return "Just now";
}

init();