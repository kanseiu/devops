// 中文注释：服务器管理（Tailwind 统一风格 + 顶部导航 + 卡片式列表）
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/utils/api';
import { showGeekOverlay } from '@/components/toast';
import LabeledInput from '@/components/LabeledInput';
import LabeledTextArea from '@/components/LabeledTextArea';

type Server = {
    id?: number;
    name: string;              // 显示名
    host: string;              // 主机/IP
    port: number;              // SSH 端口
    username: string;          // 用户名
    authType: 'password' | 'privateKey'; // 鉴权类型
    passwordEnc?: string;      // 密码
    privateKeyEnc?: string;    // 私钥内容（PEM）
    passphraseEnc?: string;    // 私钥口令
    commandAllowList?: string; // 命令白名单（正则，多行）
    defaultTestCmd?: string;   // 默认测试命令
};

// 中文注释：表单初始值
const emptyForm: Server = {
    name: '',
    host: '',
    port: 22,
    username: '',
    authType: 'password',
    passwordEnc: '',
    privateKeyEnc: '',
    passphraseEnc: '',
    commandAllowList: '',
    defaultTestCmd: 'echo ping',
};

export default function Servers() {
    // 中文注释：列表/提示状态
    const [list, setList] = useState<Server[]>([]);
    const [loading, setLoading] = useState(false);

    // 中文注释：弹窗控制与表单
    const [visible, setVisible] = useState(false);
    const [form, setForm] = useState<Server>(emptyForm);
    const isEdit = useMemo(() => form.id != null, [form.id]);

    // 中文注释：加载列表
    const load = async () => {
        setLoading(true);
        try {
            const data = await api.get<Server[]>('/api/servers/list');
            setList(Array.isArray(data) ? data : []);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    // 中文注释：打开新增
    const openCreate = () => {
        setForm({ ...emptyForm });
        setVisible(true);
    };

    // 中文注释：打开编辑
    const openEdit = (s: Server) => {
        setForm({
            id: s.id,
            name: s.name ?? '',
            host: s.host ?? '',
            port: s.port ?? 22,
            username: s.username ?? '',
            authType: (s.authType as any) ?? 'password',
            passwordEnc: s.passwordEnc ?? '',
            privateKeyEnc: s.privateKeyEnc ?? '',
            passphraseEnc: s.passphraseEnc ?? '',
            commandAllowList: s.commandAllowList ?? '',
            defaultTestCmd: s.defaultTestCmd ?? 'echo ping',
        });
        setVisible(true);
    };

    // 中文注释：表单校验（最小校验）
    const validate = (v: Server): string | null => {
        if (!v.name?.trim()) return '显示名不能为空';
        if (!v.host?.trim()) return '主机/IP 不能为空';
        if (!v.username?.trim()) return '用户名不能为空';
        if (!v.port || v.port <= 0 || v.port > 65535) return '端口无效';
        if (v.authType === 'password') {
            // 可选：允许空密码（有些系统 keyboard-interactive）
            return null;
        } else {
            if (!v.privateKeyEnc?.trim()) return '私钥内容不能为空';
            if (!v.privateKeyEnc?.includes('BEGIN') || !v.privateKeyEnc?.includes('PRIVATE KEY'))
                return '私钥格式看起来不正确';
            return null;
        }
    };

    // 中文注释：保存（新增或编辑）
    const save = async () => {
        const err = validate(form);
        if (err) {
            alert(err);
            return;
        }
        const payload: Server = {
            ...form,
            // 中文注释：根据鉴权类型清理不需要的字段，避免后端混淆
            passwordEnc: form.authType === 'password' ? form.passwordEnc : undefined,
            privateKeyEnc: form.authType === 'privateKey' ? normalizePem(form.privateKeyEnc || '') : undefined,
            passphraseEnc: form.authType === 'privateKey' ? form.passphraseEnc : undefined,
        };
        await api.post('/api/servers/save', payload);
        setVisible(false);
        await load();
    };

    // 中文注释：规范化 PEM：换行/BOM，避免后端 JSch 报 invalid privatekey
    const normalizePem = (pem: string) => {
        let s = pem.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\uFEFF/g, '');
        if (!s.endsWith('\n')) s += '\n';
        return s;
    };

    // 中文注释：实时测试（SSE），后端从 DB 取凭据，前端只传 id
    const test = (id?: number) => {
        if (!id) return;
        const es = new EventSource(`/api/servers/${id}/test/stream`);
        showGeekOverlay(`测试连接 #${id}`, '正在连接...\n');

        const append = (line: string) => {
            const root = document.getElementById('geek-overlay-root');
            if (!root) return;
            const pre = root.querySelector('pre');
            if (pre) {
                pre.textContent += (line.endsWith('\n') ? line : (line + '\n'));
                (pre as HTMLPreElement).scrollTop = (pre as HTMLPreElement).scrollHeight;
            }
        };

        es.addEventListener('meta',   (e: any) => append(`[meta] ${e.data}`));
        es.addEventListener('stdout', (e: any) => append(e.data));
        es.addEventListener('error',  (e: any) => append(`[ERR] ${e.data}`));
        es.addEventListener('end',    (e: any) => { append(`\n[done] exit=${e.data}`); es.close(); });

        es.onerror = () => {
            append('\n[error] 连接中断');
            es.close();
        };
    };

    // 中文注释：弹窗 ESC 快速关闭
    useEffect(() => {
        if (!visible) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                setVisible(false);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [visible]);

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            {/* 顶部导航：与首页一致 */}
            <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-gray-100 shadow-sm">
                <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
                    <h1 className="text-xl font-bold">服务器管理</h1>
                    <nav className="text-sm text-gray-600">
                        <Link to="/" className="hover:text-gray-900">首页</Link>
                        <span className="mx-3">·</span>
                        <Link to="/scripts" className="hover:text-gray-900">脚本</Link>
                        <span className="mx-3">·</span>
                        <Link to="/checks" className="hover:text-gray-900">任务</Link>
                        <span className="mx-3">·</span>
                        <Link to="/databases" className="hover:text-gray-900">数据库</Link>
                        <span className="mx-3">·</span>
                        <Link to="/notifyTargets" className="hover:text-gray-900">通知方式</Link>
                    </nav>
                </div>
            </header>

            {/* 主体容器 */}
            <main className="flex-1 overflow-y-auto">
                <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
                    {/* 操作区 */}
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                            共 <span className="font-semibold text-gray-700">{list.length}</span> 台服务器
                        </div>
                        <div className="space-x-3">
                            <button
                                onClick={openCreate}
                                className="px-3.5 py-2 rounded-lg text-white text-sm bg-blue-600 hover:bg-blue-700"
                            >
                                新增服务器
                            </button>
                        </div>
                    </div>

                    {/* 列表区 */}
                    {loading && (
                        <div className="text-sm text-gray-500">加载中...</div>
                    )}

                    {!loading && list.length === 0 && (
                        <div className="bg-white rounded-2xl shadow-card p-8 text-center text-gray-500">
                            暂无数据
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {list.map((s) => (
                            <div key={s.id} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm hover:shadow-cardHover transition">
                                <div className="font-semibold mb-1">
                                    #{s.id} {s.name}
                                </div>
                                <div className="text-xs text-gray-500 mb-3">
                                    {s.username}@{s.host}:{s.port} — auth={s.authType}
                                </div>
                                <div className="mt-auto flex items-center gap-2">
                                    <button
                                        onClick={() => openEdit(s)}
                                        className="px-3 py-1.5 rounded-lg border text-sm bg-white border-gray-200 hover:bg-gray-50"
                                    >
                                        编辑
                                    </button>
                                    <button
                                        onClick={() => test(s.id)}
                                        className="px-3 py-1.5 rounded-lg text-white text-sm bg-blue-600 hover:bg-blue-700"
                                    >
                                        测试连接
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            {/* 底部页脚（固定高度，始终可见） */}
            <footer className="shrink-0 bg-white border-t border-gray-100 drop-shadow-md">
                <div className="mx-auto max-w-6xl px-4 py-3 text-xs text-gray-500 flex items-center justify-between">
                    <span>v1.0 · 内部工具</span>
                    <span className="space-x-3">
                        <Link to="/" className="hover:text-gray-800">首页</Link>
                        <Link to="/scripts" className="hover:text-gray-800">脚本</Link>
                        <Link to="/checks" className="hover:text-gray-800">任务</Link>
                        <Link to="/databases" className="hover:text-gray-900">数据库</Link>
                        <Link to="/notifyTargets" className="hover:text-gray-800">通知方式</Link>
          </span>
                </div>
            </footer>

            {/* 弹窗 */}
            {visible && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45">
                    <div className="w-[720px] max-w-[94vw] bg-white rounded-2xl shadow-2xl p-4">
                        {/* 标题行 */}
                        <div className="flex items-center justify-between mb-3">
                            <div className="font-semibold">{isEdit ? '编辑服务器' : '新增服务器'}</div>
                            <button
                                onClick={() => setVisible(false)}
                                className="w-8 h-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
                                aria-label="close"
                            >
                                ×
                            </button>
                        </div>

                        {/* 表单网格 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {/* 中文注释：LabeledInput/LabeledTextArea 自带布局，这里仅控制外层间距 */}
                            <div>
                                <LabeledInput label="显示名" value={form.name}
                                              onChange={(v) => setForm({ ...form, name: v })} />
                            </div>
                            <div>
                                <LabeledInput label="主机/IP" value={form.host}
                                              onChange={(v) => setForm({ ...form, host: v })}
                                              disabled={isEdit} />
                            </div>
                            <div>
                                <LabeledInput label="SSH 端口" type="number" value={form.port}
                                              onChange={(v) => setForm({ ...form, port: v as any })} />
                            </div>
                            <div>
                                <LabeledInput label="用户名" value={form.username}
                                              onChange={(v) => setForm({ ...form, username: v })} />
                            </div>

                            {/* 鉴权类型 */}
                            <label className="block">
                                <div className="text-xs text-gray-500 mb-1">鉴权类型</div>
                                <select
                                    value={form.authType}
                                    onChange={(e) => setForm({ ...form, authType: e.target.value as Server['authType'] })}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="password">password</option>
                                    <option value="privateKey">privateKey</option>
                                </select>
                            </label>

                            {form.authType === 'password' ? (
                                <div>
                                    <LabeledInput label="密码" type="text" value={form.passwordEnc}
                                                  onChange={(v) => setForm({ ...form, passwordEnc: v })} />
                                </div>
                            ) : (
                                <>
                                    {/* 私钥内容：跨两列 */}
                                    <div className="md:col-span-2">
                                        <LabeledTextArea
                                            label="私钥内容（PEM）"
                                            value={form.privateKeyEnc}
                                            onChange={(v) => setForm({ ...form, privateKeyEnc: v })}
                                            placeholder={'-----BEGIN OPENSSH PRIVATE KEY-----\n...'}
                                            rows={10}
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <LabeledInput
                                            label="私钥口令（如有）"
                                            type="text"
                                            value={form.passphraseEnc}
                                            onChange={(v) => setForm({ ...form, passphraseEnc: v })}
                                        />
                                    </div>
                                </>
                            )}

                            {/* 白名单：跨两列 */}
                            <div className="md:col-span-2">
                                <LabeledTextArea
                                    label="命令白名单（正则，多行；为空=不限制）"
                                    value={form.commandAllowList}
                                    onChange={(v) => setForm({ ...form, commandAllowList: v })}
                                    placeholder={'^echo\\s+ping$\n^uname(\\s+-a)?$'}
                                    rows={6}
                                />
                            </div>

                            {/* 默认命令：跨两列 */}
                            <div className="md:col-span-2">
                                <LabeledInput
                                    label="默认测试命令"
                                    value={form.defaultTestCmd}
                                    onChange={(v) => setForm({ ...form, defaultTestCmd: v })}
                                    placeholder="echo ping"
                                />
                            </div>
                        </div>

                        {/* 底部按钮 */}
                        <div className="mt-4 flex justify-end gap-2">
                            <button
                                onClick={() => setVisible(false)}
                                className="px-3.5 py-2 rounded-lg border text-sm bg-white border-gray-200 hover:bg-gray-50"
                            >
                                取消
                            </button>
                            <button
                                onClick={save}
                                className="px-3.5 py-2 rounded-lg text-white text-sm bg-blue-600 hover:bg-blue-700"
                            >
                                {isEdit ? '保存' : '创建'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}