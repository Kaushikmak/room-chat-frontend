/* app.js */
const API_URL = 'https://room-chat-api-eudf.onrender.com/api';

// 1. Check Auth on Load
const token = localStorage.getItem('auth_token');
const username = localStorage.getItem('username');

if (!token) {
    window.location.href = '/login'; // Redirect if not logged in
} else {
    document.getElementById('user-display').textContent = `OPERATOR: ${username}`;
}

// 2. Fetch Rooms
async function fetchRooms() {
    try {
        const response = await fetch(`${API_URL}/rooms/`, {
            headers: { 'Authorization': `Token ${token}` }
        });
        const rooms = await response.json();
        renderRooms(rooms);
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('room-list').innerHTML = '<p>Error loading signals.</p>';
    }
}

// 3. Render Rooms to HTML
function renderRooms(rooms) {
    const container = document.getElementById('room-list');
    container.innerHTML = '';

    if (rooms.length === 0) {
        container.innerHTML = '<p>No active rooms found.</p>';
        return;
    }

    rooms.forEach(room => {
        const card = document.createElement('div');
        card.className = 'card room-card';
        card.innerHTML = `
            <div>
                <div class="room-meta">
                    <span class="host-tag">@${room.host.username || 'USER'}</span>
                    <span>${new Date(room.created).toLocaleDateString()}</span>
                </div>
                <h3 style="font-size: 1.5rem; margin-bottom: 5px;">${room.name}</h3>
                <p style="color: gray; font-weight: bold; font-size: 0.9rem; margin-bottom: 10px;">${room.topic}</p>
                <p style="margin-bottom: 20px;">${room.description || 'No description'}</p>
            </div>
            <a href="room.html?id=${room.id}" class="btn btn-secondary" style="text-align:center;">JOIN TERMINAL</a>
        `;
        container.appendChild(card);
    });
}

// 4. Logout
document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = '/login';
});

// Load rooms on start
fetchRooms();