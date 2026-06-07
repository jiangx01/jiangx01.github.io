(function () {
    var params = new URLSearchParams(window.location.search);
    var postId = params.get('id');

    if (!postId) {
        document.getElementById('postContainer').innerHTML =
            '<div class="empty-state"><div class="empty-icon">🔍</div><h3>未指定文章</h3><p><a href="journal.html">返回博客</a></p></div>';
        return;
    }

    async function loadPost() {
        var container = document.getElementById('postContainer');
        var entries = await app.getEntries();
        var entry = entries.find(function (e) { return e.id === postId; });

        if (!entry) {
            container.innerHTML =
                '<div class="empty-state"><div class="empty-icon">😕</div><h3>文章未找到</h3><p><a href="journal.html">返回博客</a></p></div>';
            return;
        }

        var coverImage = app.extractCoverImage(entry.content);
        var contentBody = coverImage ? app.stripCoverImage(entry.content) : entry.content;
        var renderedContent = app.renderMarkdown(contentBody);
        var date = new Date(entry.createdAt);
        var dateStr = date.getFullYear() + '年' +
            (date.getMonth() + 1) + '月' +
            date.getDate() + '日';
        var readingTime = app.calcReadingTime(contentBody);

        document.title = entry.title + ' - Jiang 的博客';
        document.getElementById('pageDesc').content = entry.title;
        document.getElementById('ogTitle').content = entry.title;
        document.getElementById('ogDesc').content = (entry.content || '').substring(0, 200);
        if (coverImage) {
            document.getElementById('ogImage').content = coverImage;
        }

        var tagsHtml = (entry.tags || []).map(function (t) {
            return '<a href="journal.html?tag=' + encodeURIComponent(t) + '" class="entry-tag">#' + t + '</a>';
        }).join('');

        var coverHtml = coverImage
            ? '<div class="post-cover"><img src="' + coverImage + '" alt="' + escapeHtml(entry.title) + '"></div>'
            : '';

        var index = entries.findIndex(function (e) { return e.id === postId; });
        var prevEntry = index < entries.length - 1 ? entries[index + 1] : null;
        var nextEntry = index > 0 ? entries[index - 1] : null;

        var navHtml = '<div class="post-nav">';
        if (prevEntry) {
            navHtml += '<a href="post.html?id=' + prevEntry.id + '" class="post-nav-link post-nav-prev">' +
                '<span class="post-nav-label">← 上一篇</span>' +
                '<span class="post-nav-title">' + escapeHtml(prevEntry.title) + '</span>' +
                '</a>';
        } else {
            navHtml += '<div></div>';
        }
        if (nextEntry) {
            navHtml += '<a href="post.html?id=' + nextEntry.id + '" class="post-nav-link post-nav-next">' +
                '<span class="post-nav-label">下一篇 →</span>' +
                '<span class="post-nav-title">' + escapeHtml(nextEntry.title) + '</span>' +
                '</a>';
        } else {
            navHtml += '<div></div>';
        }
        navHtml += '</div>';

        container.innerHTML =
            '<div class="post-header">' +
                '<div class="post-header-content">' +
                    '<div class="post-meta">' +
                        '<span class="entry-category">' + (entry.category || '未分类') + '</span>' +
                        '<span class="entry-date">' + dateStr + '</span>' +
                        '<span class="reading-time">' + readingTime + '</span>' +
                    '</div>' +
                    '<h1 class="post-title">' + escapeHtml(entry.title) + '</h1>' +
                    (tagsHtml ? '<div class="post-tags">' + tagsHtml + '</div>' : '') +
                '</div>' +
            '</div>' +
            coverHtml +
            '<div class="post-content markdown-body">' + renderedContent + '</div>' +
            '<div class="post-footer-bar">' +
                '<a href="journal.html" class="btn btn-secondary btn-sm">← 返回博客</a>' +
            '</div>' +
            navHtml;

        if (window.hljs) {
            container.querySelectorAll('pre code').forEach(function (block) {
                hljs.highlightElement(block);
            });
        }
    }

    function escapeHtml(text) {
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(text));
        return div.innerHTML;
    }

    loadPost();
})();
