import { API } from '../assets/js/api.js';

let currentRoomId = null;
let allRooms = [];
let allTopics = [];
let allFriends = []; 
let expandedTopics = new Set(); // Tracks which topics are open

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
    
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.getElementById('theme-icon').textContent = savedTheme === 'dark' ? '🌙' : '☀️';
    
    setAvatar();
    
    // Fetch Data
    await Promise.all([fetchTopics(), fetchRooms(), fetchFriends(), fetchActivity()]);
    
    // Render
    renderPublicList();
    renderDmList();
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
        // Sidebar list
        document.getElementById('friends-list').innerHTML = allFriends.map(f => 
            `<div class="list-item" onclick="window.openDm('${f.friend.username}')">@${f.friend.username}</div>`
        ).join('');
        // Also refresh DM tab list if needed
        renderDmList();
    }
}

async function fetchActivity() {
    const res = await API.request('/api/activity/');
    if (res.ok) document.getElementById('activity-feed').innerHTML = res.data.map(a => `<div class="list-item">${a.body}</div>`).join('');
}

// --- FRIEND MANAGEMENT LOGIC ---

window.openManageFriends = () => {
    document.getElementById('friends-modal').classList.remove('hidden');
    // Clear inputs
    document.getElementById('add-friend-input').value = '';
    document.getElementById('filter-friends-input').value = '';
    // Render full list
    renderManageFriendsList();
};

window.closeFriendsModal = () => {
    document.getElementById('friends-modal').classList.add('hidden');
};

window.renderManageFriendsList = (filterText = "") => {
    const container = document.getElementById('manage-friends-list');
    const cleanFilter = filterText.toLowerCase();

    const filtered = allFriends.filter(f => 
        f.friend.username.toLowerCase().includes(cleanFilter)
    );

    if (filtered.length === 0) {
        container.innerHTML = '<div style="padding:15px; text-align:center; opacity:0.6;">No allies found.</div>';
        return;
    }

    container.innerHTML = filtered.map(f => `
        <div class="friend-row">
            <span style="font-weight:600;">@${f.friend.username}</span>
            <button onclick="window.handleRemoveFriend('${f.friend.username}')">REMOVE</button>
        </div>
    `).join('');
};

window.filterFriends = (e) => {
    renderManageFriendsList(e.target.value);
};

window.handleAddFriend = async (e) => {
    e.preventDefault();
    const input = document.getElementById('add-friend-input');
    const username = input.value.trim();
    if (!username) return;

    const res = await API.request('/api/users/friends/', 'POST', { username }, true);
    if (res.ok) {
        if (res.data.status === 'Already friends') {
             alert("You are already allies.");
        } else {
             input.value = '';
             await fetchFriends(); // Refresh global data & sidebar
             renderManageFriendsList(); // Refresh modal UI
        }
    } else {
        alert(res.data.detail || "Failed to add friend. Check spelling.");
    }
};

window.handleRemoveFriend = async (username) => {
    if (!confirm(`Sever alliance with @${username}?`)) return;

    const res = await API.request(`/api/users/friends/${username}/`, 'DELETE', null, true);
    if (res.ok) {
        await fetchFriends(); // Refresh global data
        // Re-render modal list preserving current filter
        renderManageFriendsList(document.getElementById('filter-friends-input').value); 
    } else {
        alert("Failed to remove friend.");
    }
};


// --- RENDER LOGIC (OPTION A) ---
window.renderPublicList = (filterText = "") => {
    const container = document.getElementById('public-list-container');
    container.innerHTML = "";

    const cleanFilter = filterText.toLowerCase();

    // Filter Topics
    const visibleTopics = allTopics.filter(t => t.name.toLowerCase().includes(cleanFilter));

    visibleTopics.forEach(topic => {
        // Find rooms for this topic
        // Matching Logic: Checks if room.topic.id == topic.id OR room.topic == topic.id
        const topicRooms = allRooms.filter(r => {
            if (r.is_direct_message) return false; // Hide DMs from Public tab
            
            // Search Filter for Rooms
            if (cleanFilter && !r.name.toLowerCase().includes(cleanFilter) && !topic.name.toLowerCase().includes(cleanFilter)) {
                return false; 
            }

            // Relationship Match
            if (typeof r.topic === 'object' && r.topic !== null) return r.topic.id === topic.id;
            return r.topic === topic.id;
        });

        // If filtering, expand all. Otherwise respect user toggle.
        const isExpanded = expandedTopics.has(topic.id) || cleanFilter.length > 0;
        const arrow = isExpanded ? '▼' : '▶';

        const html = `
            <div class="topic-group">
                <div class="topic-header" onclick="window.toggleTopic(${topic.id})">
                    <span># ${topic.name.toUpperCase()}</span>
                    <span>${arrow}</span>
                </div>
                <div class="room-sublist ${isExpanded ? 'expanded' : ''}" id="topic-rooms-${topic.id}">
                    ${topicRooms.length ? topicRooms.map(r => `
                        <div class="room-item" onclick="window.loadRoom('${r.id}')">
                            ${r.name}
                        </div>
                    `).join('') : '<div class="room-item" style="font-style:italic; opacity:0.6;">No channels</div>'}
                </div>
            </div>
        `;
        container.innerHTML += html;
    });

    // Handle "Uncategorized" Rooms (Optional, if any exist without topic)
    const uncategorized = allRooms.filter(r => !r.is_direct_message && !r.topic);
    if (uncategorized.length > 0) {
        container.innerHTML += `<div class="topic-header" style="background: #eee;">OTHER</div>`;
        uncategorized.forEach(r => {
            container.innerHTML += `<div class="room-item" onclick="window.loadRoom('${r.id}')">${r.name}</div>`;
        });
    }
};

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
        // Populate Topic Select
        select.innerHTML = allTopics.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
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
        const topicId = document.getElementById('create-topic-select').value;
        const res = await API.request('/api/rooms/', 'POST', { name, topic_id: topicId }, true);
        if (res.ok) {
            await fetchRooms();
            expandedTopics.add(parseInt(topicId));
            renderPublicList();
            window.closeModal();
        } else {
            const errorMsg = res.data && res.data.detail ? res.data.detail : 'Failed to create room';
            alert(errorMsg);
        }
    }
};

// --- DM & CHAT LOGIC ---
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
    let targetRoom = allRooms.find(r => r.is_direct_message && r.name === username);
    if (!targetRoom) {
        const res = await API.request('/api/rooms/', 'POST', { name: username, is_direct_message: true }, true);
        if (res.ok) {
            targetRoom = res.data;
            allRooms.push(targetRoom);
        } else {
            await fetchRooms();
            targetRoom = allRooms.find(r => r.is_direct_message && r.name === username);
            if (!targetRoom) return; 
        }
    }
    if (targetRoom) window.loadRoom(targetRoom.id);
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

init();