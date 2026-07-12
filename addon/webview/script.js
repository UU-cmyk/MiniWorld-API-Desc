(function() {
    const vscode = acquireVsCodeApi();
    const searchView = document.getElementById('searchView');
    const detailView = document.getElementById('detailView');
    const detailContent = document.getElementById('detailContent');
    const detailBack = document.getElementById('detailBack');
    const searchInput = document.getElementById('searchInput');
    const resultsEl = document.getElementById('results');
    const paginationEl = document.getElementById('pagination');
    const statsEl = document.getElementById('resultCount');
    const loadingEl = document.getElementById('loading');
    const moduleSelect = document.getElementById('moduleFilter');

    let state = {
        version: 'all',
        module: 'all',
        kind: 'all',
        query: '',
        modules20: [],
        modules30: [],
        totalCount: 0,
        pageSize: 25,
        currentPage: 1,
        allResults: [],
    };

    // 更新模块下拉选项
    function updateModuleOptions(version) {
        let mods;
        if (version === '2.0') {mods = state.modules20;}
        else if (version === '3.0') {mods = state.modules30;}
        else {mods = [...new Set([...state.modules20, ...state.modules30])].sort();}
        const currentVal = moduleSelect.value;
        moduleSelect.innerHTML = '<option value="all">全部模块</option>';
        for (const mod of mods) {
            const opt = document.createElement('option');
            opt.value = mod;
            opt.textContent = mod;
            moduleSelect.appendChild(opt);
        }
        const keep = currentVal !== 'all' && mods.includes(currentVal);
        moduleSelect.value = keep ? currentVal : 'all';
        if (!keep) {state.module = 'all';}
        // 事件/枚举模式下禁用模块筛选
        if (state.kind === 'event' || state.kind === 'enum') {
            moduleSelect.disabled = true;
        } else {
            moduleSelect.disabled = false;
        }
    }

    // 筛选按钮
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.dataset.filter;
            const value = btn.dataset.value;
            // 同组按钮反选
            document.querySelectorAll(`.filter-btn[data-filter="${filter}"]`).forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            if (filter === 'version') {
                state.version = value;
                // 切换版本时更新模块下拉
                updateModuleOptions(value);
            }
            if (filter === 'kind') {
                state.kind = value;
                // 事件/枚举模式下禁用模块筛选
                if (value === 'event' || value === 'enum') {
                    moduleSelect.disabled = true;
                    moduleSelect.value = 'all';
                    state.module = 'all';
                } else {
                    moduleSelect.disabled = false;
                }
            }

            doSearch();
        });
    });

    // 模块下拉
    moduleSelect.addEventListener('change', () => {
        state.module = moduleSelect.value;
        doSearch();
    });

    // 搜索输入
    let debounceTimer;
    searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            state.query = searchInput.value;
            doSearch();
        }, 150);
    });

    // Ctrl+K 清空
    searchInput.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'k') {
            e.preventDefault();
            searchInput.value = '';
            state.query = '';
            doSearch();
        }
    });

    // 搜索
    function doSearch() {
        vscode.postMessage({
            type: 'search',
            query: state.query,
            version: state.version,
            module: state.module,
            kind: state.kind,
        });
    }

    // 打开详情
    function showDetail(name, sourceFile, sourceLine, kind) {
        vscode.postMessage({ type: 'showDetail', name, sourceFile, sourceLine, kind });
        searchView.classList.add('hidden');
        detailView.classList.remove('hidden');
        detailContent.innerHTML = '<div class="loading">加载中…</div>';
    }

    // 返回搜索
    detailBack.addEventListener('click', () => {
        detailView.classList.add('hidden');
        searchView.classList.remove('hidden');
    });

    // 将 Markdown 渲染为 HTML（带错误保护）
    function renderMarkdown(text) {
        if (!text) return '';
        try {
            return marked.parse(text);
        } catch (e) {
            console.warn('Markdown 渲染失败:', e);
            return escapeHtml(text);
        }
    }

    // 将行内 Markdown 渲染为 HTML（不带块级元素包裹）
    function renderMarkdownInline(text) {
        if (!text) return '';
        try {
            return marked.parseInline(text);
        } catch (e) {
            console.warn('Markdown 行内渲染失败:', e);
            return escapeHtml(text);
        }
    }

    // 渲染详情
    function renderDetail(d) {
        const kindLabel = { function: '函数', enum: '枚举', event: '事件' }[d.kind] || d.kind;
        const kindClass = { function: 'kind-function', enum: 'kind-enum', event: 'kind-event' }[d.kind] || '';
        const verClass = d.version === '2.0' ? 'version-2\\.0-tag' : 'version-3\\.0-tag';

        // 函数名显示：有 className 则加类名前缀，无则仅函数名（如 GlobalFunc）
        const detailDisplayName = d.kind === 'function'
            ? (d.className ? `${d.className}:${d.name}()` : `${d.name}()`)
            : d.name;
        const detailCopyText = detailDisplayName;

        // 第 1 行：代码名 + 复制按钮
        let html = `<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
            <div class="detail-name" style="font-family:var(--font-mono);font-weight:700;font-size:16px;color:var(--vscode-textLink-foreground,#3794ff);word-break:break-all">${escapeHtml(detailDisplayName)}</div>
            <button class="copy-btn detail-copy-btn" data-copy="${escapeHtml(detailCopyText)}" title="复制名称">📋</button>
        </div>`;

        // 第 2 行：标签
        html += `<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:8px">
            <span class="result-kind ${kindClass}">${kindLabel}</span>
            <span class="result-version ${verClass}">${d.version}</span>
            <span style="font-size:11px;opacity:0.6">${escapeHtml(d.module)}</span>
        </div>`;

        // 第 3 行：描述（Markdown 渲染）
        if (d.description) {
            html += `<div class="detail-section"><div class="detail-desc markdown-body">${renderMarkdown(d.description)}</div></div>`;
        }

        // 参数
        if (d.parameters && d.parameters.length > 0) {
            html += `<div class="detail-section">
                <div class="detail-section-title">参数</div>
                <div class="detail-grid">
                    <div class="grid-header"><span class="h-name">名称</span><span class="h-type">类型</span><span class="h-desc">说明</span></div>
            `;
            for (const p of d.parameters) {
                html += `<div class="grid-row"><span class="grid-cell cell-name">${escapeHtml(p.name)}</span><span class="grid-cell cell-type">${escapeHtml(p.type)}</span><span class="grid-cell cell-desc markdown-body">${renderMarkdownInline(p.desc)}</span></div>`;
            }
            html += `</div></div>`;
        }

        // 返回值
        if (d.returns && d.returns.length > 0) {
            html += `<div class="detail-section">
                <div class="detail-section-title">返回值</div>
                <div class="detail-grid">
                    <div class="grid-header"><span class="h-type">类型</span><span class="h-desc">说明</span></div>
            `;
            for (const r of d.returns) {
                html += `<div class="grid-row"><span class="grid-cell cell-type">${escapeHtml(r.type)}</span><span class="grid-cell cell-desc markdown-body">${renderMarkdownInline(r.desc)}</span></div>`;
            }
            html += `</div></div>`;
        }

        // 字段（枚举/事件）
        if (d.fields && d.fields.length > 0) {
            const fieldTitle = d.kind === 'event' ? '事件字段' : '枚举值';
            html += `<div class="detail-section">
                <div class="detail-section-title">${fieldTitle}</div>
                <div class="detail-grid">
                    <div class="grid-header"><span class="h-name">名称</span><span class="h-type">类型</span><span class="h-desc">说明</span></div>
            `;
            for (const f of d.fields) {
                const fullName = d.name.includes('.') ? f.name : d.name + '.' + f.name;
                html += `<div class="grid-row"><span class="grid-cell cell-name">${escapeHtml(fullName)}</span><span class="grid-cell cell-type">${escapeHtml(f.type)}</span><span class="grid-cell cell-desc markdown-body">${renderMarkdownInline(f.desc)}</span></div>`;
            }
            html += `</div></div>`;
        }

        // 源文件
        html += `<div class="detail-source">${escapeHtml(d.sourceFile)} : ${d.sourceLine}</div>`;

        detailContent.innerHTML = html;

        // 详情页复制按钮事件
        const detailCopyBtn = detailContent.querySelector('.detail-copy-btn');
        if (detailCopyBtn) {
            detailCopyBtn.addEventListener('click', () => {
                copyToClipboard(detailCopyText, detailCopyBtn);
            });
        }

        // 检测容器宽度，自动切换横排/竖排
        function adjustDetailLayout() {
            const grids = detailContent.querySelectorAll('.detail-grid');
            for (const grid of grids) {
                const w = grid.offsetWidth;
                const rows = grid.querySelectorAll('.grid-row');
                const header = grid.querySelector('.grid-header');
                if (w < 500) {
                    for (const row of rows) row.style.flexDirection = 'column';
                    if (header) header.style.display = 'none';
                } else {
                    for (const row of rows) row.style.flexDirection = 'row';
                    if (header) header.style.display = '';
                }
            }
        }
        adjustDetailLayout();
        window.addEventListener('resize', adjustDetailLayout);
    }

    // 渲染分页控件
    function renderPagination() {
        const total = state.allResults.length;
        const pageSize = state.pageSize;
        const totalPages = Math.max(1, Math.ceil(total / pageSize));
        const page = state.currentPage;

        if (total <= pageSize) {
            paginationEl.innerHTML = '';
            return;
        }

        let html = '';
        // 上一页
        html += `<button class="page-prev" ${page <= 1 ? 'disabled' : ''}>◀ 上一页</button>`;

        // 页码信息 + 输入框
        html += `<span class="page-info">第</span>`;
        html += `<input type="number" class="page-input" id="pageInput" value="${page}" min="1" max="${totalPages}" />`;
        html += `<span class="page-info">/ ${totalPages} 页</span>`;

        // 下一页
        html += `<button class="page-next" ${page >= totalPages ? 'disabled' : ''}>下一页 ▶</button>`;

        paginationEl.innerHTML = html;

        // 绑定事件
        const prevBtn = paginationEl.querySelector('.page-prev');
        const nextBtn = paginationEl.querySelector('.page-next');
        const pageInput = paginationEl.querySelector('.page-input');

        prevBtn.addEventListener('click', () => {
            if (state.currentPage > 1) {
                state.currentPage--;
                renderCurrentPage();
            }
        });
        nextBtn.addEventListener('click', () => {
            if (state.currentPage < totalPages) {
                state.currentPage++;
                renderCurrentPage();
            }
        });
        pageInput.addEventListener('change', () => {
            let p = parseInt(pageInput.value, 10);
            if (isNaN(p) || p < 1) {p = 1;}
            if (p > totalPages) {p = totalPages;}
            state.currentPage = p;
            pageInput.value = p;
            renderCurrentPage();
        });
        pageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                pageInput.dispatchEvent(new Event('change'));
            }
        });
    }

    // 渲染当前页
    function renderCurrentPage() {
        // 切页时滚动到顶部
        searchView.scrollIntoView({ behavior: 'smooth', block: 'start' });

        const total = state.allResults.length;
        const pageSize = state.pageSize;
        const totalPages = Math.max(1, Math.ceil(total / pageSize));
        const page = state.currentPage;

        const start = (page - 1) * pageSize;
        const end = Math.min(start + pageSize, total);
        const pageItems = state.allResults.slice(start, end);

        statsEl.textContent = `${end} / ${total} 条结果`;

        resultsEl.innerHTML = '';
        for (const item of pageItems) {
            const card = document.createElement('div');
            card.className = `result-item version-${item.version.replace('.', '\\.')}`;

            const kindLabel = { function: '函数', enum: '枚举', event: '事件' }[item.kind] || item.kind;

            let metaParts = [];
            if (item.kind === 'function') {
                if (item.paramCount > 0) metaParts.push(`${item.paramCount} 参数`);
                if (item.returnCount > 0) metaParts.push(`${item.returnCount} 返回值`);
            } else if (item.kind === 'enum' || item.kind === 'event') {
                if (item.fieldCount > 0) metaParts.push(`${item.fieldCount} 字段`);
            }

            // 取描述第一行作为简略摘要
            const briefDesc = item.description ? item.description.split('\n')[0] : '';

            const paramsPreview = item.parameters.length > 0
                ? item.parameters.map(p => `<code>${p.name}: ${p.type}</code>`).join(', ')
                : '';

            const displayName = item.displayName || item.name;
            card.innerHTML = `
                <div class="result-header">
                    <span class="result-name">${displayName}</span>
                    <button class="copy-btn result-copy-btn" data-copy="${displayName}" title="复制名称">📋</button>
                </div>
                <div class="result-tags">
                    <span class="result-kind kind-${item.kind}">${kindLabel}</span>
                    <span class="result-version version-${item.version}-tag">${item.version}</span>
                    <span class="result-module">${item.module}</span>
                </div>
                ${briefDesc ? '<div class="result-desc">' + escapeHtml(briefDesc) + '</div>' : ''}
                ${paramsPreview ? '<div class="result-meta">参数: ' + paramsPreview + '</div>' : ''}
                ${metaParts.length > 0 ? '<div class="result-meta">' + metaParts.join(' · ') + '</div>' : ''}
            `;

            // 复制按钮阻止冒泡，避免触发详情跳转
            const copyBtn = card.querySelector('.result-copy-btn');
            copyBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                copyToClipboard(displayName, copyBtn);
            });

            card.addEventListener('click', () => showDetail(item.name, item.sourceFile, item.sourceLine, item.kind));
            resultsEl.appendChild(card);
        }

        renderPagination();
    }

    // 渲染结果
    function renderResults(data) {
        loadingEl.classList.add('hidden');

        if (data.results.length === 0) {
            resultsEl.innerHTML = `
                <div class="empty">
                    <div class="title">🔍 未找到匹配结果</div>
                    <div>尝试使用更短的搜索词，或调整筛选条件</div>
                </div>
            `;
            paginationEl.innerHTML = '';
            statsEl.textContent = data.totalCount + ' 条 API · 无匹配结果';
            state.allResults = [];
            return;
        }

        // 保存全部结果，重置到第一页
        state.allResults = data.results;
        state.currentPage = 1;
        renderCurrentPage();
    }

    // 复制到剪贴板
    function copyToClipboard(text, btn) {
        // 使用 Web Clipboard API 直接写入（VS Code webview 支持）
        navigator.clipboard.writeText(text).then(() => {
            // 按钮反馈：成功
            const original = btn.textContent;
            btn.textContent = '✅';
            btn.classList.add('copied');
            setTimeout(() => {
                btn.textContent = original;
                btn.classList.remove('copied');
            }, 1200);
        }).catch(() => {
            // 降级：尝试通过 postMessage 让 extension 写入
            vscode.postMessage({ type: 'copy', text });
            const original = btn.textContent;
            btn.textContent = '✅';
            btn.classList.add('copied');
            setTimeout(() => {
                btn.textContent = original;
                btn.classList.remove('copied');
            }, 1200);
        });
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // 接收消息
    window.addEventListener('message', event => {
        const msg = event.data;
        switch (msg.type) {
            case 'initData':
                state.modules20 = msg.modules20;
                state.modules30 = msg.modules30;
                // 根据当前版本筛选填充模块下拉
                updateModuleOptions(state.version);
                state.totalCount = msg.counts.total;

                // 更新统计
                const c = msg.counts;
                statsEl.textContent = `${c.total} 条 API（函数 ${c.func} · 枚举 ${c.enum} · 事件 ${c.event}）`;
                loadingEl.classList.add('hidden');

                // 初始搜索
                doSearch();
                break;

            case 'searchResults':
                renderResults(msg);
                break;
            case 'detailResult':
                if (msg.error) {
                    detailContent.innerHTML = '<div class="empty"><div class="title">⚠️ ' + escapeHtml(msg.error) + '</div></div>';
                } else {
                    renderDetail(msg.detail);
                }
                break;
        }
    });

    // 通知扩展已就绪
    vscode.postMessage({ type: 'ready' });
})();
