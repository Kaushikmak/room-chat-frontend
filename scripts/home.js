import { API } from '../assets/js/api.js';

let currentRoomId = null;
let activeDMTarget = null;

async function init() {
    if (!API.isAuthenticated()) window.location.href = 'login.html';
    setAvatar();
    await fetchContent();
    setInterval(fetchMessagesSilently, 5000); // Polling for real-time feel
}

async function fetchContent() {
    await Promise.all([fetchTopics(), fetchRooms(), fetchFriends(), fetchActivity()]);
}

window.showTab = (type) => {
    document.getElementById('rooms-nav-content').classList.toggle('hidden', type !== 'rooms');
    document.getElementById('dms-nav-content').classList.toggle('hidden', type !== 'dms');
};

async function fetchRooms() {
    const res = await API.request('/api/rooms/');
    if (res.ok) {
        // Public Rooms
        document.getElementById('rooms-list').innerHTML = res.data
            .filter(r => !r.is_direct_message)
            .map(r => `<div class="list-item" onclick="window.loadRoom('${r.id}')">${r.name}</div>`).join('');
        
        // DM Rooms (Separate Tab)
        document.getElementById('dm-rooms-list').innerHTML = res.data
            .filter(r => r.is_direct_message)
            .map(r => `<div class="list-item" onclick="window.loadRoom('${r.id}')">${r.name}</div>`).join('');
    }
}

// Colored @mentions logic
function formatMessage(body) {
    return body.replace(/@(\w+)/g, '<span class="mention-tag">@$1</span>');
}

window.loadRoom = async (id) => {
    currentRoomId = id;
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
            <div class="neo-box" style="padding:10px; margin-bottom:5px">
                <span class="mention-tag">@${m.user.username}</span>: ${formatMessage(m.body)}
            </div>
        `).join('');
        container.scrollTop = container.scrollHeight;
    }
}

// DM Popup Launcher
window.openDM = async (username) => {
    const res = await API.request('/api/chat/start/', 'POST', { username }, true);
    if (res.ok) {
        activeDMTarget = username;
        document.getElementById('dm-target-name').textContent = `@${username}`;
        document.getElementById('dm-popup').classList.remove('hidden');
        // Fetch logic for popup...
    }
};

window.closeDMPopup = () => document.getElementById('dm-popup').classList.add('hidden');

// Ensure Navbar consistency back to Home
function setAvatar() {
    const username = localStorage.getItem('username') || "U";
    document.getElementById('user-avatar').textContent = username.charAt(0).toUpperCase();
}

init();