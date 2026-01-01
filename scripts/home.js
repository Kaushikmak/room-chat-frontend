import { API } from '../assets/js/api.js';

// Theme Persistence
window.toggleTheme = () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
};

// Apply saved theme on load
if (localStorage.getItem('theme') === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
}

async function init() {
    if (!API.isAuthenticated()) window.location.href = 'login.html';
    setAvatar();
    await Promise.all([fetchTopics(), fetchRooms(), fetchFriends(), fetchActivity()]);
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
            <div class="neo-box" style="padding:10px; margin-bottom:10px; background:rgba(255,255,255,0.8)">
                <span class="mention-tag">@${m.user.username}</span>: ${m.body}
            </div>
        `).join('');
        container.scrollTop = container.scrollHeight;
    }
}

// Global UI Setup
function setAvatar() {
    const username = localStorage.getItem('username') || "U";
    document.getElementById('user-avatar').textContent = username.charAt(0).toUpperCase();
}

window.showTab = (type) => {
    document.getElementById('rooms-nav-content').classList.toggle('hidden', type !== 'rooms');
    document.getElementById('dms-nav-content').classList.toggle('hidden', type !== 'dms');
};

init();