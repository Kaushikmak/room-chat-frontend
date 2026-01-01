import { API } from '../assets/js/api.js';
import { UI } from '../assets/js/ui.js';

let currentRoomId = null;

async function init() {
    if (!API.isAuthenticated()) window.location.href = 'login.html';
    setAvatar();
    await Promise.all([fetchTopics(), fetchRooms(), fetchFriends(), fetchActivity()]);
}

function setAvatar() {
    const username = localStorage.getItem('username') || "U";
    document.getElementById('user-avatar').textContent = username.charAt(0).toUpperCase();
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
        document.getElementById('rooms-list').innerHTML = res.data.map(r => `
            <div class="list-item" onclick="window.loadRoom('${r.id}')">
                <strong>${r.name}</strong><br><small>HOST: ${r.host.username}</small>
            </div>
        `).join('');
    }
}

window.loadRoom = async (id) => {
    currentRoomId = id;
    const res = await API.request(`/api/rooms/${id}/`);
    if (res.ok) {
        document.getElementById('active-room-name').textContent = res.data.name;
        document.getElementById('active-room-topic').textContent = res.data.topic?.name || "GENERAL";
        document.getElementById('message-input-area').classList.remove('hidden');
        await fetchMessages(id);
    }
};

async function fetchMessages(roomId) {
    const res = await API.request(`/api/rooms/${roomId}/messages/`);
    if (res.ok) {
        document.getElementById('messages-container').innerHTML = res.data.map(m => `
            <div class="neo-box" style="padding: 10px; margin-bottom: 5px;">
                <strong>${m.user.username}</strong>: ${m.body}
            </div>
        `).join('');
    }
}

window.sendMessage = async (e) => {
    e.preventDefault();
    const input = document.getElementById('msg-body');
    if (!input.value || !currentRoomId) return;
    const res = await API.request(`/api/rooms/${currentRoomId}/messages/`, 'POST', { body: input.value }, true);
    if (res.ok) { input.value = ''; await fetchMessages(currentRoomId); }
};

async function fetchFriends() {
    const res = await API.request('/api/users/friends/', 'GET', null, true);
    if (res.ok) {
        document.getElementById('friends-list').innerHTML = res.data.map(f => `
            <div class="list-item">@${f.friend.username}</div>
        `).join('');
    }
}

async function fetchActivity() {
    const res = await API.request('/api/activity/');
    if (res.ok) {
        document.getElementById('activity-feed').innerHTML = res.data.map(a => `
            <div class="list-item" style="font-size: 0.8rem; border-left: 4px solid var(--secondary-accent);">
                <strong>${a.user.username}</strong> @ ${a.room}:<br>${a.body.substring(0, 40)}...
            </div>
        `).join('');
    }
}

window.filterRooms = () => {
    const query = document.getElementById('room-search').value.toLowerCase();
    document.querySelectorAll('#rooms-list .list-item').forEach(item => {
        item.style.display = item.textContent.toLowerCase().includes(query) ? 'block' : 'none';
    });
};

init();