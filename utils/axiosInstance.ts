import axios from 'axios';

// 1. Define your Backend URL
const BASE_URL = 'https://room-chat-api-eudf.onrender.com/api';

// 2. Create the instance
const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 3. Add an Interceptor
// This runs BEFORE every request to attach the token if it exists.
api.interceptors.request.use((config) => {
    // We check for the token in localStorage
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('auth_token');
        if (token) {
            config.headers.Authorization = `Token ${token}`;
        }
    }
    return config;
});

export default api;