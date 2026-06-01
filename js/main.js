(function () {
    const themeToggle = document.getElementById('themeToggle');
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.querySelector('.nav-links');

    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    if (themeToggle) {
        themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', function () {
            const current = document.documentElement.getAttribute('data-theme');
            const next = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('theme', next);
            themeToggle.textContent = next === 'dark' ? '☀️' : '🌙';
        });
    }

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', function () {
            navLinks.classList.toggle('show');
        });

        document.addEventListener('click', function (e) {
            if (!menuToggle.contains(e.target) && !navLinks.contains(e.target)) {
                navLinks.classList.remove('show');
            }
        });
    }

    function getEntries() {
        try {
            return JSON.parse(localStorage.getItem('journalEntries')) || [];
        } catch {
            return [];
        }
    }

    function saveEntries(entries) {
        localStorage.setItem('journalEntries', JSON.stringify(entries));
    }

    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    function showToast(message) {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(function () {
            toast.classList.remove('show');
        }, 2500);
    }

    const statEntries = document.getElementById('statEntries');
    const statCategories = document.getElementById('statCategories');
    const statWords = document.getElementById('statWords');
    const statDays = document.getElementById('statDays');

    if (statEntries) {
        const entries = getEntries();
        statEntries.textContent = entries.length;

        const cats = new Set(entries.map(function (e) { return e.category; }));
        statCategories.textContent = cats.size;

        const words = entries.reduce(function (sum, e) {
            return sum + (e.content ? e.content.replace(/\s/g, '').length : 0);
        }, 0);
        statWords.textContent = words;

        const siteStart = localStorage.getItem('siteStart') || Date.now().toString();
        if (!localStorage.getItem('siteStart')) {
            localStorage.setItem('siteStart', siteStart);
        }
        const days = Math.floor((Date.now() - parseInt(siteStart)) / (1000 * 60 * 60 * 24)) + 1;
        statDays.textContent = days;
    }

    window.app = {
        getEntries: getEntries,
        saveEntries: saveEntries,
        generateId: generateId,
        showToast: showToast
    };
})();
