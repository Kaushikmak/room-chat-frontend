import { API } from '../assets/js/api.js';

let currentRoomId = null;
let allRooms = [];
let allTopics = [];
let allFriends = []; 
let expandedTopics = new Set(); 

// --- UI & THEME ---
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

// --- INIT ---
async function init() {
    if (!API.isAuthenticated()) window.location.href = 'login.html';
    await verifyUserIdentity();
    
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.getElementById('theme-icon').textContent = savedTheme === 'dark' ? '🌙' : '☀️';
    
    await Promise.all([fetchTopics(), fetchRooms(), fetchFriends(), fetchActivity()]);
    
    renderPublicList();
    renderDmList();
}

async function verifyUserIdentity() {
    const res = await API.request('/api/users/profile/', 'GET', null, true);
    if (res.ok) {
        localStorage.setItem('username', res.data.username);
        setAvatar();
    }
}

// --- DATA FETCHING ---
async function fetchRooms() {
    const res = await API.request('/api/rooms/');
    if (res.ok) allRooms = res.data;
}

async function fetchTopics() {
    const res = await API.request('/api/topics/');
    if (res.ok) allTopics = res.data;
}

async function fetchFriends() {
    const res = await API.request('/api/users/friends/', 'GET', null, true);
    if (res.ok) {
        allFriends = res.data;
        document.getElementById('friends-list').innerHTML = allFriends.map(f => 
            `<div class="list-item" onclick="window.openDm('${f.friend.username}')">@${f.friend.username}</div>`
        ).join('');
        renderDmList();
    }
}

async function fetchActivity() {
    const res = await API.request('/api/activity/');
    if (res.ok) {
        const container = document.getElementById('activity-feed');
        if (res.data.length === 0) {
            container.innerHTML = '<div style="padding:15px; opacity:0.6;">Silence on the airwaves...</div>';
            return;
        }
        container.innerHTML = res.data.map(a => {
            const date = new Date(a.created);
            const time = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toLowerCase();
            const context = a.topic ? `${a.topic}/${a.room}` : a.room;
            return `
            <div class="activity-item">
                <div>
                    <span class="act-user">@${a.user.username}</span>
                    <span>messaged on</span>
                    <span class="act-context">"${context}"</span>
                    <span class="act-time">${time}</span>
                </div>
                <div class="act-body">"${a.body}"</div>
            </div>`;
        }).join('');
    }
}

// --- RENDER LOGIC ---
window.renderPublicList = (filterText = "") => {
    const container = document.getElementById('public-list-container');
    container.innerHTML = "";
    const cleanFilter = filterText.toLowerCase();
    const myUsername = localStorage.getItem('username');

    // Helper: Room HTML with Neo-Brutalist Actions
    const getRoomHtml = (r) => {
        const isOwner = r.host && r.host.username === myUsername;
        const actions = isOwner ? `
            <span class="room-actions">
                <div class="action-btn btn-edit" onclick="window.openEditRoom('${r.id}', '${r.name}', event)" title="Edit">✎</div>
                <div class="action-btn btn-delete" onclick="window.openDeleteRoom('${r.id}', event)" title="Delete">×</div>
            </span>` : '';

        return `
            <div class="room-item" onclick="window.loadRoom('${r.id}')">
                <span>${r.name}</span>
                ${actions}
            </div>`;
    };

    // Filter Topics
    const visibleTopics = allTopics.filter(t => t.name.toLowerCase().includes(cleanFilter));

    visibleTopics.forEach(topic => {
        const topicRooms = allRooms.filter(r => {
            if (r.is_direct_message) return false;
            if (cleanFilter && !r.name.toLowerCase().includes(cleanFilter) && !topic.name.toLowerCase().includes(cleanFilter)) return false;
            if (typeof r.topic === 'object' && r.topic !== null) return r.topic.id === topic.id;
            return r.topic === topic.id;
        });

        const isExpanded = expandedTopics.has(topic.id) || cleanFilter.length > 0;
        const arrow = isExpanded ? '▼' : '▶';

        const html = `
            <div class="topic-group">
                <div class="topic-header" onclick="window.toggleTopic(${topic.id})">
                    <span># ${topic.name.toUpperCase()}</span>
                    <span>${arrow}</span>
                </div>
                <div class="room-sublist ${isExpanded ? 'expanded' : ''}" id="topic-rooms-${topic.id}">
                    ${topicRooms.length ? topicRooms.map(getRoomHtml).join('') : '<div class="room-item" style="font-style:italic; opacity:0.6;">No channels</div>'}
                </div>
            </div>
        `;
        container.innerHTML += html;
    });

    // Handle "Other" Rooms
    const uncategorized = allRooms.filter(r => !r.is_direct_message && !r.topic);
    if (uncategorized.length > 0) {
        container.innerHTML += `<div class="topic-header">OTHER / GENERAL</div>`;
        uncategorized.forEach(r => {
            container.innerHTML += getRoomHtml(r);
        });
    }
};

