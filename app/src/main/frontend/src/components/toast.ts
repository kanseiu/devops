// 中文注释：极客风全屏错误 Overlay（零依赖）
// - 全屏半透明背景 + 居中黑色面板
// - 右上角关闭按钮、Esc 关闭
// - 等宽字体、长文本可滚动
// - API：showGeekOverlay(title, content), hideGeekOverlay()

let overlayRoot: HTMLDivElement | null = null;

function ensureOverlayRoot() {
    if (!overlayRoot) {
        overlayRoot = document.createElement('div');
        overlayRoot.id = 'geek-overlay-root';
        overlayRoot.style.cssText = `
      position: fixed; inset: 0; z-index: 2147483647;
      display: none; align-items: center; justify-content: center;
      background: rgba(15, 23, 42, 0.4);
      backdrop-filter: blur(6px);
    `;
        document.body.appendChild(overlayRoot);
    }
}

function buildPanel(title: string, content: string) {
    const panel = document.createElement('div');
    panel.style.cssText = `
    width: min(1000px, 92vw);
    height: min(700px, 86vh);
    background: #ffffff;
    color: #0f172a;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    box-shadow: 0 18px 40px rgba(15, 23, 42, 0.18);
    display: grid;
    grid-template-rows: auto 1fr;
    overflow: hidden;
    font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace);
  `;

    // 顶部栏
    const header = document.createElement('div');
    header.style.cssText = `
    display:flex; align-items:center; justify-content:space-between;
    gap: 12px; padding: 12px 16px; background:#f8fafc; border-bottom:1px solid #e2e8f0;
  `;

    const titleEl = document.createElement('div');
    titleEl.style.cssText = `font-weight:600; font-size:14px; color:#334155; letter-spacing: .2px;`;
    titleEl.textContent = title || 'Error';

    const right = document.createElement('div');
    right.style.cssText = `display:flex; align-items:center; gap:8px;`;

    // 复制按钮（可选）
    const copyBtn = document.createElement('button');
    copyBtn.textContent = '复制';
    copyBtn.title = '复制错误信息';
    copyBtn.style.cssText = `
    border:1px solid #e2e8f0; background:#ffffff; color:#0f172a;
    padding:6px 12px; border-radius:999px; cursor:pointer; font-size:12px;
  `;
    copyBtn.onclick = async () => {
        try {
            await navigator.clipboard.writeText(content);
            copyBtn.textContent = '已复制';
            setTimeout(() => (copyBtn.textContent = '复制'), 1200);
        } catch {
            copyBtn.textContent = '失败';
            setTimeout(() => (copyBtn.textContent = '复制'), 1200);
        }
    };

    // 关闭按钮
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '×';
    closeBtn.title = '关闭 (Esc)';
    closeBtn.style.cssText = `
    width:28px; height:28px; line-height:26px; text-align:center;
    border:1px solid #e2e8f0; background:#ffffff; color:#334155;
    border-radius:999px; cursor:pointer; font-size:16px;
  `;
    closeBtn.onclick = hideGeekOverlay;

    right.appendChild(copyBtn);
    right.appendChild(closeBtn);

    header.appendChild(titleEl);
    header.appendChild(right);

    // 内容区
    const pre = document.createElement('pre');
    pre.style.cssText = `
    margin:0; padding:16px; overflow:auto; font-size:12px; line-height:1.6;
    white-space:pre-wrap; word-break:break-word; color:#0f172a; background:#ffffff;
  `;
    pre.textContent = content || '';

    panel.appendChild(header);
    panel.appendChild(pre);

    return panel;
}

export function showGeekOverlay(title: string, content: string) {
    ensureOverlayRoot();

    // 清空旧内容
    overlayRoot!.innerHTML = '';

    // 背景点击也可关闭（可按需改成不关闭）
    overlayRoot!.onclick = (e) => {
        if (e.target === overlayRoot) hideGeekOverlay();
    };

    // Esc 关闭
    const escHandler = (e: KeyboardEvent) => {
        if (e.key === 'Escape') hideGeekOverlay();
    };
    document.addEventListener('keydown', escHandler, { once: true });

    overlayRoot!.appendChild(buildPanel(title, content));
    overlayRoot!.style.display = 'flex';
}

export function hideGeekOverlay() {
    if (!overlayRoot) return;
    overlayRoot.style.display = 'none';
    overlayRoot.innerHTML = '';
}
