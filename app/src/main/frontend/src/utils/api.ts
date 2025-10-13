// src/utils/api.ts
// 中文注释：统一封装 fetch & 解包：code=200 返回 data(可为 null)；401 跳登录；5xx 弹 Toast
import type {ApiResp} from '@/types/api';
import {showGeekOverlay} from '@/components/toast';

const jsonHeaders = {'Content-Type': 'application/json'};

// =============== 新增：轻量成功气泡 & 开关工具 ===============
function showSuccessMsg(msg?: string) {
    // 中文注释：无 msg 直接返回
    if (!msg) return;

    // 中文注释：注入一次样式
    const id = 'mini-toast-style';
    if (!document.getElementById(id)) {
        const style = document.createElement('style');
        style.id = id;
        style.textContent = `
      .mini-toast{position:fixed;left:50%;top:20px;transform:translateX(-50%);
        background:rgba(0,0,0,.82);color:#fff;padding:8px 12px;border-radius:8px;
        font-size:13px;z-index:99999;opacity:0;transition:opacity .2s,transform .2s}
      .mini-toast-show{opacity:1;transform:translateX(-50%) translateY(4px)}
    `;
        document.head.appendChild(style);
    }

    const div = document.createElement('div');
    div.className = 'mini-toast';
    div.textContent = String(msg);
    document.body.appendChild(div);

    requestAnimationFrame(() => div.classList.add('mini-toast-show'));
    setTimeout(() => {
        div.classList.remove('mini-toast-show');
        setTimeout(() => div.remove(), 200);
    }, 2000);
}

// 中文注释：请求是否写操作（GET 不弹）
function isWriteMethod(init?: RequestInit) {
    const m = (init?.method || 'GET').toUpperCase();
    return m !== 'GET';
}

// 中文注释：请求头里是否显式关闭成功气泡（X-Silent-Success: 1/true）
function isSilentSuccess(init?: RequestInit) {
    const h = init?.headers;
    if (!h) return false;
    if (h instanceof Headers) {
        const v = h.get('X-Silent-Success');
        return v != null && /^(1|true)$/i.test(v);
    }
    // @ts-ignore
    const v = h['X-Silent-Success'] ?? h['x-silent-success'];
    return v != null && /^(1|true)$/i.test(String(v));
}
// ===========================================================

// 中文注释：读取 XSRF-TOKEN Cookie
function getCookie(name: string) {
    return document.cookie.split('; ').find(x => x.startsWith(name + '='))?.split('=')[1] || '';
}

function loginRedirect() {
    const from = encodeURIComponent(location.pathname + location.search);
    location.href = `/login?from=${from}`;
}

function htmlSnippet(html: string, max = 4000) {
    // 中文注释：保留原文（Overlay 可滚动），如需摘要可 substring
    return html;
}

async function parseJsonSafely(resp: Response) {
    const text = await resp.text();
    try {
        return text ? JSON.parse(text) : null;
    } catch {
        return text;
    }
}

export async function apiRequest<T = any>(url: string, init?: RequestInit): Promise<ApiResp<T>> {
    const resp = await fetch(url, {credentials: 'include', ...(init ?? {})});

    if (resp.status === 401) {
        loginRedirect();
        throw new Error('Unauthorized');
    }

    const contentType = resp.headers.get('content-type') || '';
    const body = await parseJsonSafely(resp);

    if (resp.status >= 500) {
        if (contentType.includes('application/json') && body && (body as any).code !== undefined) {
            const api = body as ApiResp<any>;
            const stack = typeof api.data === 'string' ? api.data : '';
            const title = `服务器异常 ${resp.status}`;
            const content = `${api.msg || ''}${stack ? `\n\n${stack}` : ''}`;
            showGeekOverlay(title, content);
            throw new Error(api.msg || `HTTP ${resp.status}`);
        } else {
            const raw = typeof body === 'string' ? body : JSON.stringify(body, null, 2);
            showGeekOverlay(`服务器异常 ${resp.status}`, htmlSnippet(raw));
            throw new Error(`HTTP ${resp.status}`);
        }
    }

    if (!body || typeof body !== 'object' || (body as any).code === undefined) {
        showGeekOverlay('响应格式异常', typeof body === 'string' ? body : JSON.stringify(body, null, 2));
        throw new Error('响应格式异常');
    }

    const api = body as ApiResp<T>;
    if (api.code !== 200) {
        showGeekOverlay('请求失败', `${api.msg || ''}`);
        throw new Error(api.msg || `请求失败（code=${api.code}）`);
    }

    // ========= 仅在“写操作成功”时显示成功气泡（不会影响返回） =========
    if (isWriteMethod(init) && !isSilentSuccess(init)) {
        const msg = (api as any).msg ?? (api as any).message;
        if (msg) {
            // 中文注释：推到宏任务，且捕获异常，确保不影响返回
            setTimeout(() => { try { showSuccessMsg(msg); } catch {} }, 0);
        }
    }

    return api;
}

export async function apiFetchData<T = any>(url: string, init?: RequestInit): Promise<T | null> {
    const res = await apiRequest<T>(url, init);
    return (res.data ?? null) as T | null;
}

export const api = {
    get: <T>(u: string) => apiFetchData<T>(u),
    post: <T>(u: string, data?: unknown, extra?: RequestInit) =>
        apiFetchData<T>(u, {
            method: 'POST',
            headers: {
                ...jsonHeaders,
                'X-XSRF-TOKEN': getCookie('XSRF-TOKEN'),
            },
            ...(data !== undefined ? {body: JSON.stringify(data)} : {}),
            ...(extra ?? {})
        }),
};