export const UI = {
    showStatus(elementId, message, type = 'success') {
        const el = document.getElementById(elementId);
        if (!el) return;
        el.textContent = message;
        el.className = `neo-box status-box ${type}`; // Using neo-box class for consistency
        el.classList.remove('hidden');
    },

    hideStatus(elementId) {
        const el = document.getElementById(elementId);
        if (el) el.classList.add('hidden');
    }
};