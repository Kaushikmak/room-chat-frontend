// --- THEME TOGGLE LOGIC ---
const themeBtn = document.getElementById('theme-btn');
const htmlElement = document.documentElement;

const savedTheme = localStorage.getItem('theme') || 'light';
setTheme(savedTheme);

themeBtn.addEventListener('click', () => {
    const currentTheme = htmlElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
});

function setTheme(theme) {
    htmlElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    themeBtn.textContent = theme === 'light' ? '🌙' : '☀️';
}

// --- MOBILE MENU LOGIC ---
const menuBtn = document.getElementById('menu-btn');
const sidebar = document.getElementById('sidebar');
const backdrop = document.getElementById('backdrop');
const navLinks = document.querySelectorAll('#nav-links a');

function toggleMenu() {
    const isActive = sidebar.classList.contains('active');
    if (isActive) {
        sidebar.classList.remove('active');
        backdrop.classList.remove('active');
        menuBtn.textContent = '☰';
    } else {
        sidebar.classList.add('active');
        backdrop.classList.add('active');
        menuBtn.textContent = '✕';
    }
}

menuBtn.addEventListener('click', toggleMenu);
backdrop.addEventListener('click', toggleMenu);

// Close menu when a link is clicked (for mobile)
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            toggleMenu();
        }
    });
});

// --- SCROLL HIGHLIGHT LOGIC ---
const mainContent = document.getElementById('main-content');
const sections = document.querySelectorAll("section");

const observerOptions = {
    root: mainContent,
    rootMargin: "-20% 0px -60% 0px", // Highlight when section is near middle/top
    threshold: 0
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');
            updateActiveLink(id);
        }
    });
}, observerOptions);

sections.forEach(section => observer.observe(section));

function updateActiveLink(id) {
    navLinks.forEach(link => {
        link.classList.remove("active");
        if (link.getAttribute("href") === `#${id}`) {
            link.classList.add("active");
            // Only scroll sidebar if sidebar is not in mobile fixed mode
            if (window.innerWidth > 768) {
                link.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    });
}