// --- NEW ROOM ACTION LOGIC (No Alerts) ---

// Edit Logic
window.openEditRoom = (id, currentName, e) => {
    e.stopPropagation();
    document.getElementById('edit-room-id').value = id;
    document.getElementById('edit-room-name').value = currentName;
    document.getElementById('edit-room-modal').classList.remove('hidden');
};

window.closeEditModal = () => {
    document.getElementById('edit-room-modal').classList.add('hidden');
};

window.submitEditRoom = async () => {
    const id = document.getElementById('edit-room-id').value;
    const newName = document.getElementById('edit-room-name').value;
    
    if (!newName) return;

    const res = await API.request(`/api/rooms/${id}/`, 'PUT', { name: newName }, true);
    if (res.ok) {
        await fetchRooms();
        renderPublicList();
        // Update header if active
        if (currentRoomId == id) {
            document.getElementById('active-room-name').textContent = newName;
        }
        window.closeEditModal();
    } else {
        alert("Update failed.");
    }
};

// Delete Logic
window.openDeleteRoom = (id, e) => {
    e.stopPropagation();
    document.getElementById('delete-room-id').value = id;
    document.getElementById('delete-room-modal').classList.remove('hidden');
};

window.closeDeleteModal = () => {
    document.getElementById('delete-room-modal').classList.add('hidden');
};

window.confirmDeleteRoom = async () => {
    const id = document.getElementById('delete-room-id').value;
    
    const res = await API.request(`/api/rooms/${id}/`, 'DELETE', null, true);
    if (res.ok) {
        await fetchRooms();
        renderPublicList();
        if (currentRoomId == id) {
            document.getElementById('active-room-name').textContent = "READY...";
            document.getElementById('messages-container').innerHTML = '<div style="text-align: center; margin-top: 50px; opacity: 0.5;">SELECT A TERMINAL</div>';
            document.getElementById('chat-form').classList.add('hidden');
            currentRoomId = null;
        }
        window.closeDeleteModal();
    } else {
        alert("Deletion failed.");
    }
};

// --- EXISTING TOGGLES ---
window.toggleTopic = (id) => {
    if (expandedTopics.has(id)) expandedTopics.delete(id);
    else expandedTopics.add(id);
    renderPublicList(document.getElementById('search-input').value);
};

window.handleSearch = (e) => {
    renderPublicList(e.target.value);
};

// --- MODAL & CREATE LOGIC ---
window.openCreateModal = (type) => {
    const modal = document.getElementById('create-modal');
    const title = document.getElementById('modal-title');
    const hiddenType = document.getElementById('create-type');
    const topicGroup = document.getElementById('topic-select-group');
    const select = document.getElementById('create-topic-select');

    modal.classList.remove('hidden');
    hiddenType.value = type;
    document.getElementById('create-name').value = '';

    if (type === 'topic') {
        title.textContent = "CREATE TOPIC";
        topicGroup.classList.add('hidden');
    } else {
        title.textContent = "CREATE ROOM";
        topicGroup.classList.remove('hidden');
        select.innerHTML = `<option value="">-- Other / General --</option>` + 
            allTopics.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
    }
};

window.closeModal = () => {
    document.getElementById('create-modal').classList.add('hidden');
};

window.submitCreate = async (e) => {
    e.preventDefault();
    const type = document.getElementById('create-type').value;
    const name = document.getElementById('create-name').value;
    
    if (type === 'topic') {
        const res = await API.request('/api/topics/', 'POST', { name }, true);
        if (res.ok) {
            await fetchTopics();
            renderPublicList();
            window.closeModal();
        } else {
            const errorMsg = res.data && res.data.detail ? res.data.detail : 'Failed to create topic';
            alert(errorMsg);
        }
    } else {
        let topicId = document.getElementById('create-topic-select').value;
        if (topicId === "") topicId = null;

        const res = await API.request('/api/rooms/', 'POST', { name, topic_id: topicId }, true);
        if (res.ok) {
            await fetchRooms();
            if (topicId) expandedTopics.add(parseInt(topicId));
            renderPublicList();
            window.closeModal();
        } else {
            const errorMsg = res.data && res.data.detail ? res.data.detail : 'Failed to create room';
            alert(errorMsg);
        }
    }
};

// --- DM & FRIENDS LOGIC (Preserved) ---
window.renderDmList = () => {
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
};

window.openDm = async (username) => {
    const res = await API.request('/api/chat/start/', 'POST', { username: username }, true);
    if (res.ok) {
        await window.loadRoom(res.data.id);
        const headerName = document.getElementById('active-room-name');
        if(headerName) headerName.textContent = "@" + username.toUpperCase();
    } else {
        console.error("Failed to open DM", res);
        alert("Could not open transmission line.");
    }
};

