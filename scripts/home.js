import { API } from '../assets/js/api.js';

window.toggleTheme = () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    updateThemeIcon(next);
};

function updateThemeIcon(theme) {
    const icon = document.getElementById('theme-icon');
    if (icon) icon.textContent = theme === 'dark' ? '🌙' : '☀️';
}

// Format @mentions
const formatBody = (text) => text.replace(/@(\w+)/g, '<span class="mention-tag">@$1</span>');

async function init() {
    if (!API.isAuthenticated()) window.location.href = 'login.html';
    setAvatar();
    
    // Set initial theme icon
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    await Promise.all([fetchTopics(), fetchRooms(), fetchFriends(), fetchActivity()]);
}

async function fetchTopics() {
    const res = await API.request('/api/topics/');
    if (res.ok) {
        document.getElementById('topics-list').innerHTML = res.data.map(t => `
            <div class="list-item"># ${t.name.toUpperCase()}</div>
        `).join('');
    }
}

async function fetchRooms() {
    const res = await API.request('/api/rooms/');
    if (res.ok) {
        // Show non-DMs in the Public tab
        const rooms = res.data.filter(r => !r.is_direct_message);
        document.getElementById('rooms-list').innerHTML = rooms.map(r => `
            <div class="list-item" onclick="window.loadRoom('${r.id}')">
                <strong>${r.name}</strong><br><small>HOST: ${r.host.username}</small>
            </div>
        `).join('');

        // Show DMs in the Direct tab
        const dms = res.data.filter(r => r.is_direct_message);
        document.getElementById('dm-rooms-list').innerHTML = dms.map(r => `
            <div class="list-item" onclick="window.loadRoom('${r.id}')">
                💬 ${r.name}
            </div>
        `).join('');
    }
}

async function fetchFriends() {
    const res = await API.request('/api/users/friends/', 'GET', null, true);
    if (res.ok) {
        document.getElementById('friends-list').innerHTML = res.data.map(f => `
            <div class="list-item" style="color: var(--secondary-accent); font-weight:bold;">
                @${f.friend.username}
            </div>
        `).join('');
    }
}

async function fetchActivity() {
    const res = await API.request('/api/activity/');
    if (res.ok) {
        document.getElementById('activity-feed').innerHTML = res.data.map(a => `
            <div class="list-item" style="font-size: 0.8rem; border-left: 4px solid var(--secondary-accent);">
                <span class="mention-tag">@${a.user.username}</span> in <em>${a.room}</em><br>${a.body}
            </div>
        `).join('');
    }
}

window.loadRoom = async (id) => {
    const res = await API.request(`/api/rooms/${id}/`);
    if (res.ok) {
        document.getElementById('active-room-name').textContent = res.data.name;
        document.getElementById('chat-form').classList.remove('hidden');
        await fetchMessages(id);
    }
};

async function fetchMessages(id) {
    const res = await API.request(`/api/rooms/${id}/messages/`);
    if (res.ok) {
        const container = document.getElementById('messages-container');
        container.innerHTML = res.data.map(m => `
            <div class="neo-box" style="padding:10px; margin-bottom:10px; background: rgba(128,128,128,0.1);">
                <span class="mention-tag">@${m.user.username}</span>: ${formatBody(m.body)}
            </div>
        `).join('');
        container.scrollTop = container.scrollHeight;
    }
}

function setAvatar() {
    const username = localStorage.getItem('username') || "U";
    document.getElementById('user-avatar').textContent = username.charAt(0).toUpperCase();
}

window.showTab = (type) => {
    document.getElementById('rooms-nav-content').classList.toggle('hidden', type !== 'rooms');
    document.getElementById('dms-nav-content').classList.toggle('hidden', type !== 'dms');
    
    // Update active tab styling
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
};

init();