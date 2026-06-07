(function () {
    var entriesGrid = document.getElementById('entriesGrid');
    var emptyState = document.getElementById('emptyState');
    var newEntryBtn = document.getElementById('newEntryBtn');
    var modalOverlay = document.getElementById('modalOverlay');
    var modalClose = document.getElementById('modalClose');
    var modalCancel = document.getElementById('modalCancel');
    var modalSave = document.getElementById('modalSave');
    var modalTitle = document.getElementById('modalTitle');
    var entryForm = document.getElementById('entryForm');
    var entryTitle = document.getElementById('entryTitle');
    var entryCategory = document.getElementById('entryCategory');
    var entryContent = document.getElementById('entryContent');
    var entryTags = document.getElementById('entryTags');
    var entryCover = document.getElementById('entryCover');
    var searchInput = document.getElementById('searchInput');
    var categoryFilter = document.getElementById('categoryFilter');
    var sortFilter = document.getElementById('sortFilter');
    var loadMoreBtn = document.getElementById('loadMoreBtn');
    var coverPreview = document.getElementById('coverPreview');
    var coverPreviewImg = document.getElementById('coverPreviewImg');
    var coverRemoveBtn = document.getElementById('coverRemoveBtn');
    var editorPreview = document.getElementById('editorPreview');

    var loginOverlay = document.getElementById('loginOverlay');
    var loginPassword = document.getElementById('loginPassword');
    var loginConfirm = document.getElementById('loginConfirm');
    var loginCancel = document.getElementById('loginCancel');
    var loginClose = document.getElementById('loginClose');
    var loginForm = document.getElementById('loginForm');
    var loginBtn = document.getElementById('loginBtn');

    var detailOverlay = document.getElementById('detailOverlay');
    var detailClose = document.getElementById('detailClose');
    var detailTitle = document.getElementById('detailTitle');
    var detailCategory = document.getElementById('detailCategory');
    var detailDate = document.getElementById('detailDate');
    var detailTags = document.getElementById('detailTags');
    var detailContent = document.getElementById('detailContent');
    var detailReadingTime = document.getElementById('detailReadingTime');
    var detailOpenBtn = document.getElementById('detailOpenBtn');

    var uploadImageBtn = document.getElementById('uploadImageBtn');
    var imageInput = document.getElementById('imageInput');

    var editorTabs = document.querySelectorAll('.editor-tab');

    var editingId = null;
    var allEntries = [];
    var PAGE_SIZE = 9;
    var currentPage = 0;

    function updateLoginUI() {
        if (!loginBtn) return;
        loginBtn.textContent = app.isLoggedIn() ? '🔓 退出' : '🔑 登录';
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
        if (!password) { app.showToast('请输入密码'); return; }
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
        if (app.isLoggedIn()) { handleLogout(); }
        else { showLoginModal(); }
    }

    async function requireAuth(callback) {
        if (app.isLoggedIn()) { await callback(); }
        else { showLoginModal(); }
    }

    function switchEditorTab(tab) {
        editorTabs.forEach(function (t) { t.classList.toggle('active', t.dataset.tab === tab); });
        var writeArea = document.querySelector('.editor-textarea');
        var previewArea = document.querySelector('.editor-preview');
        if (tab === 'write') {
            writeArea.style.display = '';
            previewArea.style.display = 'none';
        } else {
            writeArea.style.display = 'none';
            previewArea.style.display = '';
            previewArea.innerHTML = app.renderMarkdown(entryContent.value);
            if (window.hljs) {
                previewArea.querySelectorAll('pre code').forEach(function (block) {
                    hljs.highlightElement(block);
                });
            }
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

        var contentBody = app.stripCoverImage(entry.content);
        detailReadingTime.textContent = app.calcReadingTime(contentBody);

        if (entry.tags && entry.tags.length) {
            detailTags.innerHTML = entry.tags.map(function (t) {
                return '<span class="entry-tag">#' + t + '</span>';
            }).join('');
            detailTags.style.display = '';
        } else {
            detailTags.style.display = 'none';
        }

        detailContent.innerHTML = app.renderMarkdown(contentBody);
        detailOpenBtn.href = 'post.html?id=' + entry.id;
        detailOverlay.classList.add('show');

        if (window.hljs) {
            detailContent.querySelectorAll('pre code').forEach(function (block) {
                hljs.highlightElement(block);
            });
        }
    }

    function closeDetail() {
        detailOverlay.classList.remove('show');
    }

    function renderEntryCard(entry) {
        var card = document.createElement('div');
        card.className = 'blog-card';
        card.style.cursor = 'pointer';

        var coverImage = app.extractCoverImage(entry.content);
        var contentBody = app.stripCoverImage(entry.content);
        var excerpt = app.createExcerpt(contentBody, 150);
        var date = new Date(entry.createdAt);
        var dateStr = date.getFullYear() + '-' +
            String(date.getMonth() + 1).padStart(2, '0') + '-' +
            String(date.getDate()).padStart(2, '0');
        var readingTime = app.calcReadingTime(contentBody);

        var coverHtml = coverImage
            ? '<div class="blog-card-cover"><img src="' + coverImage + '" alt="" loading="lazy"></div>'
            : '<div class="blog-card-cover blog-card-cover-placeholder"><span>' + (entry.category || '📄').substring(0, 2) + '</span></div>';

        var tagsHtml = (entry.tags || []).map(function (t) {
            return '<span class="entry-tag">#' + t + '</span>';
        }).join('');

        var actionsHtml = '';
        if (app.isLoggedIn()) {
            actionsHtml = '<div class="entry-actions">' +
                '<button class="btn btn-secondary btn-sm edit-btn" data-id="' + entry.id + '">编辑</button>' +
                '<button class="btn btn-danger btn-sm delete-btn" data-id="' + entry.id + '">删除</button>' +
                '</div>';
        }

        card.innerHTML =
            coverHtml +
            '<div class="blog-card-body">' +
                '<div class="blog-card-meta">' +
                    '<span class="entry-category">' + (entry.category || '未分类') + '</span>' +
                    '<span class="blog-card-date">' + dateStr + '</span>' +
                    '<span class="reading-time">' + readingTime + '</span>' +
                '</div>' +
                '<h3 class="blog-card-title">' + app.escapeHtml(entry.title) + '</h3>' +
                '<p class="blog-card-text">' + app.escapeHtml(excerpt) + '</p>' +
                (tagsHtml ? '<div class="blog-card-tags">' + tagsHtml + '</div>' : '') +
                actionsHtml +
            '</div>';

        card.addEventListener('click', function (e) {
            if (e.target.closest('.btn')) return;
            openDetail(entry);
        });

        card.querySelectorAll('.edit-btn').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                openEditor(this.dataset.id);
            });
        });

        card.querySelectorAll('.delete-btn').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                deleteEntryById(this.dataset.id);
            });
        });

        return card;
    }

    async function renderEntries() {
        allEntries = await app.getEntries();
        var searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';
        var catFilter = categoryFilter ? categoryFilter.value : 'all';
        var sort = sortFilter ? sortFilter.value : 'newest';

        var filtered = allEntries.filter(function (e) {
            var matchSearch = !searchTerm ||
                e.title.toLowerCase().includes(searchTerm) ||
                e.content.toLowerCase().includes(searchTerm) ||
                (e.tags || []).some(function (t) { return t.toLowerCase().includes(searchTerm); });
            var matchCat = catFilter === 'all' || e.category === catFilter;
            return matchSearch && matchCat;
        });

        filtered.sort(function (a, b) {
            return sort === 'newest' ? b.createdAt - a.createdAt : a.createdAt - b.createdAt;
        });

        entriesGrid.innerHTML = '';

        if (filtered.length === 0 && allEntries.length === 0) {
            emptyState.style.display = '';
            entriesGrid.appendChild(emptyState);
            if (loadMoreBtn) loadMoreBtn.style.display = 'none';
            return;
        }

        if (filtered.length === 0) {
            entriesGrid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">🔍</div><h3>没有找到匹配的文章</h3><p>试试其他搜索词或分类</p></div>';
            if (loadMoreBtn) loadMoreBtn.style.display = 'none';
            return;
        }

        emptyState.style.display = 'none';
        currentPage = 0;
        renderPage(filtered);
    }

    function renderPage(filtered) {
        var start = currentPage * PAGE_SIZE;
        var end = start + PAGE_SIZE;
        var pageEntries = filtered.slice(start, end);

        pageEntries.forEach(function (entry) {
            entriesGrid.appendChild(renderEntryCard(entry));
        });

        if (loadMoreBtn) {
            if (end >= filtered.length) {
                loadMoreBtn.style.display = 'none';
            } else {
                loadMoreBtn.style.display = '';
                loadMoreBtn.dataset.filtered = JSON.stringify(filtered.map(function (e) { return e.id; }));
            }
        }
    }

    function loadMore() {
        currentPage++;
        var filteredIds = JSON.parse(loadMoreBtn.dataset.filtered || '[]');
        var filtered = allEntries.filter(function (e) { return filteredIds.includes(e.id); });
        var sort = sortFilter ? sortFilter.value : 'newest';
        filtered.sort(function (a, b) {
            return sort === 'newest' ? b.createdAt - a.createdAt : a.createdAt - b.createdAt;
        });
        renderPage(filtered);
    }

    async function openEditor(id) {
        editingId = id || null;
        modalTitle.textContent = id ? '编辑文章' : '写新文章';
        entryForm.reset();
        coverPreview.style.display = 'none';
        entryCover.value = '';

        if (id) {
            var entries = await app.getEntries();
            var entry = entries.find(function (e) { return e.id === id; });
            if (entry) {
                entryTitle.value = entry.title;
                entryCategory.value = entry.category;
                var coverImage = app.extractCoverImage(entry.content);
                var contentBody = app.stripCoverImage(entry.content);
                entryContent.value = contentBody;
                entryTags.value = (entry.tags || []).join(', ');
                if (coverImage) {
                    entryCover.value = coverImage;
                    showCoverPreview(coverImage);
                }
            }
        }

        modalOverlay.classList.add('show');
        entryTitle.focus();
        switchEditorTab('write');
    }

    function closeEditor() {
        modalOverlay.classList.remove('show');
        editingId = null;
        entryForm.reset();
        coverPreview.style.display = 'none';
    }

    function showCoverPreview(url) {
        coverPreviewImg.src = url;
        coverPreview.style.display = 'flex';
    }

    async function saveEntry() {
        var title = entryTitle.value.trim();
        var category = entryCategory.value;
        var content = entryContent.value.trim();
        var tagsStr = entryTags.value.trim();
        var coverUrl = entryCover.value.trim();

        if (!title) { app.showToast('请输入标题'); entryTitle.focus(); return; }
        if (!content) { app.showToast('请输入内容'); entryContent.focus(); return; }

        var tags = tagsStr ? tagsStr.split(',').map(function (t) { return t.trim(); }).filter(Boolean) : [];

        var finalContent = content;
        if (coverUrl) {
            finalContent = '![cover](' + coverUrl + ')\n\n' + content;
        }

        if (editingId) {
            var ok = await app.updateEntry(editingId, {
                title: title,
                category: category,
                content: finalContent,
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
                content: finalContent,
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

    async function deleteEntryById(id) {
        if (!confirm('确定要删除这篇文章吗？')) return;
        var ok = await app.deleteEntry(id);
        if (ok) {
            await renderEntries();
            app.showToast('已删除');
        }
    }

    async function handleImageUpload(forCover) {
        var file = imageInput.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) { app.showToast('请选择图片文件'); return; }
        if (file.size > 20 * 1024 * 1024) { app.showToast('图片不能超过 20MB'); return; }
        var url = await app.uploadImage(file);
        if (url) {
            if (forCover) {
                entryCover.value = url;
                showCoverPreview(url);
                app.showToast('封面已设置');
            } else {
                var textarea = entryContent;
                var start = textarea.selectionStart;
                var end = textarea.selectionEnd;
                var imgTag = '\n![' + (file.name || 'image') + '](' + url + ')\n';
                textarea.value = textarea.value.substring(0, start) + imgTag + textarea.value.substring(end);
                textarea.focus();
                textarea.selectionStart = textarea.selectionEnd = start + imgTag.length;
                app.showToast('图片已插入');
            }
        }
        imageInput.value = '';
    }

    if (newEntryBtn) {
        newEntryBtn.addEventListener('click', function () {
            requireAuth(async function () { openEditor(null); });
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
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && modalOverlay.classList.contains('show')) {
            e.preventDefault();
            saveEntry();
        }
    });

    if (searchInput) searchInput.addEventListener('input', renderEntries);
    if (categoryFilter) categoryFilter.addEventListener('change', renderEntries);
    if (sortFilter) sortFilter.addEventListener('change', renderEntries);

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

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { closeLoginModal(); closeDetail(); }
        if (e.key === 'Enter' && loginOverlay.classList.contains('show')) {
            e.preventDefault();
            handleLogin();
        }
    });

    editorTabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
            switchEditorTab(this.dataset.tab);
        });
    });

    if (uploadImageBtn && imageInput) {
        uploadImageBtn.addEventListener('click', function () {
            imageInput.dataset.mode = 'cover';
            imageInput.click();
        });
        imageInput.addEventListener('change', function () {
            var mode = this.dataset.mode || 'cover';
            handleImageUpload(mode === 'cover');
        });
    }

    if (coverRemoveBtn) {
        coverRemoveBtn.addEventListener('click', function () {
            entryCover.value = '';
            coverPreview.style.display = 'none';
        });
    }

    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', loadMore);
    }

    var params = new URLSearchParams(window.location.search);
    var catParam = params.get('category');
    if (catParam && categoryFilter) {
        categoryFilter.value = catParam;
    }

    updateLoginUI();
    renderEntries();
})();
