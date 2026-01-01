requireAuth();

const username = localStorage.getItem("username");
document.getElementById('display-username').innerText = username;

let currentRoomId = null;
let pollInterval = null;

// --- INITIAL LOAD ---
fetchRooms();
fetchFriends();

// --- ROOMS ---
async function fetchRooms(query = '') {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/rooms/?q=${query}`, {
        headers: { 'Authorization': `Token ${token}` }
    });
    const rooms = await res.json();
    
    const list = document.getElementById('room-list');
    list.innerHTML = '';
    
    rooms.forEach(room => {
        const div = document.createElement('div');
        div.className = `room-item neo-box ${currentRoomId === room.id ? 'active' : ''}`;
        div.innerHTML = `
            <div style="font-weight:bold;">${room.name || 'DM'}</div>
            <small>${room.topic ? room.topic.name : 'No Topic'}</small>
        `;
        div.onclick = () => loadRoom(room);
        list.appendChild(div);
    });
}

// --- CHAT ---
async function loadRoom(room) {
    currentRoomId = room.id;
    document.getElementById('current-room-name').innerText = room.name;
    document.getElementById('current-room-topic').innerText = room.topic ? room.topic.name : 'General';
    document.getElementById('message-form').style.display = 'flex';
    
    // Highlight active room in sidebar
    fetchRooms(); // Refresh list to update active state
    
    // Initial fetch
    await fetchMessages();
    
    // Start Polling (Simple real-time)
    if (pollInterval) clearInterval(pollInterval);
    pollInterval = setInterval(fetchMessages, 3000); // Poll every 3 seconds
}

async function fetchMessages() {
    if (!currentRoomId) return;
    const token = localStorage.getItem('token');
    
    const res = await fetch(`${API_BASE}/rooms/${currentRoomId}/messages/`, {
        headers: { 'Authorization': `Token ${token}` }
    });
    
    if (res.status === 404 || res.status === 403) {
        // User not in room? Join it logic usually goes here or auto-join
        // For now assuming public rooms are readable
        return;
    }

    const messages = await res.json();
    const area = document.getElementById('messages-area');
    area.innerHTML = '';
    
    messages.forEach(msg => {
        const isMine = msg.user.username === username;
        const div = document.createElement('div');
        div.className = `message ${isMine ? 'mine' : ''}`;
        div.innerHTML = `
            <div class="message-meta">
                <span>@${msg.user.username}</span>
                <span>${new Date(msg.created).toLocaleTimeString()}</span>
            </div>
            <div>${msg.body}</div>
        `;
        area.appendChild(div);
    });
    
    // Scroll to bottom
    area.scrollTop = area.scrollHeight;
}

// --- SEND MESSAGE ---
document.getElementById('message-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('message-input');
    const body = input.value;
    if (!body) return;
    
    const token = localStorage.getItem('token');
    await fetch(`${API_BASE}/rooms/${currentRoomId}/messages/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${token}`
        },
        body: JSON.stringify({ body: body })
    });
    
    input.value = '';
    fetchMessages(); // Immediate update
});

// --- CREATE ROOM ---
function showCreateRoomModal() {
    document.getElementById('create-modal').style.display = 'block';
}

async function createRoom() {
    const topic = document.getElementById('new-room-topic').value;
    const name = document.getElementById('new-room-name').value;
    const desc = document.getElementById('new-room-desc').value;
    
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/rooms/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${token}`
        },
        body: JSON.stringify({
            topic_name: topic,
            name: name,
            description: desc
        })
    });
    
    if (res.ok) {
        document.getElementById('create-modal').style.display = 'none';
        fetchRooms();
    } else {
        alert("Failed to create room");
    }
}

// --- SEARCH ---
document.getElementById('search-rooms').addEventListener('input', (e) => {
    fetchRooms(e.target.value);
});

// --- FRIENDS (Basic implementation) ---
async function fetchFriends() {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/users/friends/`, {
        headers: { 'Authorization': `Token ${token}` }
    });
    const friends = await res.json();
    const list = document.getElementById('friends-list');
    
    if (friends.length === 0) {
        list.innerHTML = "<small>No friends added.</small>";
        return;
    }
    
    list.innerHTML = "";
    friends.forEach(f => {
        const div = document.createElement('div');
        div.style.marginBottom = "5px";
        div.innerHTML = `
            <button class="neo-btn" style="padding: 5px; font-size: 0.8rem; width:100%; text-align:left;">
                @${f.friend.username}
            </button>
        `;
        div.onclick = () => startDM(f.friend.username);
        list.appendChild(div);
    });
}

async function startDM(targetUsername) {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/chat/start/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${token}`
        },
        body: JSON.stringify({ username: targetUsername })
    });
    
    const room = await res.json();
    if (room.id) {
        loadRoom(room);
    }
}