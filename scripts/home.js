import { API } from '../assets/js/api.js';

let currentRoomId = null;
let allRooms = [];
let allFriends = [];

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
    
    // Set Theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.getElementById('theme-icon').textContent = savedTheme === 'dark' ? '🌙' : '☀️';
    
    setAvatar();
    
    // Fetch all data
    await Promise.all([fetchTopics(), fetchRooms(), fetchFriends(), fetchActivity()]);
    
    // Initial render of Friends in the DM tab
    renderDmList();
}

async function fetchRooms() {
    const res = await API.request('/api/rooms/');
    if (res.ok) {
        allRooms = res.data;
        // Filter public rooms
        const publicRooms = allRooms.filter(r => !r.is_direct_message);
        
        // Render Public Rooms list
        document.getElementById('rooms-list').innerHTML = publicRooms.map(r => `
            <div class="list-item" onclick="window.loadRoom('${r.id}')">
                <div style="display:flex; justify-content:space-between;">
                    <span>${r.name}</span>
                    <span style="font-size:0.8em; opacity:0.6;">OPEN</span>
                </div>
            </div>
        `).join('');
    }
}

async function fetchFriends() {
    const res = await API.request('/api/users/friends/', 'GET', null, true);
    if (res.ok) {
        allFriends = res.data;
        
        // Render Right Sidebar (Data Stream)
        document.getElementById('friends-list').innerHTML = allFriends.map(f => 
            `<div class="list-item" onclick="window.openDm('${f.friend.username}')">@${f.friend.username}</div>`
        ).join('');
    }
}

function renderDmList() {
    // Render Friends in Left Sidebar (DM Tab)
    const container = document.getElementById('dm-rooms-list');
    
    if (allFriends.length === 0) {
        container.innerHTML = '<div style="padding:10px; opacity:0.7;">No friends found.</div>';
        return;
    }
    
    container.innerHTML = allFriends.map(f => {
        const username = f.friend.username;
        return `
        <div class="list-item" onclick="window.openDm('${username}')">
            <div style="display:flex; align-items:center; gap:10px;">
                <div class="avatar-circle" style="width:30px; height:30px; font-size:0.8rem;">
                    ${username.charAt(0).toUpperCase()}
                </div>
                <span>${username}</span>
            </div>
        </div>`;
    }).join('');
}

// Logic to Open Chat when Friend is Clicked
window.openDm = async (username) => {
    // 1. Check if we already have a DM room with this friend
    let targetRoom = allRooms.find(r => r.is_direct_message && r.name === username);
    
    // 2. If not found, create a new DM room
    if (!targetRoom) {
        // Optimistic UI could go here, but let's wait for server
        const res = await API.request('/api/rooms/', 'POST', { 
            name: username, 
            is_direct_message: true 
        }, true);
        
        if (res.ok) {
            targetRoom = res.data;
            allRooms.push(targetRoom); // Update local cache
        } else {
            console.error("Failed to create DM");
            // If creation fails, re-fetch rooms in case it existed but wasn't synced
            await fetchRooms();
            targetRoom = allRooms.find(r => r.is_direct_message && r.name === username);
            if (!targetRoom) return; 
        }
    }
    
    // 3. Load the room
    if (targetRoom) {
        window.loadRoom(targetRoom.id);
        // Ensure DM tab is visible if we clicked from elsewhere
        // window.showTab('dms'); 
    }
};

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

async function fetchActivity() {
    const res = await API.request('/api/activity/');
    if (res.ok) document.getElementById('activity-feed').innerHTML = res.data.map(a => `<div class="list-item">${a.body}</div>`).join('');
}

init();