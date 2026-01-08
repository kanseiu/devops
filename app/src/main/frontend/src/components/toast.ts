// 中文注释：极客风全屏错误 Overlay（零依赖）
// - 全屏半透明背景 + 居中黑色面板
// - 右上角关闭按钮、Esc 关闭
// - 等宽字体、长文本可滚动
// - API：showGeekOverlay(title, content), hideGeekOverlay()

let overlayRoot: HTMLDivElement | null = null;
let autoCloseTimer: number | null = null;

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

type OverlayTone = 'default' | 'success' | 'danger';

type OverlayOptions = {
    tone?: OverlayTone;
    autoCloseMs?: number;
    showCopy?: boolean;
};

function toneStyles(tone: OverlayTone) {
    if (tone === 'success') {
        return {
            headerBg: '#ecfdf3',
            headerBorder: '#bbf7d0',
            title: '#166534',
            buttonBorder: '#bbf7d0',
            buttonText: '#166534',
        };
    }
    if (tone === 'danger') {
        return {
            headerBg: '#fef2f2',
            headerBorder: '#fecaca',
            title: '#b91c1c',
            buttonBorder: '#fecaca',
            buttonText: '#b91c1c',
        };
    }
    return {
        headerBg: '#f8fafc',
        headerBorder: '#e2e8f0',
        title: '#334155',
        buttonBorder: '#e2e8f0',
        buttonText: '#0f172a',
    };
}

function buildPanel(title: string, content: string, options?: OverlayOptions) {
    const tone = options?.tone ?? 'default';
    const palette = toneStyles(tone);
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
    gap: 12px; padding: 12px 16px; background:${palette.headerBg}; border-bottom:1px solid ${palette.headerBorder};
  `;

    const titleEl = document.createElement('div');
    titleEl.style.cssText = `font-weight:600; font-size:14px; color:${palette.title}; letter-spacing: .2px;`;
    titleEl.textContent = title || 'Error';

    const right = document.createElement('div');
    right.style.cssText = `display:flex; align-items:center; gap:8px;`;

    // 复制按钮（可选）
    const showCopy = options?.showCopy !== false;
    const copyBtn = document.createElement('button');
    if (showCopy) {
        copyBtn.textContent = '复制';
        copyBtn.title = '复制错误信息';
        copyBtn.style.cssText = `
        border:1px solid ${palette.buttonBorder}; background:#ffffff; color:${palette.buttonText};
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
    }

    // 关闭按钮
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '×';
    closeBtn.title = '关闭 (Esc)';
    closeBtn.style.cssText = `
    width:28px; height:28px; line-height:26px; text-align:center;
    border:1px solid ${palette.buttonBorder}; background:#ffffff; color:${palette.buttonText};
    border-radius:999px; cursor:pointer; font-size:16px;
  `;
    closeBtn.onclick = hideGeekOverlay;

    if (showCopy) right.appendChild(copyBtn);
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
    showOverlay(title, content, { tone: 'danger', showCopy: true });
}

export function showNoticeOverlay(title: string, content: string, tone: OverlayTone = 'success') {
    showOverlay(title, content, { tone, showCopy: true });
}

function showOverlay(title: string, content: string, options?: OverlayOptions) {
    ensureOverlayRoot();

    // 清空旧内容
    overlayRoot!.innerHTML = '';
    if (autoCloseTimer) {
        window.clearTimeout(autoCloseTimer);
        autoCloseTimer = null;
    }

    // 背景点击也可关闭（可按需改成不关闭）
    overlayRoot!.onclick = (e) => {
        if (e.target === overlayRoot) hideGeekOverlay();
    };

    // Esc 关闭
    const escHandler = (e: KeyboardEvent) => {
        if (e.key === 'Escape') hideGeekOverlay();
    };
    document.addEventListener('keydown', escHandler, { once: true });

    overlayRoot!.appendChild(buildPanel(title, content, options));
    overlayRoot!.style.display = 'flex';
    if (options?.autoCloseMs) {
        autoCloseTimer = window.setTimeout(() => {
            hideGeekOverlay();
        }, options.autoCloseMs);
    }
}

export function hideGeekOverlay() {
    if (!overlayRoot) return;
    overlayRoot.style.display = 'none';
    overlayRoot.innerHTML = '';
    if (autoCloseTimer) {
        window.clearTimeout(autoCloseTimer);
        autoCloseTimer = null;
    }
}
