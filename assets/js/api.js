import { CONFIG } from './config.js';

export const API = {
    // Generic Fetch Wrapper
    async request(endpoint, method = 'GET', body = null, auth = false) {
        const headers = { 'Content-Type': 'application/json' };
        
        if (auth) {
            const token = localStorage.getItem('token');
            if (token) headers['Authorization'] = `Token ${token}`;
        }

        const config = { method, headers };
        if (body) config.body = JSON.stringify(body);

        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, config);
            
            // --- DEBUG CHANGE START ---
            const text = await response.text(); // Get raw text first
            try {
                const data = JSON.parse(text); // Try to parse as JSON
                return { ok: response.ok, status: response.status, data };
            } catch (e) {
                console.error("SERVER CRASHED. RAW RESPONSE:", text); // Print the HTML to console
                return { ok: false, status: 500, data: { detail: "Server Error (Check Console)" } };
            }
            // --- DEBUG CHANGE END ---

        } catch (error) {
            console.error("API Error:", error);
            return { ok: false, status: 500, data: { detail: "Server Unreachable" } };
        }
    },

    // Auth Helpers
    isAuthenticated() {
        return !!localStorage.getItem('token');
    },

    logout() {
        localStorage.clear();
        window.location.href = '../pages/login.html';
    }
};