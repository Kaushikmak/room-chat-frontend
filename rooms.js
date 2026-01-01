/* CONFIGURATION */
const API_BASE_URL = "https://room-chat-api-eudf.onrender.com";

// 1. AUTH GUARD: Check if user is logged in
const token = localStorage.getItem('token');
if (!token) {
    window.location.href = 'index.html';
}

/* DOM ELEMENTS */
const displayUsername = document.getElementById('display-username');
const displayEmail = document.getElementById('display-email');
const navUsername = document.getElementById('nav-username');

const editUsernameInput = document.getElementById('edit-username');
const editEmailInput = document.getElementById('edit-email');

const viewModeDiv = document.getElementById('profile-view');
const editModeForm = document.getElementById('profile-edit');
const statusBox = document.getElementById('dashboard-status');

/* INITIAL LOAD */
window.onload = function() {
    fetchProfile();
};

/* FETCH PROFILE DATA */
async function fetchProfile() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/users/profile/`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            updateUI(data);
        } else {
            // If 401 Unauthorized, token might be expired
            if (response.status === 401) handleLogout();
            showStatus("FAILED TO LOAD PROFILE DATA", "error");
        }
    } catch (err) {
        console.error(err);
        showStatus("NETWORK ERROR: OFFLINE MODE?", "error");
    }
}

/* UPDATE UI WITH DATA */
function updateUI(user) {
    // Update Display
    displayUsername.textContent = user.username;
    displayEmail.textContent = user.email || "NO EMAIL LINKED";
    navUsername.textContent = user.username.toUpperCase();

    // Pre-fill Edit Form
    editUsernameInput.value = user.username;
    editEmailInput.value = user.email || "";
}

/* TOGGLE EDIT MODE */
function toggleEditMode(showEdit) {
    statusBox.classList.add('hidden'); // Clear messages
    if (showEdit) {
        viewModeDiv.classList.add('hidden');
        editModeForm.classList.remove('hidden');
    } else {
        editModeForm.classList.add('hidden');
        viewModeDiv.classList.remove('hidden');
    }
}

/* HANDLE UPDATE SUBMISSION */
async function handleProfileUpdate(e) {
    e.preventDefault();
    
    const newUsername = editUsernameInput.value;
    const newEmail = editEmailInput.value;

    showStatus("TRANSMITTING UPDATES...", "success");

    try {
        const response = await fetch(`${API_BASE_URL}/api/users/profile/`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${token}`
            },
            body: JSON.stringify({
                username: newUsername,
                email: newEmail
            })
        });

        const data = await response.json();

        if (response.ok) {
            showStatus("IDENTITY REWRITTEN SUCCESSFULLY", "success");
            
            // Update UI with new data
            updateUI(data);
            
            // Update LocalStorage if username changed
            localStorage.setItem('username', data.username);
            
            // Return to view mode after short delay
            setTimeout(() => {
                toggleEditMode(false);
                statusBox.classList.add('hidden');
            }, 1000);
        } else {
            // Handle errors (e.g. username taken)
            let errorMsg = "UPDATE FAILED";
            if (data.username) errorMsg = `USERNAME: ${data.username[0]}`;
            if (data.email) errorMsg = `EMAIL: ${data.email[0]}`;
            
            showStatus(errorMsg, "error");
        }
    } catch (err) {
        console.error(err);
        showStatus("CRITICAL ERROR: SERVER UNREACHABLE", "error");
    }
}

/* HELPERS */
function showStatus(msg, type) {
    statusBox.textContent = msg;
    statusBox.className = `status-box ${type}`;
    statusBox.classList.remove('hidden');
}

function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('username');
    window.location.href = 'index.html';
}