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

    const SUPABASE_URL = 'https://ueoemgpiucwqwitvkwje.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVlb2VtZ3BpdWN3cXdpdHZrd2plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3NDQ4ODksImV4cCI6MjA5NjMyMDg4OX0.OOATgsjtl1bAy2aLHIurXn3YdnI5OQdzFGQO6xVOORY';
    const PASSWORD_HASH = '4DE5262382BFBF22A8D9E62E6024CDC2D11EC27FEE203EB04A0A4C8143FC84E9';

    const MAX_IMAGE_SIZE = 20 * 1024 * 1024;

    function isLoggedIn() {
        return localStorage.getItem('journal_logged_in') === 'true';
    }

    async function login(password) {
        const msgBuffer = new TextEncoder().encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hash = hashArray.map(function (b) { return b.toString(16).padStart(2, '0'); }).join('').toUpperCase();
        if (hash === PASSWORD_HASH) {
            localStorage.setItem('journal_logged_in', 'true');
            return true;
        }
        return false;
    }

    function logout() {
        localStorage.removeItem('journal_logged_in');
    }

    const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    async function getEntries() {
        const { data, error } = await supabaseClient
            .from('entries')
            .select('*')
            .order('createdAt', { ascending: false });
        if (error) {
            console.error('Failed to load entries:', error);
            return [];
        }
        return data || [];
    }

    async function addEntry(entry) {
        const { error } = await supabaseClient
            .from('entries')
            .insert([entry]);
        if (error) {
            console.error('Failed to add entry:', error);
            showToast('保存失败');
            return false;
        }
        return true;
    }

    async function updateEntry(id, updates) {
        const { error } = await supabaseClient
            .from('entries')
            .update(updates)
            .eq('id', id);
        if (error) {
            console.error('Failed to update entry:', error);
            showToast('更新失败');
            return false;
        }
        return true;
    }

    async function deleteEntry(id) {
        const { error } = await supabaseClient
            .from('entries')
            .delete()
            .eq('id', id);
        if (error) {
            console.error('Failed to delete entry:', error);
            showToast('删除失败');
            return false;
        }
        return true;
    }

    async function uploadImage(file) {
        if (file.size > MAX_IMAGE_SIZE) {
            showToast('图片不能超过 20MB');
            return null;
        }
        return new Promise(function (resolve) {
            var reader = new FileReader();
            reader.onload = function (e) {
                resolve(e.target.result);
            };
            reader.onerror = function () {
                showToast('图片读取失败');
                resolve(null);
            };
            reader.readAsDataURL(file);
        });
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

    (async function initStats() {
        if (!statEntries) return;
        const entries = await getEntries();
        statEntries.textContent = entries.length;

        const cats = new Set(entries.map(function (e) { return e.category; }));
        if (statCategories) statCategories.textContent = cats.size;

        const words = entries.reduce(function (sum, e) {
            return sum + (e.content ? e.content.replace(/\s/g, '').length : 0);
        }, 0);
        if (statWords) statWords.textContent = words;

        const siteStart = localStorage.getItem('siteStart') || Date.now().toString();
        if (!localStorage.getItem('siteStart')) {
            localStorage.setItem('siteStart', siteStart);
        }
        const days = Math.floor((Date.now() - parseInt(siteStart)) / (1000 * 60 * 60 * 24)) + 1;
        if (statDays) statDays.textContent = days;
    })();

    window.app = {
        getEntries: getEntries,
        addEntry: addEntry,
        updateEntry: updateEntry,
        deleteEntry: deleteEntry,
        generateId: generateId,
        showToast: showToast,
        isLoggedIn: isLoggedIn,
        login: login,
        logout: logout,
        uploadImage: uploadImage
    };
})();
