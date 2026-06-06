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

    let editingId = null;

    async function renderEntries() {
        const entries = await app.getEntries();
        const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';
        const catFilter = categoryFilter ? categoryFilter.value : 'all';
        const sort = sortFilter ? sortFilter.value : 'newest';

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

            card.innerHTML =
                '<div class="entry-meta">' +
                    '<span class="entry-category">' + (entry.category || '未分类') + '</span>' +
                    '<span class="entry-date">' + dateStr + '</span>' +
                '</div>' +
                '<h3 class="entry-title">' + escapeHtml(entry.title) + '</h3>' +
                '<div class="entry-content">' + escapeHtml(preview) + '</div>' +
                (tagsHtml ? '<div class="entry-tags">' + tagsHtml + '</div>' : '') +
                '<div class="entry-actions">' +
                    '<button class="btn btn-secondary btn-sm edit-btn" data-id="' + entry.id + '">编辑</button>' +
                    '<button class="btn btn-danger btn-sm delete-btn" data-id="' + entry.id + '">删除</button>' +
                '</div>';

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

    if (newEntryBtn) {
        newEntryBtn.addEventListener('click', function () { openEditor(null); });
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

    renderEntries();
})();