// --- CHAT LOGIC ---
window.loadRoom = async (id) => {
    currentRoomId = id;
    const res = await API.request(`/api/rooms/${id}/`);
    if (res.ok) {
        document.getElementById('active-room-name').textContent = res.data.name;
        addToHistory(res.data);
        document.getElementById('chat-form').classList.remove('hidden');
        await fetchMessages(id);
        
        if (window.pollInterval) clearInterval(window.pollInterval);
        window.pollInterval = setInterval(() => fetchMessages(id), 5000);
    }
};

function addToHistory(room) {
    if (room.is_direct_message) return;
    let history = JSON.parse(localStorage.getItem('room_history') || '[]');
    history = history.filter(r => r.id !== room.id);
    history.unshift({ id: room.id, name: room.name, topic: room.topic?.name || 'General', time: new Date() });
    if (history.length > 5) history.pop();
    localStorage.setItem('room_history', JSON.stringify(history));
}

async function fetchMessages(id) {
    const res = await API.request(`/api/rooms/${id}/messages/`);
    const me = localStorage.getItem('username'); 
    if (res.ok) {
        document.getElementById('messages-container').innerHTML = res.data.map(m => {
            const isMine = m.user.username.toLowerCase() === (me ? me.toLowerCase() : '');
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

// ... (Search & Friend Logic kept same) ...
let searchTimeout = null;
window.handleUserSearch = (e) => {
    const query = e.target.value.trim();
    const dropdown = document.getElementById('search-dropdown-container');
    if (searchTimeout) clearTimeout(searchTimeout);
    if (query.length < 2) { dropdown.classList.add('hidden'); return; }
    searchTimeout = setTimeout(async () => {
        const res = await API.request(`/api/users/search/?q=${query}`, 'GET', null, true);
        if (res.ok && res.data.length > 0) {
            dropdown.innerHTML = res.data.map(user => `
                <div class="dropdown-item" onclick="window.selectSearchUser('${user.username}')">
                    <span>${user.username}</span>
                    ${user.username.toLowerCase().includes(query.toLowerCase()) ? '' : '<span class="match-tag">PHONETIC</span>'}
                </div>`).join('');
            dropdown.classList.remove('hidden');
        } else {
            dropdown.innerHTML = `<div style="padding:10px; opacity:0.6; font-style:italic;">No agents found.</div>`;
            dropdown.classList.remove('hidden');
        }
    }, 300);
};
window.selectSearchUser = (username) => {
    document.getElementById('add-friend-input').value = username;
    document.getElementById('search-dropdown-container').classList.add('hidden');
};
document.addEventListener('click', (e) => {
    const container = document.getElementById('search-dropdown-container');
    const input = document.getElementById('add-friend-input');
    if (e.target !== container && e.target !== input) container.classList.add('hidden');
});

// ... (Friend Management) ...
window.openManageFriends = () => { document.getElementById('friends-modal').classList.remove('hidden'); document.getElementById('add-friend-input').value = ''; document.getElementById('filter-friends-input').value = ''; renderManageFriendsList(); };
window.closeFriendsModal = () => { document.getElementById('friends-modal').classList.add('hidden'); };
window.renderManageFriendsList = (filterText = "") => { const container = document.getElementById('manage-friends-list'); const cleanFilter = filterText.toLowerCase(); const filtered = allFriends.filter(f => f.friend.username.toLowerCase().includes(cleanFilter)); if (filtered.length === 0) { container.innerHTML = '<div style="padding:15px; text-align:center; opacity:0.6;">No allies found.</div>'; return; } container.innerHTML = filtered.map(f => `<div class="friend-row"><span style="font-weight:600;">@${f.friend.username}</span><button onclick="window.handleRemoveFriend('${f.friend.username}')">REMOVE</button></div>`).join(''); };
window.filterFriends = (e) => { renderManageFriendsList(e.target.value); };
window.handleAddFriend = async (e) => { e.preventDefault(); const input = document.getElementById('add-friend-input'); const username = input.value.trim(); if (!username) return; const res = await API.request('/api/users/friends/', 'POST', { username }, true); if (res.ok) { if (res.data.status === 'Already friends') { alert("You are already allies."); } else { input.value = ''; await fetchFriends(); renderManageFriendsList(); } } else { alert(res.data.detail || "Failed to add friend. Check spelling."); } };
window.handleRemoveFriend = async (username) => { if (!confirm(`Sever alliance with @${username}?`)) return; const res = await API.request(`/api/users/friends/${username}/`, 'DELETE', null, true); if (res.ok) { await fetchFriends(); renderManageFriendsList(document.getElementById('filter-friends-input').value); } else { alert("Failed to remove friend."); } };

function setAvatar() {
    const user = localStorage.getItem('username') || "U";
    document.getElementById('user-avatar').textContent = user.charAt(0).toUpperCase();
}

init();