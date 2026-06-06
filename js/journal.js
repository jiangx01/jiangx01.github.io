(function () {
    const entriesGrid = document.getElementById('entriesGrid');
    const emptyState = document.getElementById('emptyState');
    const newEntryBtn = document.getElementById('newEntryBtn');
    const modalOverlay = document.getElementById('modalOverlay');
    const modalClose = document.getElementById('modalClose');
    const modalCancel = document.getElementById('modalCancel');
    const modalSave = document.getElementById('modalSave');
    const modalTitle = document.getElementById('modalTitle');
    const entryForm = document.getElementById('entryForm');
    const entryTitle = document.getElementById('entryTitle');
    const entryCategory = document.getElementById('entryCategory');
    const entryContent = document.getElementById('entryContent');
    const entryTags = document.getElementById('entryTags');
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const sortFilter = document.getElementById('sortFilter');

    const loginOverlay = document.getElementById('loginOverlay');
    const loginPassword = document.getElementById('loginPassword');
    const loginConfirm = document.getElementById('loginConfirm');
    const loginCancel = document.getElementById('loginCancel');
    const loginClose = document.getElementById('loginClose');
    const loginForm = document.getElementById('loginForm');
    const loginBtn = document.getElementById('loginBtn');

    const detailOverlay = document.getElementById('detailOverlay');
    const detailClose = document.getElementById('detailClose');
    const detailTitle = document.getElementById('detailTitle');
    const detailCategory = document.getElementById('detailCategory');
    const detailDate = document.getElementById('detailDate');
    const detailTags = document.getElementById('detailTags');
    const detailContent = document.getElementById('detailContent');

    const uploadImageBtn = document.getElementById('uploadImageBtn');
    const imageInput = document.getElementById('imageInput');

    let editingId = null;

    function updateLoginUI() {
        if (!loginBtn) return;
        if (app.isLoggedIn()) {
            loginBtn.textContent = '🔓 退出';
        } else {
            loginBtn.textContent = '🔑 登录';
        }
    }

    function showLoginModal() {
        loginOverlay.classList.add('show');
        loginPassword.value = '';
        loginPassword.focus();
    }

    function closeLoginModal() {
        loginOverlay.classList.remove('show');
        loginPassword.value = '';
    }

    async function handleLogin() {
        var password = loginPassword.value.trim();
        if (!password) {
            app.showToast('请输入密码');
            return;
        }
        var ok = await app.login(password);
        if (ok) {
            closeLoginModal();
            updateLoginUI();
            app.showToast('登录成功');
        } else {
            app.showToast('密码错误');
            loginPassword.value = '';
            loginPassword.focus();
        }
    }

    function handleLogout() {
        app.logout();
        updateLoginUI();
        renderEntries();
        app.showToast('已退出');
    }

    function handleLoginToggle() {
        if (app.isLoggedIn()) {
            handleLogout();
        } else {
            showLoginModal();
        }
    }

    async function requireAuth(callback) {
        if (app.isLoggedIn()) {
            await callback();
        } else {
            showLoginModal();
        }
    }

    function openDetail(entry) {
        detailTitle.textContent = entry.title;
        detailCategory.textContent = entry.category || '未分类';
        var date = new Date(entry.createdAt);
        detailDate.textContent = date.getFullYear() + '-' +
            String(date.getMonth() + 1).padStart(2, '0') + '-' +
            String(date.getDate()).padStart(2, '0') + ' ' +
            String(date.getHours()).padStart(2, '0') + ':' +
            String(date.getMinutes()).padStart(2, '0');
        if (entry.tags && entry.tags.length) {
            detailTags.innerHTML = entry.tags.map(function (t) {
                return '<span class="entry-tag">#' + t + '</span>';
            }).join('');
            detailTags.style.display = '';
        } else {
            detailTags.style.display = 'none';
        }
        detailContent.innerHTML = entry.content;
        detailOverlay.classList.add('show');
    }

    function closeDetail() {
        detailOverlay.classList.remove('show');
    }

    async function renderEntries() {
        const entries = await app.getEntries();
        const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';
        const catFilter = categoryFilter ? categoryFilter.value : 'all';
        const sort = sortFilter ? sortFilter.value : 'newest';
        const loggedIn = app.isLoggedIn();

        let filtered = entries.filter(function (e) {
            const matchSearch = !searchTerm ||
                e.title.toLowerCase().includes(searchTerm) ||
                e.content.toLowerCase().includes(searchTerm) ||
                (e.tags || []).some(function (t) { return t.toLowerCase().includes(searchTerm); });
            const matchCat = catFilter === 'all' || e.category === catFilter;
            return matchSearch && matchCat;
        });

        filtered.sort(function (a, b) {
            return sort === 'newest' ? b.createdAt - a.createdAt : a.createdAt - b.createdAt;
        });

        entriesGrid.innerHTML = '';

        if (filtered.length === 0 && entries.length === 0) {
            emptyState.style.display = 'block';
            entriesGrid.appendChild(emptyState);
            return;
        }

        if (filtered.length === 0) {
            entriesGrid.innerHTML = '<div class="empty-state"><div class="empty-icon">🔍</div><h3>没有找到匹配的记录</h3><p>试试其他搜索词或分类</p></div>';
            return;
        }

        emptyState.style.display = 'none';

        filtered.forEach(function (entry) {
            const card = document.createElement('div');
            card.className = 'entry-card';
            card.style.cursor = 'pointer';

            const date = new Date(entry.createdAt);
            const dateStr = date.getFullYear() + '-' +
                String(date.getMonth() + 1).padStart(2, '0') + '-' +
                String(date.getDate()).padStart(2, '0') + ' ' +
                String(date.getHours()).padStart(2, '0') + ':' +
                String(date.getMinutes()).padStart(2, '0');

            const tagsHtml = (entry.tags || []).map(function (t) {
                return '<span class="entry-tag">#' + t + '</span>';
            }).join('');

            const preview = entry.content.replace(/<[^>]*>/g, '').substring(0, 150);

            var actionsHtml = '';
            if (loggedIn) {
                actionsHtml = '<div class="entry-actions">' +
                    '<button class="btn btn-secondary btn-sm edit-btn" data-id="' + entry.id + '">编辑</button>' +
                    '<button class="btn btn-danger btn-sm delete-btn" data-id="' + entry.id + '">删除</button>' +
                '</div>';
            }

            card.innerHTML =
                '<div class="entry-meta">' +
                    '<span class="entry-category">' + (entry.category || '未分类') + '</span>' +
                    '<span class="entry-date">' + dateStr + '</span>' +
                '</div>' +
                '<h3 class="entry-title">' + escapeHtml(entry.title) + '</h3>' +
                '<div class="entry-content">' + escapeHtml(preview) + '</div>' +
                (tagsHtml ? '<div class="entry-tags">' + tagsHtml + '</div>' : '') +
                actionsHtml;

            card.addEventListener('click', function (e) {
                if (e.target.closest('.btn')) return;
                openDetail(entry);
            });

            entriesGrid.appendChild(card);
        });

        document.querySelectorAll('.edit-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                openEditor(this.dataset.id);
            });
        });

        document.querySelectorAll('.delete-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                deleteEntry(this.dataset.id);
            });
        });
    }

    function escapeHtml(text) {
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(text));
        return div.innerHTML;
    }

    async function openEditor(id) {
        editingId = id || null;
        modalTitle.textContent = id ? '编辑记录' : '写新记录';
        entryForm.reset();

        if (id) {
            var entries = await app.getEntries();
            var entry = entries.find(function (e) { return e.id === id; });
            if (entry) {
                entryTitle.value = entry.title;
                entryCategory.value = entry.category;
                entryContent.value = entry.content;
                entryTags.value = (entry.tags || []).join(', ');
            }
        }

        modalOverlay.classList.add('show');
        entryTitle.focus();
    }

    function closeEditor() {
        modalOverlay.classList.remove('show');
        editingId = null;
        entryForm.reset();
    }

    async function saveEntry() {
        var title = entryTitle.value.trim();
        var category = entryCategory.value;
        var content = entryContent.value.trim();
        var tagsStr = entryTags.value.trim();

        if (!title) {
            app.showToast('请输入标题');
            entryTitle.focus();
            return;
        }
        if (!content) {
            app.showToast('请输入内容');
            entryContent.focus();
            return;
        }

        var tags = tagsStr ? tagsStr.split(',').map(function (t) { return t.trim(); }).filter(Boolean) : [];

        if (editingId) {
            var ok = await app.updateEntry(editingId, {
                title: title,
                category: category,
                content: content,
                tags: tags,
                updatedAt: Date.now()
            });
            if (ok) {
                app.showToast('已更新');
                closeEditor();
                await renderEntries();
            }
        } else {
            var entry = {
                id: app.generateId(),
                title: title,
                category: category,
                content: content,
                tags: tags,
                createdAt: Date.now(),
                updatedAt: Date.now()
            };
            var ok = await app.addEntry(entry);
            if (ok) {
                app.showToast('已保存');
                closeEditor();
                await renderEntries();
            }
        }
    }

    async function deleteEntry(id) {
        if (!confirm('确定要删除这条记录吗？')) return;
        var ok = await app.deleteEntry(id);
        if (ok) {
            await renderEntries();
            app.showToast('已删除');
        }
    }

    async function handleImageUpload() {
        var file = imageInput.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            app.showToast('请选择图片文件');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            app.showToast('图片不能超过 5MB');
            return;
        }
        var url = await app.uploadImage(file);
        if (url) {
            var imgTag = '\n<img src="' + url + '" alt="image" style="max-width:100%">\n';
            var textarea = entryContent;
            var start = textarea.selectionStart;
            var end = textarea.selectionEnd;
            textarea.value = textarea.value.substring(0, start) + imgTag + textarea.value.substring(end);
            textarea.focus();
            textarea.selectionStart = textarea.selectionEnd = start + imgTag.length;
            app.showToast('图片已插入');
        }
        imageInput.value = '';
    }

    if (newEntryBtn) {
        newEntryBtn.addEventListener('click', function () {
            requireAuth(async function () {
                openEditor(null);
            });
        });
    }
    if (modalClose) modalClose.addEventListener('click', closeEditor);
    if (modalCancel) modalCancel.addEventListener('click', closeEditor);
    if (modalSave) modalSave.addEventListener('click', saveEntry);

    modalOverlay.addEventListener('click', function (e) {
        if (e.target === modalOverlay) closeEditor();
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeEditor();
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && modalOverlay.classList.contains('show')) {
            e.preventDefault();
            saveEntry();
        }
    });

    if (searchInput) {
        searchInput.addEventListener('input', renderEntries);
    }
    if (categoryFilter) {
        categoryFilter.addEventListener('change', renderEntries);
    }
    if (sortFilter) {
        sortFilter.addEventListener('change', renderEntries);
    }

    if (loginBtn) loginBtn.addEventListener('click', handleLoginToggle);
    if (loginConfirm) loginConfirm.addEventListener('click', handleLogin);
    if (loginCancel) loginCancel.addEventListener('click', closeLoginModal);
    if (loginClose) loginClose.addEventListener('click', closeLoginModal);

    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();
            handleLogin();
        });
    }

    loginOverlay.addEventListener('click', function (e) {
        if (e.target === loginOverlay) closeLoginModal();
    });

    if (detailClose) detailClose.addEventListener('click', closeDetail);
    detailOverlay.addEventListener('click', function (e) {
        if (e.target === detailOverlay) closeDetail();
    });

    if (uploadImageBtn && imageInput) {
        uploadImageBtn.addEventListener('click', function () {
            imageInput.click();
        });
        imageInput.addEventListener('change', handleImageUpload);
    }

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeLoginModal();
        if (e.key === 'Enter' && loginOverlay.classList.contains('show')) {
            e.preventDefault();
            handleLogin();
        }
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeDetail();
    });

    var params = new URLSearchParams(window.location.search);
    var catParam = params.get('category');
    if (catParam && categoryFilter) {
        categoryFilter.value = catParam;
    }

    updateLoginUI();
    renderEntries();
})();
