import { API } from '../assets/js/api.js';
import { UI } from '../assets/js/ui.js';

// Auth Guard
if (!API.isAuthenticated()) window.location.href = 'login.html';

// --- HELPER: Loader HTML ---
const getLoaderHtml = () => '<div class="loader-container"><span class="neo-spinner"></span></div>';

// --- FRIENDS LOGIC ---
async function fetchFriends() {
    const container = document.getElementById('friends-grid');
    // 1. Show Loader
    container.innerHTML = getLoaderHtml();

    const res = await API.request('/api/users/friends/', 'GET', null, true);
    if (res.ok) {
        renderFriends(res.data);
    } else {
        container.innerHTML = '<div style="padding:20px; text-align:center; opacity:0.6;">Network Error.</div>';
    }
}

function renderFriends(friends) {
    const container = document.getElementById('friends-grid');
    if (friends.length === 0) {
        container.innerHTML = '<div style="padding:20px; text-align:center; opacity:0.6; grid-column: 1/-1;">NO ALLIES DETECTED.</div>';
        return;
    }

    container.innerHTML = friends.map(f => {
        const lastLogin = f.friend.last_login ? new Date(f.friend.last_login) : null;
        const now = new Date();
        const isOnline = lastLogin && (now - lastLogin) < (15 * 60 * 1000); 
        const statusClass = isOnline ? 'status-online' : 'status-offline';
        const timeText = lastLogin ? timeAgo(lastLogin) : 'Never';

        return `
        <div class="friend-card" onclick="window.location.href='home.html'">
            <div class="avatar-circle" style="margin: 0 auto 10px auto; background:var(--box-text); color:var(--box-bg);">
                ${f.friend.username.charAt(0).toUpperCase()}
            </div>
            <div style="font-weight:900; font-size:1.1rem;">${f.friend.username}</div>
            <div style="font-size:0.8rem; opacity:0.7;">
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
    
    // Simulate a brief "check" for effect, or just load instantly. 
    // Since this is local storage, it's instant, but for consistency lets render:
    const history = JSON.parse(localStorage.getItem('room_history') || '[]');

    if (history.length === 0) {
        container.innerHTML = '<div style="padding:20px; text-align:center; opacity:0.6; font-style:italic;">Log banks empty.</div>';
        return;
    }

    container.innerHTML = history.map(item => `
        <div class="log-item" onclick="window.location.href='home.html?room=${item.id}'">
            <span>
                <span style="color:var(--main-accent);">#</span> ${item.topic.toUpperCase()} / 
                <strong>${item.name}</strong>
            </span>
            <span style="font-family:monospace; font-size:0.8rem;">
                ${new Date(item.time).toLocaleDateString()}
            </span>
        </div>
    `).join('');
}

// --- UI LOGIC ---
window.toggleTheme = () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    updateThemeIcon();
};

function updateThemeIcon() {
    const theme = localStorage.getItem('theme') || 'light';
    const icon = document.getElementById('theme-icon');
    if (icon) icon.textContent = theme === 'dark' ? '🌙' : '☀️';
}

window.switchPanel = (panelId) => {
    // Hide all panels
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    // Deactivate nav buttons
    document.querySelectorAll('.dash-nav-btn').forEach(b => b.classList.remove('active'));
    
    // Show target
    document.getElementById(`panel-${panelId}`).classList.add('active');
    // Highlight button (simple lookup by onclick text match would be brittle, so we rely on index or just adding IDs to buttons if needed, but for now specific event delegation is fine or simple loop)
    // Actually, let's just find the button that called this.
    // Since we don't pass 'this', we handle styling manually or add IDs to buttons in HTML.
    // For simplicity in this vanilla JS setup, let's just leave the active state management to the specific button click if passed, 
    // OR roughly match by text content in a real app. 
    // To make it robust without changing HTML too much:
    const buttons = document.querySelectorAll('.dash-nav-btn');
    if (panelId === 'settings') buttons[0].classList.add('active');
    if (panelId === 'network') buttons[1].classList.add('active');
    if (panelId === 'logs') buttons[2].classList.add('active');
};

// --- INITIALIZATION ---
async function init() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon();

    await fetchProfile();
    await fetchFriends();
    renderHistory();
}

// --- IDENTITY & SECURITY ---
async function fetchProfile() {
    const res = await API.request('/api/users/profile/', 'GET', null, true);
    if (res.ok) {
        const user = res.data;
        // Sidebar Updates
        document.getElementById('sidebar-username').textContent = user.username;
        document.getElementById('avatar-display').textContent = user.username.charAt(0).toUpperCase();
        
        if (user.last_login) {
            const date = new Date(user.last_login);
            document.getElementById('last-login-badge').textContent = `LAST LOGIN: ${date.toLocaleDateString()}`;
        }

        // Form Pre-fill
        document.getElementById('edit-username').value = user.username;
        document.getElementById('edit-email').value = user.email;
    }
}

window.handleIdentityUpdate = async (e) => {
    e.preventDefault();
    const btn = e.submitter; // Get the button that triggered submit
    const originalText = btn.textContent;
    btn.textContent = "PROCESSING...";
    btn.disabled = true;

    const username = document.getElementById('edit-username').value;
    const email = document.getElementById('edit-email').value;

    const res = await API.request('/api/users/profile/', 'PUT', { username, email }, true);

    if (res.ok) {
        localStorage.setItem('username', username); // Sync local storage
        UI.showStatus('status-message', "IDENTITY RECORDS UPDATED", "success");
        await fetchProfile(); // Refresh sidebar
    } else {
        UI.showStatus('status-message', "UPDATE FAILED: " + JSON.stringify(res.data), "error");
    }

    btn.textContent = originalText;
    btn.disabled = false;
    setTimeout(() => UI.hideStatus('status-message'), 3000);
};

window.handleSecurityUpdate = async (e) => {
    e.preventDefault();
    const password = document.getElementById('edit-password').value;
    if (!password) {
        UI.showStatus('status-message', "PASSPHRASE CANNOT BE EMPTY", "error");
        return;
    }

    const btn = e.submitter;
    btn.textContent = "ENCRYPTING...";
    btn.disabled = true;

    const res = await API.request('/api/users/profile/', 'PUT', { password }, true);

    if (res.ok) {
        UI.showStatus('status-message', "SECURITY CREDENTIALS ROTATED", "success");
        document.getElementById('edit-password').value = ""; // Clear field
    } else {
        UI.showStatus('status-message', "SECURITY UPDATE FAILED", "error");
    }

    btn.textContent = "CHANGE PASSPHRASE";
    btn.disabled = false;
    setTimeout(() => UI.hideStatus('status-message'), 3000);
};

window.handleLogout = () => API.logout();

// --- DATA LISTS ---
async function fetchFriends() {
    const res = await API.request('/api/users/friends/', 'GET', null, true);
    if (res.ok) {
        const container = document.getElementById('friends-grid');
        if (res.data.length === 0) {
            container.innerHTML = '<div style="padding:15px; opacity:0.6; grid-column: 1/-1; text-align:center;">NO ALLIES DETECTED IN NETWORK</div>';
            return;
        }
        container.innerHTML = res.data.map(f => `
            <div class="friend-card">
                <div class="avatar-circle" style="margin: 0 auto 10px auto; background:black; color:white;">
                    ${f.friend.username.charAt(0).toUpperCase()}
                </div>
                <div style="font-weight:900; font-size:1.1rem;">${f.friend.username}</div>
                <div style="font-size:0.8rem; opacity:0.7;">CONNECTED</div>
            </div>
        `).join('');
    }
}

function renderHistory() {
    const container = document.getElementById('history-list');
    const history = JSON.parse(localStorage.getItem('room_history') || '[]');

    if (history.length === 0) {
        container.innerHTML = '<div style="padding:15px; opacity:0.6; font-style:italic;">Log banks empty.</div>';
        return;
    }

    container.innerHTML = history.map(item => `
        <div class="list-item" onclick="window.location.href='home.html?room=${item.id}'" style="display:flex; justify-content:space-between;">
            <span>
                <span style="color:var(--main-accent);">#</span> ${item.topic.toUpperCase()} / 
                <strong>${item.name}</strong>
            </span>
            <span style="font-family:monospace; font-size:0.8rem;">
                ${new Date(item.time).toLocaleDateString()}
            </span>
        </div>
    `).join('');
}

init();