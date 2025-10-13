// src/pages/Databases.tsx
import {useEffect, useMemo, useState} from 'react';
import {api} from '@/utils/api';
import {showGeekOverlay} from '@/components/toast';
import LabeledInput from '@/components/LabeledInput';
import LabeledTextArea from '@/components/LabeledTextArea';
import {Link} from "react-router-dom";

// 数据库实体
type DatabaseItem = {
    id?: number;
    name: string;
    dbType: string;       // mysql/oceanbase/h2
    jdbcUrl: string;
    username?: string;
    passwordEnc?: string;
    testSql?: string;
    disabled?: boolean;
    descText?: string;
};

// 表单初始值
const emptyForm: DatabaseItem = {
    name: '',
    dbType: 'mysql',
    jdbcUrl: '',
    username: '',
    passwordEnc: '',
    testSql: '',
    disabled: false,
    descText: '',
};

export default function Databases() {
    // 列表与状态
    const [list, setList] = useState<DatabaseItem[]>([]);
    const [loading, setLoading] = useState(false);

    // 弹窗与表单
    const [visible, setVisible] = useState(false);
    const [form, setForm] = useState<DatabaseItem>(emptyForm);
    const isEdit = useMemo(() => form.id != null, [form.id]);

    // ================= 数据加载 =================
    const load = async () => {
        setLoading(true);
        try {
            const data = await api.get<DatabaseItem[]>('/api/databases/list');
            setList(Array.isArray(data) ? data : []);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    // ================= 弹窗操作 =================
    const openCreate = () => {
        setForm({...emptyForm});
        setVisible(true);
    };

    const openEdit = (row: DatabaseItem) => {
        setForm({
            id: row.id,
            name: row.name ?? '',
            dbType: row.dbType ?? 'mysql',
            jdbcUrl: row.jdbcUrl ?? '',
            username: row.username ?? '',
            passwordEnc: row.passwordEnc ?? '',
            testSql: row.testSql ?? '',
            disabled: !!row.disabled,
            descText: row.descText ?? '',
        });
        setVisible(true);
    };

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

    // ================= 表单保存 =================
    const validate = (v: DatabaseItem): string | null => {
        if (!v.name?.trim()) return '显示名不能为空';
        if (!v.dbType?.trim()) return '数据库类型不能为空';
        if (!v.jdbcUrl?.trim()) return 'JDBC URL 不能为空';
        return null;
    };

    const save = async () => {
        const err = validate(form);
        if (err) {
            alert(err);
            return;
        }
        const payload: DatabaseItem = {
            id: form.id,
            name: form.name.trim(),
            dbType: form.dbType.trim(),
            jdbcUrl: form.jdbcUrl.trim(),
            username: form.username?.trim() || undefined,
            passwordEnc: form.passwordEnc || undefined,
            testSql: form.testSql || undefined,
            disabled: !!form.disabled,
            descText: form.descText?.trim() || undefined,
        };
        await api.post('/api/databases/save', payload);
        setVisible(false);
        await load();
    };

    // ================= 测试连接（SSE） =================
    const test = (id?: number) => {
        if (!id) return;
        const es = new EventSource(`/api/databases/${id}/test`);
        showGeekOverlay(`测试数据库连接 #${id}`, '正在连接...\n');

        const append = (line: string) => {
            const root = document.getElementById('geek-overlay-root');
            if (!root) return;
            const pre = root.querySelector('pre');
            if (pre) {
                pre.textContent += (line.endsWith('\n') ? line : (line + '\n'));
                (pre as HTMLPreElement).scrollTop = (pre as HTMLPreElement).scrollHeight;
            }
        };

        es.addEventListener('meta', (e: any) => append(`[meta] ${e.data}`));
        es.addEventListener('stdout', (e: any) => append(e.data));
        es.addEventListener('error', (e: any) => append(`[ERR] ${e.data}`));
        es.addEventListener('end', (e: any) => {
            append(`\n[done] exit=${e.data}`);
            es.close();
        });

        es.onerror = () => {
            append('\n[error] 连接中断');
            es.close();
        };
    };

    // ================= UI =================
    return (
        <div className="flex flex-col h-screen bg-gray-50">
            {/* header */}
            <header className="shrink-0 bg-white/80 backdrop-blur border-b border-gray-100 shadow-sm">
                <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
                    <h1 className="text-xl font-bold">数据库管理</h1>
                    <nav className="text-sm text-gray-600">
                        <Link to="/" className="hover:text-gray-900">首页</Link>
                        <span className="mx-3">·</span>
                        <Link to="/servers" className="hover:text-gray-900">服务器</Link>
                        <span className="mx-3">·</span>
                        <Link to="/scripts" className="hover:text-gray-900">脚本</Link>
                        <span className="mx-3">·</span>
                        <Link to="/checks" className="hover:text-gray-900">任务</Link>
                        <span className="mx-3">·</span>
                        <Link to="/notifyTargets" className="hover:text-gray-900">通知方式</Link>
                    </nav>
                </div>
            </header>

            {/* main */}
            <main className="flex-1 overflow-y-auto">
                <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
                    {/* 操作区 */}
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                            共 <span className="font-semibold text-gray-700">{list.length}</span> 个数据库
                        </div>
                        <div className="space-x-3">
                            <button
                                onClick={openCreate}
                                className="px-3.5 py-2 rounded-lg text-white text-sm bg-blue-600 hover:bg-blue-700"
                            >
                                新增数据库
                            </button>
                        </div>
                    </div>

                    {/* 中文注释：列表卡片——小屏 1 列，≥md 两列；样式与服务器管理页面统一 */}
                    {loading && <div>加载中...</div>}

                    {!loading && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {list.map((row) => (
                                <div
                                    key={row.id}
                                    className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm hover:shadow-cardHover transition"
                                >
                                    {/* 头部：名称 + 类型徽标 */}
                                    <div className="flex items-center justify-between">
                                        <div className="font-semibold text-gray-800">
                                            #{row.id} {row.name}
                                        </div>
                                        <span
                                            className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700"
                                            title={row.dbType}
                                        >
            {row.dbType?.toUpperCase()}
          </span>
                                    </div>

                                    {/* URL：单行省略 + title，避免撑坏布局 */}
                                    <div
                                        className="mt-2 mb-1 text-[13px] text-gray-600 truncate leading-relaxed"
                                        title={row.jdbcUrl}
                                    >
                                        URL：{row.jdbcUrl}
                                    </div>

                                    {/* 可选信息：禁用/描述（和服务器页面风格一致的小字行） */}
                                    <div className="mt-1 text-[12px] text-gray-500">
                                        {row.disabled ? <span className="text-gray-400">已禁用</span> :
                                            <span className="text-emerald-600">启用中</span>}
                                        {row.descText ?
                                            <span className="ml-2 text-gray-400">· {row.descText}</span> : null}
                                    </div>

                                    {/* 操作区：右对齐按钮 */}
                                    <div className="mt-3 flex items-center gap-2">
                                        <button
                                            onClick={() => openEdit(row)}
                                            className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-sm hover:bg-gray-50"
                                        >
                                            编辑
                                        </button>
                                        <button
                                            onClick={() => test(row.id)}
                                            className="px-3 py-1.5 rounded-lg border border-blue-500 bg-blue-500 text-white text-sm hover:brightness-95"
                                        >
                                            测试连接
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {/* 空状态 */}
                            {list.length === 0 && (
                                <div
                                    className="col-span-full text-sm text-gray-500 bg-white border border-dashed border-gray-200 rounded-2xl p-6 text-center">
                                    暂无数据
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>

            {/* footer */}
            <footer className="shrink-0 bg-white border-t border-gray-100 shadow-sm">
                <div className="mx-auto max-w-6xl px-4 py-3 text-xs text-gray-500 flex items-center justify-between">
                    <span>v1.0 · 内部工具</span>
                    <span className="space-x-3">
                        <Link to="/" className="hover:text-gray-800">首页</Link>
                        <Link to="/servers" className="hover:text-gray-800">服务器</Link>
                        <Link to="/scripts" className="hover:text-gray-800">脚本</Link>
                        <Link to="/checks" className="hover:text-gray-800">任务</Link>
                        <Link to="/notifyTargets" className="hover:text-gray-800">通知方式</Link>
          </span>
                </div>
            </footer>

            {/* 弹窗 */}
            {visible && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-[720px] max-w-[94vw] p-6">
                        <div className="flex justify-between items-center mb-4">
                            <div className="font-semibold">{isEdit ? '编辑数据库' : '新建数据库'}</div>
                            <button
                                onClick={() => setVisible(false)}
                                className="w-8 h-8 flex items-center justify-center rounded border border-gray-300 bg-white"
                            >
                                ×
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* 数据库类型 */}
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">数据库类型</label>
                                <select
                                    value={form.dbType}
                                    onChange={(e) => setForm({...form, dbType: e.target.value})}
                                    className="w-full border rounded-lg px-3 py-2 text-sm"
                                >
                                    <option value="mysql">MySQL</option>
                                    <option value="oceanbase">OceanBase</option>
                                    <option value="h2">H2</option>
                                </select>
                            </div>

                            {/* 显示名 */}
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">显示名</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm({...form, name: e.target.value})}
                                    className="w-full border rounded-lg px-3 py-2 text-sm"
                                    placeholder="例如：业务库-MySQL"
                                />
                            </div>

                            {/* JDBC URL（单独占一行） */}
                            <div className="md:col-span-2">
                                <label className="block text-sm text-gray-600 mb-1">JDBC URL</label>
                                <input
                                    type="text"
                                    value={form.jdbcUrl}
                                    onChange={(e) => setForm({...form, jdbcUrl: e.target.value})}
                                    className="w-full border rounded-lg px-3 py-2 text-sm font-mono"
                                    placeholder="例如：jdbc:mysql://127.0.0.1:3306/dbname?useSSL=false"
                                />
                            </div>

                            {/* 测试 SQL：单独占一行 */}
                            <div style={{gridColumn: '1 / -1', minWidth: 0}}>
                                <LabeledInput
                                    label="测试 SQL"
                                    value={form.testSql || ''}
                                    onChange={(v) => setForm({...form, testSql: v})}
                                    placeholder="例如：SELECT 1"
                                />
                            </div>

                            {/* 用户名 */}
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">用户名</label>
                                <input
                                    type="text"
                                    value={form.username}
                                    onChange={(e) => setForm({...form, username: e.target.value})}
                                    className="w-full border rounded-lg px-3 py-2 text-sm"
                                    placeholder="root"
                                />
                            </div>

                            {/* 密码 */}
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">密码</label>
                                <input
                                    type="text"
                                    value={form.passwordEnc}
                                    onChange={(e) => setForm({...form, passwordEnc: e.target.value})}
                                    className="w-full border rounded-lg px-3 py-2 text-sm"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setVisible(false)}
                                    className="px-4 py-2 rounded-lg border border-gray-300 bg-white">
                                取消
                            </button>
                            <button onClick={save}
                                    className="px-4 py-2 rounded-lg border border-blue-500 bg-blue-500 text-white">
                                {isEdit ? '保存' : '创建'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}