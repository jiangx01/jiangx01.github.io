(function () {
    var themeToggle = document.getElementById('themeToggle');
    var menuToggle = document.getElementById('menuToggle');
    var navLinks = document.querySelector('.nav-links');

    var savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    if (themeToggle) {
        themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', function () {
            var current = document.documentElement.getAttribute('data-theme');
            var next = current === 'dark' ? 'light' : 'dark';
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

    var SUPABASE_URL = 'https://ueoemgpiucwqwitvkwje.supabase.co';
    var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVlb2VtZ3BpdWN3cXdpdHZrd2plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3NDQ4ODksImV4cCI6MjA5NjMyMDg4OX0.OOATgsjtl1bAy2aLHIurXn3YdnI5OQdzFGQO6xVOORY';
    var PASSWORD_HASH = '4DE5262382BFBF22A8D9E62E6024CDC2D11EC27FEE203EB04A0A4C8143FC84E9';

    var MAX_IMAGE_SIZE = 20 * 1024 * 1024;

    function isLoggedIn() {
        return localStorage.getItem('journal_logged_in') === 'true';
    }

    async function login(password) {
        var msgBuffer = new TextEncoder().encode(password);
        var hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        var hashArray = Array.from(new Uint8Array(hashBuffer));
        var hash = hashArray.map(function (b) { return b.toString(16).padStart(2, '0'); }).join('').toUpperCase();
        if (hash === PASSWORD_HASH) {
            localStorage.setItem('journal_logged_in', 'true');
            return true;
        }
        return false;
    }

    function logout() {
        localStorage.removeItem('journal_logged_in');
    }

    var supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    async function getEntries() {
        var result = await supabaseClient
            .from('entries')
            .select('*')
            .order('createdAt', { ascending: false });
        if (result.error) {
            console.error('Failed to load entries:', result.error);
            return [];
        }
        return result.data || [];
    }

    async function addEntry(entry) {
        var result = await supabaseClient
            .from('entries')
            .insert([entry]);
        if (result.error) {
            console.error('Failed to add entry:', result.error);
            showToast('保存失败');
            return false;
        }
        return true;
    }

    async function updateEntry(id, updates) {
        var result = await supabaseClient
            .from('entries')
            .update(updates)
            .eq('id', id);
        if (result.error) {
            console.error('Failed to update entry:', result.error);
            showToast('更新失败');
            return false;
        }
        return true;
    }

    async function deleteEntry(id) {
        var result = await supabaseClient
            .from('entries')
            .delete()
            .eq('id', id);
        if (result.error) {
            console.error('Failed to delete entry:', result.error);
            showToast('删除失败');
            return false;
        }
        return true;
    }

    var useStorage = false;
    var storageBucket = 'blog-images';

    async function checkStorage() {
        try {
            var result = await supabaseClient.storage.getBucket(storageBucket);
            if (!result.error) {
                useStorage = true;
            }
        } catch (e) {
            useStorage = false;
        }
    }
    checkStorage();

    async function uploadImage(file) {
        if (file.size > MAX_IMAGE_SIZE) {
            showToast('图片不能超过 20MB');
            return null;
        }

        if (useStorage) {
            try {
                var ext = file.name.split('.').pop() || 'png';
                var fileName = Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 8) + '.' + ext;
                var result = await supabaseClient.storage
                    .from(storageBucket)
                    .upload(fileName, file, {
                        cacheControl: '3600',
                        upsert: false
                    });
                if (!result.error) {
                    var urlData = supabaseClient.storage
                        .from(storageBucket)
                        .getPublicUrl(fileName);
                    return urlData.data.publicUrl;
                }
            } catch (e) {
                console.warn('Storage upload failed, falling back to base64', e);
            }
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
        var toast = document.getElementById('toast');
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(function () {
            toast.classList.remove('show');
        }, 2500);
    }

    function escapeHtml(text) {
        if (!text) return '';
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(text));
        return div.innerHTML;
    }

    function renderMarkdown(text) {
        if (!text) return '';
        if (typeof marked !== 'undefined') {
            return marked.parse(text, { breaks: true, gfm: true });
        }
        return '<p>' + escapeHtml(text).replace(/\n/g, '<br>') + '</p>';
    }

    function calcReadingTime(text) {
        if (!text) return '1 分钟';
        var cleanText = text.replace(/!\[.*?\]\(.*?\)/g, '').replace(/[#*`>\-\[\]()]/g, '');
        var wordCount = cleanText.replace(/\s/g, '').length;
        var minutes = Math.max(1, Math.ceil(wordCount / 400));
        return minutes + ' 分钟阅读';
    }

    function extractCoverImage(content) {
        if (!content) return null;
        var match = content.match(/^!\[cover\]\((.*?)\)/);
        if (match) return match[1];
        match = content.match(/!\[.*?\]\((.*?)\)/);
        if (match) return match[1];
        return null;
    }

    function stripCoverImage(content) {
        if (!content) return '';
        return content.replace(/^!\[cover\]\(.*?\)\n*/g, '');
    }

    function createExcerpt(content, maxLen) {
        if (!content) return '';
        maxLen = maxLen || 200;
        var clean = content.replace(/!\[.*?\]\(.*?\)/g, '').replace(/[#*`>\-]/g, '').replace(/\n+/g, ' ');
        clean = clean.substring(0, maxLen);
        if (clean.length >= maxLen) clean += '...';
        return clean;
    }

    var statEntries = document.getElementById('statEntries');
    var statCategories = document.getElementById('statCategories');
    var statWords = document.getElementById('statWords');
    var statDays = document.getElementById('statDays');

    (async function initStats() {
        if (!statEntries) return;
        var entries = await getEntries();
        statEntries.textContent = entries.length;

        var cats = new Set(entries.map(function (e) { return e.category; }));
        if (statCategories) statCategories.textContent = cats.size;

        var words = entries.reduce(function (sum, e) {
            return sum + (e.content ? e.content.replace(/\s/g, '').length : 0);
        }, 0);
        if (statWords) statWords.textContent = words;

        var siteStart = localStorage.getItem('siteStart') || Date.now().toString();
        if (!localStorage.getItem('siteStart')) {
            localStorage.setItem('siteStart', siteStart);
        }
        var days = Math.floor((Date.now() - parseInt(siteStart)) / (1000 * 60 * 60 * 24)) + 1;
        if (statDays) statDays.textContent = days;
    })();

    (async function initLatestPosts() {
        var grid = document.getElementById('latestGrid');
        if (!grid) return;
        var entries = await getEntries();
        var latest = entries.slice(0, 3);

        if (latest.length === 0) {
            grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">📝</div><h3>还没有文章</h3><p><a href="journal.html">开始写第一篇</a></p></div>';
            return;
        }

        grid.innerHTML = '';
        latest.forEach(function (entry) {
            var card = document.createElement('a');
            card.className = 'blog-card';
            card.href = 'post.html?id=' + entry.id;

            var coverImage = extractCoverImage(entry.content);
            var contentBody = stripCoverImage(entry.content);
            var excerpt = createExcerpt(contentBody, 120);
            var date = new Date(entry.createdAt);
            var dateStr = date.getFullYear() + '-' +
                String(date.getMonth() + 1).padStart(2, '0') + '-' +
                String(date.getDate()).padStart(2, '0');
            var readingTime = calcReadingTime(contentBody);

            var coverHtml = coverImage
                ? '<div class="blog-card-cover"><img src="' + coverImage + '" alt="" loading="lazy"></div>'
                : '<div class="blog-card-cover blog-card-cover-placeholder"><span>' + (entry.category || '📄').substring(0, 2) + '</span></div>';

            card.innerHTML =
                coverHtml +
                '<div class="blog-card-body">' +
                    '<div class="blog-card-meta">' +
                        '<span class="entry-category">' + (entry.category || '未分类') + '</span>' +
                        '<span class="blog-card-date">' + dateStr + '</span>' +
                        '<span class="reading-time">' + readingTime + '</span>' +
                    '</div>' +
                    '<h3 class="blog-card-title">' + escapeHtml(entry.title) + '</h3>' +
                    '<p class="blog-card-text">' + escapeHtml(excerpt) + '</p>' +
                '</div>';

            grid.appendChild(card);
        });
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
        uploadImage: uploadImage,
        renderMarkdown: renderMarkdown,
        calcReadingTime: calcReadingTime,
        extractCoverImage: extractCoverImage,
        stripCoverImage: stripCoverImage,
        createExcerpt: createExcerpt,
        escapeHtml: escapeHtml
    };
})();
