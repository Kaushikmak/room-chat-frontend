import { API } from '../assets/js/api.js';

let currentRoomId = null;

// UI & Theme
window.toggleTheme = () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    document.getElementById('theme-icon').textContent = next === 'dark' ? '🌙' : '☀️';
};

window.showTab = (type) => {
    document.getElementById('rooms-nav-content').classList.toggle('hidden', type !== 'rooms');
    document.getElementById('dms-nav-content').classList.toggle('hidden', type !== 'dms');
    document.getElementById('btn-rooms').classList.toggle('active', type === 'rooms');
    document.getElementById('btn-dms').classList.toggle('active', type === 'dms');
};

// Data Loading
async function init() {
    if (!API.isAuthenticated()) window.location.href = 'login.html';
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.getElementById('theme-icon').textContent = savedTheme === 'dark' ? '🌙' : '☀️';
    
    setAvatar();
    await Promise.all([fetchTopics(), fetchRooms(), fetchFriends(), fetchActivity()]);
}

async function fetchRooms() {
    const res = await API.request('/api/rooms/');
    if (res.ok) {
        const rooms = res.data.filter(r => !r.is_direct_message);
        const dms = res.data.filter(r => r.is_direct_message);
        
        document.getElementById('rooms-list').innerHTML = rooms.map(r => `
            <div class="list-item" onclick="window.loadRoom('${r.id}')">${r.name}</div>
        `).join('');
        
        document.getElementById('dm-rooms-list').innerHTML = dms.length ? dms.map(r => `
            <div class="list-item" onclick="window.loadRoom('${r.id}')">💬 ${r.name}</div>
        `).join('') : '<p>No DMs.</p>';
    }
}

window.loadRoom = async (id) => {
    currentRoomId = id;
    const res = await API.request(`/api/rooms/${id}/`);
    if (res.ok) {
        document.getElementById('active-room-name').textContent = res.data.name;
        document.getElementById('chat-form').classList.remove('hidden');
        await fetchMessages(id);
        if (window.pollInterval) clearInterval(window.pollInterval);
        window.pollInterval = setInterval(() => fetchMessages(id), 5000);
    }
};

async function fetchMessages(id) {
    const res = await API.request(`/api/rooms/${id}/messages/`);
    const me = localStorage.getItem('username');
    if (res.ok) {
        document.getElementById('messages-container').innerHTML = res.data.map(m => {
            const isMine = m.user.username === me;
            return `
                <div class="message-row ${isMine ? 'mine' : 'theirs'}">
                    <div class="message-bubble ${isMine ? 'mine' : 'theirs'}">
                        <small class="mention-tag">${m.user.username.toUpperCase()}</small><br>${m.body}
                    </div>
                </div>`;
        }).join('');
        const container = document.getElementById('messages-container');
        container.scrollTop = container.scrollHeight;
    }
}

window.sendMessage = async (e) => {
    e.preventDefault();
    const input = document.getElementById('msg-body');
    if (!input.value || !currentRoomId) return;
    const res = await API.request(`/api/rooms/${currentRoomId}/messages/`, 'POST', { body: input.value }, true);
    if (res.ok) { input.value = ''; await fetchMessages(currentRoomId); }
};

function setAvatar() {
    const user = localStorage.getItem('username') || "U";
    document.getElementById('user-avatar').textContent = user.charAt(0).toUpperCase();
}

async function fetchTopics() {
    const res = await API.request('/api/topics/');
    if (res.ok) document.getElementById('topics-list').innerHTML = res.data.map(t => `<div class="list-item"># ${t.name}</div>`).join('');
}

async function fetchFriends() {
    const res = await API.request('/api/users/friends/', 'GET', null, true);
    if (res.ok) document.getElementById('friends-list').innerHTML = res.data.map(f => `<div class="list-item">@${f.friend.username}</div>`).join('');
}

async function fetchActivity() {
    const res = await API.request('/api/activity/');
    if (res.ok) document.getElementById('activity-feed').innerHTML = res.data.map(a => `<div class="list-item">${a.body}</div>`).join('');
}

init();