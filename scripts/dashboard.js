import { API } from '../assets/js/api.js';
import { UI } from '../assets/js/ui.js';

// Auth Guard
if (!API.isAuthenticated()) window.location.href = 'login.html';

// --- CACHE STORE (The "Twitter" Strategy) ---
// We store data here so we don't have to reload it every time we switch tabs.
// --- CACHE STORE (Persistent) ---
// Load from storage on startup
const dashboardCache = {
    profile: JSON.parse(localStorage.getItem('cache_profile')),
    friends: JSON.parse(localStorage.getItem('cache_friends'))
};

async function initializeDashboard() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon();

    // 1. INSTANT LOAD: Show stale data immediately if it exists
    if (dashboardCache.profile) updateProfileUI(dashboardCache.profile);
    if (dashboardCache.friends) renderFriends(dashboardCache.friends);
    renderHistory(); // Already uses localStorage

    // 2. NETWORK REFRESH: Fetch fresh data in background
    await fetchProfile();
    fetchFriends(); // Don't await, let it update when ready
}

async function fetchProfile() {
    // Fetch fresh data
    const res = await API.request('/api/users/profile/', 'GET', null, true);
    if (res.ok) {
        dashboardCache.profile = res.data;
        // SAVE TO DISK
        localStorage.setItem('cache_profile', JSON.stringify(res.data));
        updateProfileUI(res.data);
    }
}

async function fetchFriends() {
    const container = document.getElementById('friends-grid');
    
    // Only show loader if we have absolutely NO data (first time user)
    if (!dashboardCache.friends) {
        if(container) container.innerHTML = getLoaderHtml();
    }

    const res = await API.request('/api/users/friends/', 'GET', null, true);
    if (res.ok) {
        dashboardCache.friends = res.data;
        // SAVE TO DISK
        localStorage.setItem('cache_friends', JSON.stringify(res.data));
        renderFriends(res.data);
    }
}

// --- HELPER: Loader HTML ---
const getLoaderHtml = () => '<div class="loader-container"><span class="neo-spinner"></span></div>';

// --- HELPER: Time Ago ---
function timeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
}

// --- GLOBAL ACTIONS ---

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
    const targetPanel = document.getElementById(`panel-${panelId}`);
    if(targetPanel) targetPanel.classList.add('active');
    
    // Highlight button
    const buttons = document.querySelectorAll('.dash-nav-btn');
    if (panelId === 'settings' && buttons[0]) buttons[0].classList.add('active');
    if (panelId === 'network' && buttons[1]) buttons[1].classList.add('active');
    if (panelId === 'logs' && buttons[2]) buttons[2].classList.add('active');

    // INTELLIGENT LOADING (Only fetch if we haven't already, or refreshing)
    if (panelId === 'network' && !dashboardCache.friends) {
        fetchFriends(); 
    }
    // Note: Settings and Logs are loaded on init, so we usually don't need to refetch on switch
};

window.handleIdentityUpdate = async (e) => {
    e.preventDefault();
    const btn = e.submitter; 
    const originalText = btn.textContent;
    btn.textContent = "PROCESSING...";
    btn.disabled = true;

    const username = document.getElementById('edit-username').value;
    const email = document.getElementById('edit-email').value;

    const res = await API.request('/api/users/profile/', 'PUT', { username, email }, true);

    if (res.ok) {
        localStorage.setItem('username', username);
        dashboardCache.profile = res.data; // Update Cache
        UI.showStatus('status-message', "IDENTITY RECORDS UPDATED", "success");
        updateProfileUI(res.data);
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
        document.getElementById('edit-password').value = ""; 
    } else {
        UI.showStatus('status-message', "SECURITY UPDATE FAILED", "error");
    }

    btn.textContent = "CHANGE PASSPHRASE";
    btn.disabled = false;
    setTimeout(() => UI.hideStatus('status-message'), 3000);
};

window.handleLogout = () => API.logout();

// --- DATA FETCHING ---

async function initializeDashboard() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon();

    // Parallel Fetch for speed
    // We don't await fetchFriends here so the initial page load is faster. 
    // Friends will load when the tab is clicked OR in background.
    await fetchProfile();
    renderHistory(); 
    
    // Background fetch friends so it's ready when user clicks tab
    fetchFriends(); 
}

// Update UI elements separate from fetching
function updateProfileUI(user) {
    const nameEl = document.getElementById('sidebar-username');
    const avatarEl = document.getElementById('avatar-display');
    const loginEl = document.getElementById('last-login-badge');

    if(nameEl) nameEl.textContent = user.username;
    if(avatarEl) avatarEl.textContent = user.username.charAt(0).toUpperCase();
    
    if (user.last_login && loginEl) {
        const date = new Date(user.last_login);
        loginEl.textContent = `LAST LOGIN: ${date.toLocaleDateString()}`;
    }

    const userInput = document.getElementById('edit-username');
    const emailInput = document.getElementById('edit-email');
    if(userInput) userInput.value = user.username;
    if(emailInput) emailInput.value = user.email;
}

async function fetchProfile() {
    // Return cached if exists (Speed!)
    if (dashboardCache.profile) {
        updateProfileUI(dashboardCache.profile);
        return; 
    }

    const res = await API.request('/api/users/profile/', 'GET', null, true);
    if (res.ok) {
        dashboardCache.profile = res.data;
        updateProfileUI(res.data);
    }
}

async function fetchFriends() {
    const container = document.getElementById('friends-grid');
    
    // 1. Instant Load from Cache
    if (dashboardCache.friends) {
        renderFriends(dashboardCache.friends);
    } else {
        // Only show loader if we have NO data
        if(container) container.innerHTML = getLoaderHtml();
    }

    // 2. Fetch in Background (Stale-While-Revalidate)
    const res = await API.request('/api/users/friends/', 'GET', null, true);
    if (res.ok) {
        dashboardCache.friends = res.data;
        renderFriends(res.data);
    } else if (!dashboardCache.friends) {
        // Only show error if we didn't have cached data to show
        if(container) container.innerHTML = '<div style="padding:20px; text-align:center; opacity:0.6;">Network Error.</div>';
    }
}

function renderFriends(friends) {
    const container = document.getElementById('friends-grid');
    if (!container) return;

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
                ${isOnline ? '<span style="color:var(--success-color);">● ONLINE</span>' : timeText}
            </div>
        </div>
        `;
    }).join('');
}

function renderHistory() {
    const container = document.getElementById('history-list');
    if(!container) return;

    // LocalStorage is instant, no need for async/loader
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

// Start
initializeDashboard();