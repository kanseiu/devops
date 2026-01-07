// src/pages/Databases.tsx
import {useEffect, useMemo, useState} from 'react';
import {api} from '@/utils/api';
import {showGeekOverlay} from '@/components/toast';
import LabeledInput from '@/components/LabeledInput';
import LabeledTextArea from '@/components/LabeledTextArea';
import LabeledSelect from '@/components/LabeledSelect';
import AppHeader from '@/components/AppHeader';
import AppFooter from '@/components/AppFooter';
import {useConfirm} from '@/components/ConfirmDialog';

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
    const confirm = useConfirm();

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

    const remove = async (row: DatabaseItem) => {
        if (!row?.id) return;
        const first = await confirm({
            title: '确认删除',
            message: `确认删除数据库 #${row.id} ${row.name}？`,
            confirmText: '继续',
            cancelText: '取消',
            tone: 'danger',
        });
        if (!first) return;
        const second = await confirm({
            title: '二次确认',
            message: '此操作不可恢复，是否继续删除？',
            confirmText: '删除',
            cancelText: '取消',
            tone: 'danger',
        });
        if (!second) return;
        await api.post(`/api/databases/delete/${row.id}`, {});
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
        <div className="app-shell flex flex-col h-screen">
            {/* header */}
            <AppHeader title="数据库管理" />

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
                                新建
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
                                    <div className="mt-3 flex items-center justify-between gap-2">
                                        <button
                                            onClick={() => remove(row)}
                                            className="px-3 py-1.5 rounded-lg text-white text-sm bg-rose-600 hover:bg-rose-700"
                                        >
                                            删除
                                        </button>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => test(row.id)}
                                                className="px-3 py-1.5 rounded-lg border border-blue-500 bg-blue-500 text-white text-sm hover:brightness-95"
                                            >
                                                测试连接
                                            </button>
                                            <button
                                                onClick={() => openEdit(row)}
                                                className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-sm hover:bg-gray-50"
                                            >
                                                编辑
                                            </button>
                                        </div>
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
            <AppFooter />

            {/* 弹窗 */}
            {visible && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45">
                    <div className="w-[760px] max-w-[94vw] bg-white rounded-2xl shadow-2xl p-4">
                        <div className="flex items-center justify-between mb-3">
                            <div className="font-semibold">{isEdit ? '编辑' : '新建'}</div>
                            <button
                                onClick={() => setVisible(false)}
                                className="w-8 h-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
                            >
                                ×
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* 数据库类型 */}
                            <div>
                                <LabeledSelect
                                    label="数据库类型"
                                    value={form.dbType}
                                    onChange={(v) => setForm({...form, dbType: v})}
                                    options={[
                                        { value: 'mysql', label: 'MySQL' },
                                        { value: 'oceanbase', label: 'OceanBase' },
                                        { value: 'h2', label: 'H2' },
                                    ]}
                                />
                            </div>

                            {/* 显示名 */}
                            <div>
                                <LabeledInput
                                    label="显示名"
                                    value={form.name}
                                    onChange={(v) => setForm({...form, name: v})}
                                    placeholder="例如：业务库-MySQL"
                                />
                            </div>

                            {/* JDBC URL（单独占一行） */}
                            <div className="md:col-span-2">
                                <LabeledInput
                                    label="JDBC URL"
                                    value={form.jdbcUrl}
                                    onChange={(v) => setForm({...form, jdbcUrl: v})}
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
                                <LabeledInput
                                    label="用户名"
                                    value={form.username}
                                    onChange={(v) => setForm({...form, username: v})}
                                    placeholder="root"
                                />
                            </div>

                            {/* 密码 */}
                            <div>
                                <LabeledInput
                                    label="密码"
                                    value={form.passwordEnc}
                                    onChange={(v) => setForm({...form, passwordEnc: v})}
                                />
                            </div>
                        </div>

                        <div className="mt-4 flex justify-end gap-2">
                            <button onClick={() => setVisible(false)}
                                    className="px-3.5 py-2 rounded-lg border text-sm bg-white border-gray-200 hover:bg-gray-50">
                                取消
                            </button>
                            <button onClick={save}
                                    className="px-3.5 py-2 rounded-lg text-white text-sm bg-blue-600 hover:bg-blue-700">
                                {isEdit ? '保存' : '创建'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
