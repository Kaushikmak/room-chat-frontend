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
            const data = await response.json();
            return { ok: response.ok, status: response.status, data };
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