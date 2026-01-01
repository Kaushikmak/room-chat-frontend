// CONFIGURATION
const API_BASE = "https://room-chat-api-eudf.onrender.com/api"; // Your Render Backend URL
const CLIENT_ID_GOOGLE = "330254000032-a44jgat9dsffraenoa0fuucqa5tv6lo7.apps.googleusercontent.com";
const CLIENT_ID_GITHUB = "Ov23libTC9bolbUzZeBA";

// Detect if we are local or production
const IS_LOCAL = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost";
const REDIRECT_URI = IS_LOCAL ? "http://127.0.0.1:5500/login.html" : "https://www.room-chat.com/login";

// --- OAuth Functions ---

function loginWithGoogle() {
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID_GOOGLE}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=email profile`;
    window.location.href = url;
}

function loginWithGithub() {
    const url = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID_GITHUB}&redirect_uri=${REDIRECT_URI}&scope=user:email read:user`;
    window.location.href = url;
}

async function handleCallback() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    
    // Determine provider based on referer or just try both endpoints (simplification)
    // Actually, distinct buttons usually set a state, but we'll infer or assume the user just clicked one.
    // For simplicity, we check which provider sent us. Google usually has long codes, GitHub short.
    // Better approach: Check session storage if you set it before redirect, 
    // OR just try GitHub first, if fail try Google (Lazy approach).

    if (code) {
        document.getElementById('login-status').innerText = "Exchanging code for token...";
        
        // Attempt GitHub Login first
        let success = await performSocialLogin("github", code);
        if(!success) {
            // Attempt Google Login
            success = await performSocialLogin("google", code);
        }

        if(success) {
            window.location.href = "index.html";
        } else {
            document.getElementById('login-status').innerText = "Login Failed. Try again.";
        }
    }
}

async function performSocialLogin(provider, code) {
    try {
        const response = await fetch(`${API_BASE}/auth/${provider}/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            // IT sends the exact URI used during the redirect to ensure a match
            body: JSON.stringify({ 
                code: code,
                callback_url: REDIRECT_URI 
            }) 
        });
        
        const data = await response.json();
        if (data.key) { // dj-rest-auth returns 'key' as token
            localStorage.setItem("token", data.key);
            localStorage.setItem("username", data.username || "User"); // Assuming backend sends username, else fetch profile
            return true;
        }
        console.error(`${provider} Login Error:`, data);
        return false;
    } catch (error) {
        console.error(error);
        return false;
    }
}

function logout() {
    localStorage.removeItem("token");
    window.location.href = "login.html";
}

// Check if user is logged in
function requireAuth() {
    if (!localStorage.getItem("token")) {
        window.location.href = "login.html";
    }
}