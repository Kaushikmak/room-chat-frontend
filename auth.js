// auth.js
const API_BASE = "https://room-chat-api-eudf.onrender.com/api";

// 1. Guard: Redirect to home if already logged in
if (localStorage.getItem('token') && window.location.pathname.includes('index.html')) {
    window.location.href = 'home.html';
}

// 2. Standard Login
document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        username: document.getElementById('login-username').value,
        password: document.getElementById('login-password').value
    };
    await handleAuthRequest(`${API_BASE}/users/login/`, data);
});

// 3. Registration with Validation
document.getElementById('register-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = document.getElementById('reg-password').value;
    const confirm = document.getElementById('reg-confirm').value;

    if (password !== confirm) {
        showError("Passwords do not match");
        return;
    }

    const data = {
        username: document.getElementById('reg-username').value,
        email: document.getElementById('reg-email').value,
        password: password
    };
    await handleAuthRequest(`${API_BASE}/users/register/`, data);
});

// 4. Google Social Login Callback
async function handleGoogleSignIn(response) {
    // response.credential is the JWT from Google
    await handleAuthRequest(`${API_BASE}/auth/google/`, { access_token: response.credential });
}

// 5. GitHub Redirect
function startGitHubLogin() {
    const clientID = "Ov23libTC9bolbUzZeBA";
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientID}&scope=user:email`;
}

// Generic Helper for API Calls
async function handleAuthRequest(url, payload) {
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await res.json();

        if (res.ok) {
            localStorage.setItem('token', result.token || result.key);
            window.location.href = 'home.html';
        } else {
            showError(result.detail || JSON.stringify(result));
        }
    } catch (err) {
        showError("Network error. Please check your connection.");
    }
}

function showError(msg) {
    document.getElementById('error-message').innerText = msg;
}