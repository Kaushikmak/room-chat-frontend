import { API } from '../assets/js/api.js';
import { UI } from '../assets/js/ui.js';

let currentRoomId = null;

// Initialization
async function init() {
    if (!API.isAuthenticated()) window.location.href = 'login.html';
    
    setAvatar();
    await fetchTopics();
    await fetchRooms();
    await fetchFriends();
}

function setAvatar() {
    const username = localStorage.getItem('username') || "U";
    const avatar = document.getElementById('user-avatar');
    avatar.textContent = username.charAt(0).toUpperCase();
}

async function fetchTopics() {
    const res = await API.request('/api/topics/');
    if (res.ok) {
        const list = document.getElementById('topics-list');
        list.innerHTML = res.data.map(t => `
            <div class="list-item" onclick="filterByTopic('${t.id}')">
                # ${t.name.toUpperCase()}
            </div>
        `).join('');
    }
}

async function fetchRooms() {
    const res = await API.request('/api/rooms/');
    if (res.ok) {
        renderRooms(res.data);
    }
}

function renderRooms(rooms) {
    const list = document.getElementById('rooms-list');
    list.innerHTML = rooms.map(r => `
        <div class="list-item" onclick="loadRoom('${r.id}')">
            <strong>${r.name}</strong>
            <div style="font-size: 0.7rem;">HOST: ${r.host.username}</div>
        </div>
    `).join('');
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
        const container = document.getElementById('messages-container');
        container.innerHTML = res.data.map(m => `
            <div class="neo-box" style="padding: 10px; margin-bottom: 5px;">
                <small style="font-weight: 900;">${m.user.username}</small>
                <p>${m.body}</p>
            </div>
        `).join('');
    }
}

window.sendMessage = async (e) => {
    e.preventDefault();
    const input = document.getElementById('msg-body');
    if (!input.value || !currentRoomId) return;

    const res = await API.request(`/api/rooms/${currentRoomId}/messages/`, 'POST', { body: input.value }, true);
    if (res.ok) {
        input.value = '';
        await fetchMessages(currentRoomId);
    }
};

async function fetchFriends() {
    const res = await API.request('/api/users/friends/', 'GET', null, true);
    if (res.ok) {
        const list = document.getElementById('friends-list');
        list.innerHTML = res.data.map(f => `
            <div class="list-item" style="display:flex; justify-content:space-between; align-items:center;">
                <span>@${f.friend.username}</span>
                <div style="width:10px; height:10px; background:var(--success-color); border-radius:50%; border:1px solid black;"></div>
            </div>
        `).join('');
    }
}

// Global scope attachment for buttons
window.filterByTopic = (topicId) => alert("Filtering by Topic: " + topicId);
window.openCreateRoomModal = () => alert("Room creation modal logic pending backend form integration.");

init();