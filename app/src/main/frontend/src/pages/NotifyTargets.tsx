// src/pages/NotifyTargets.tsx
// 中文注释：通知方式管理（列表行样式 + 弹窗，新建/修改）
// 风格与“服务器管理/数据库管理”一致，去卡片化，用白底列表 + 分割线

import {useEffect, useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
import {api} from '@/utils/api';
import LabeledInput from '@/components/LabeledInput';
import LabeledTextArea from '@/components/LabeledTextArea';

type NotifyTarget = {
    id?: number;
    /** 显示名称 */
    name: string;
    /** 用户名称（可与系统用户映射） */
    username: string;
    /** 通知方式，PHONE、EMAIL等 */
    notifyType: string;
    /** 通知方式内容，如手机号、邮箱地址 */
    notifyTypeContent: string;
    /** 是否禁用 */
    disabled: boolean;
    /** 是否已校验 */
    verified: boolean;
    /** 备注 */
    descText?: string;
};

const emptyForm: NotifyTarget = {
    name: '',
    username: '',
    notifyType: '',
    notifyTypeContent: '',
    disabled: false,
    verified: false,
    descText: '',
};

export default function NotifyTargets() {
    // 中文注释：列表与加载
    const [list, setList] = useState<NotifyTarget[]>([]);
    const [loading, setLoading] = useState(false);

    // 中文注释：弹窗与表单
    const [visible, setVisible] = useState(false);
    const [form, setForm] = useState<NotifyTarget>(emptyForm);
    const isEdit = useMemo(() => form.id != null, [form.id]);

    // 中文注释：加载列表
    const load = async () => {
        setLoading(true);
        try {
            const data = await api.get<NotifyTarget[]>('/api/notifyTarget/list');
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
        setForm({...emptyForm});
        setVisible(true);
    };

    // 中文注释：打开编辑
    const openEdit = (row: NotifyTarget) => {
        setForm({
            id: row.id,
            name: row.name ?? '',
            username: row.username ?? '',
            notifyType: row.notifyType ?? '',
            notifyTypeContent: row.notifyTypeContent ?? '',
            disabled: !!row.disabled,
            verified: !!row.verified,
            descText: row.descText ?? '',
        });
        setVisible(true);
    };

    // 中文注释：校验
    const validate = (v: NotifyTarget, isEdit: boolean): string | null => {
        if (!v.name?.trim()) return '显示名称不能为空';
        if (!v.username?.trim()) return '用户名称不能为空';

        // 中文注释：如果是“编辑且已校验”，notifyType/notifyTypeContent 已禁用，不再强制校验其格式
        const immutable = isEdit && !!v.verified;

        if (!immutable) {
            if (!v.notifyType?.trim()) return '通知方式不能为空（例如：PHONE/EMAIL）';
            if (!v.notifyTypeContent?.trim()) return '通知方式内容不能为空（例如：手机号/邮箱）';

            if (v.notifyType.toUpperCase() === 'EMAIL') {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(v.notifyTypeContent.trim())) return '邮箱格式不合法，请检查';
            }
            if (v.notifyType.toUpperCase() === 'PHONE') {
                const phoneRegex = /^1\d{10}$/; // 中文注释：示例为中国大陆手机号，可按需调整
                if (!phoneRegex.test(v.notifyTypeContent.trim())) return '手机号格式不合法，请检查';
            }
        }

        return null;
    };

    // 中文注释：保存（新增/更新）
    const save = async () => {
        const err = validate(form, isEdit);
        if (err) {
            alert(err);
            return;
        }
        const payload: NotifyTarget = {
            id: form.id,
            name: form.name.trim(),
            username: form.username.trim(),
            notifyType: form.notifyType.trim(),
            notifyTypeContent: form.notifyTypeContent.trim(),
            disabled: !!form.disabled,
            verified: !!form.verified,
            descText: form.descText?.trim() || undefined,
        };
        await api.post('/api/notifyTarget/save', payload);
        setVisible(false);
        await load();
    };

    // 中文注释：弹窗 ESC 关闭
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

    // 中文注释：状态徽标
    const badge = (ok: boolean, okText: string, noText: string, okCls: string, noCls: string) => (
        <span className={`text-[11px] px-2 py-0.5 rounded-full border ${ok ? okCls : noCls}`}>
      {ok ? okText : noText}
    </span>
    );

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            {/* 顶部导航（统一样式） */}
            <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-gray-100 shadow-sm">
                <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
                    <h1 className="text-xl font-bold">通知方式管理</h1>
                    <nav className="text-sm text-gray-600">
                        <Link to="/" className="hover:text-gray-900">首页</Link>
                        <span className="mx-3">·</span>
                        <Link to="/servers" className="hover:text-gray-900">服务器</Link>
                        <span className="mx-3">·</span>
                        <Link to="/databases" className="hover:text-gray-900">数据库</Link>
                        <span className="mx-3">·</span>
                        <Link to="/checks" className="hover:text-gray-900">任务</Link>
                    </nav>
                </div>
            </header>

            {/* 主体：行列表（非卡片） */}
            <main className="flex-1 overflow-y-auto">
                <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
                    {/* 操作区 */}
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                            共 <span className="font-semibold text-gray-700">{list.length}</span> 条
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={openCreate}
                                className="px-3.5 py-2 rounded-lg text-white text-sm bg-blue-600 hover:bg-blue-700"
                            >
                                新增
                            </button>
                            <button
                                onClick={load}
                                className="px-3.5 py-2 rounded-lg text-sm bg-white border border-gray-200 hover:bg-gray-50"
                            >
                                刷新
                            </button>
                        </div>
                    </div>

                    {/* 表头 */}
                    <div className="hidden md:grid md:grid-cols-12 text-xs text-gray-500 px-2 py-2">
                        <div className="col-span-2 text-left">名称 / 用户名</div>
                        <div className="col-span-3 text-left">通知方式 / 内容</div>
                        <div className="col-span-3 text-left">备注</div>
                        <div className="col-span-2 text-center">状态</div>
                        <div className="col-span-2 text-center">操作</div>
                    </div>

                    {/* 列表区：白底 + 分割线 */}
                    <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-200">
                        {loading && <div className="px-3 py-3 text-sm text-gray-500">加载中...</div>}
                        {!loading && list.length === 0 && (
                            <div className="px-3 py-3 text-sm text-gray-500">暂无数据</div>
                        )}
                        {list.map(row => (
                            <div
                                key={row.id}
                                className="px-3 py-3 md:grid md:grid-cols-12 md:gap-3 text-sm items-center"
                            >
                                {/* 名称/用户名（值保持不变） */}
                                <div className="md:col-span-2">
                                    <div className="font-medium text-gray-800 line-clamp-1">
                                        #{row.id} {row.name}
                                    </div>
                                    <div className="text-xs text-gray-500">user: {row.username}</div>
                                </div>

                                {/* 通知方式/内容（值保持不变） */}
                                <div className="md:col-span-3">
                                    <div className="flex items-center gap-2">
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
            {row.notifyType || '—'}
          </span>
                                    </div>
                                    <div className="mt-1 text-xs text-gray-600 break-all">
                                        {row.notifyTypeContent}
                                    </div>
                                </div>

                                {/* 备注：单行 + 超出省略号 */}
                                <div className="md:col-span-3 text-xs text-gray-600 flex items-center">
                                    <div className="truncate w-full">{row.descText || '—'}</div>
                                </div>

                                {/* 状态：水平+垂直居中 */}
                                <div className="md:col-span-2 flex items-center justify-center gap-2">
                                    {badge(
                                        !row.disabled,
                                        '启用',
                                        '禁用',
                                        'bg-emerald-50 text-emerald-700 border-emerald-100',
                                        'bg-gray-100 text-gray-500 border-gray-200'
                                    )}
                                    {badge(
                                        !!row.verified,
                                        '已校验',
                                        '未校验',
                                        'bg-blue-50 text-blue-700 border-blue-100',
                                        'bg-gray-100 text-gray-500 border-gray-200'
                                    )}
                                </div>

                                {/* 操作：水平+垂直居中 */}
                                <div className="md:col-span-2 flex items-center justify-center">
                                    <button
                                        onClick={() => openEdit(row)}
                                        className="px-3 py-1.5 rounded-lg border text-sm bg-white border-gray-200 hover:bg-gray-50"
                                    >
                                        编辑
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            </main>

            {/* 底部页脚（统一） */}
            <footer className="shrink-0 bg-white border-t border-gray-100 drop-shadow-md">
                <div className="mx-auto max-w-6xl px-4 py-3 text-xs text-gray-500 flex items-center justify-between">
                    <span>v1.0 · 内部工具</span>
                    <span className="space-x-3">
            <Link to="/" className="hover:text-gray-800">首页</Link>
            <Link to="/servers" className="hover:text-gray-800">服务器</Link>
            <Link to="/databases" className="hover:text-gray-800">数据库</Link>
            <Link to="/checks" className="hover:text-gray-800">任务</Link>
          </span>
                </div>
            </footer>

            {/* 弹窗 */}
            {visible && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45">
                    <div className="w-[760px] max-w-[94vw] bg-white rounded-2xl shadow-2xl p-4">
                        {/* 标题 */}
                        <div className="flex items-center justify-between mb-3">
                            <div className="font-semibold">{isEdit ? '编辑通知对象' : '新增通知对象'}</div>
                            <button
                                onClick={() => setVisible(false)}
                                className="w-8 h-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
                            >×
                            </button>
                        </div>

                        {/* 表单 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <LabeledInput
                                    label="显示名称"
                                    value={form.name}
                                    onChange={(v) => setForm({...form, name: v})}
                                    placeholder="如：运维同学-张三"
                                />
                            </div>
                            <div>
                                <LabeledInput
                                    label="用户名称"
                                    value={form.username}
                                    onChange={(v) => setForm({...form, username: v})}
                                    placeholder="如：zhangsan"
                                />
                            </div>

                            {/* 中文注释：通知方式（当编辑且 verified=true 时禁用） */}
                            <div>
                                <label className="block mb-2 text-xs text-gray-500">通知方式</label>
                                <select
                                    value={form.notifyType}
                                    onChange={(e) => setForm({ ...form, notifyType: e.target.value })}
                                    disabled={isEdit && !!form.verified} // ⭐ 禁用条件
                                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500
      ${isEdit && form.verified ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'border-gray-300'}`}
                                >
                                    <option value="">请选择</option>
                                    <option value="EMAIL">EMAIL</option>
                                    <option value="PHONE">PHONE</option>
                                    {/* 其他类型可追加 */}
                                </select>
                                {(isEdit && form.verified) && (
                                    <div className="text-xs text-gray-400 mt-1">该通知对象已校验，通知方式不可修改</div>
                                )}
                            </div>

                            {/* 中文注释：通知方式内容（当编辑且 verified=true 时禁用） */}
                            <div>
                                <label className="block mb-2 text-xs text-gray-500">通知方式内容</label>
                                <input
                                    value={form.notifyTypeContent}
                                    onChange={(e) => setForm({ ...form, notifyTypeContent: e.target.value })}
                                    disabled={isEdit && !!form.verified} // ⭐ 禁用条件
                                    placeholder={form.notifyType?.toUpperCase() === 'EMAIL' ? 'user@example.com' :
                                        form.notifyType?.toUpperCase() === 'PHONE' ? '11位手机号' : '手机号/邮箱/Hook 等'}
                                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500
      ${isEdit && form.verified ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'border-gray-300'}`}
                                />
                                {(isEdit && form.verified) && (
                                    <div className="text-xs text-gray-400 mt-1">该通知对象已校验，通知方式内容不可修改</div>
                                )}
                            </div>

                            <div>
                                <label className="block mb-2 text-xs text-gray-500">是否启用</label>
                                <select
                                    value={form.disabled ? '1' : '0'}
                                    onChange={(e) => setForm({...form, disabled: e.target.value === '1'})}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="0">启用</option>
                                    <option value="1">禁用</option>
                                </select>
                            </div>

                            {/* 中文注释：校验状态（仅展示，不可编辑；无 label；大号徽章，和左侧启用/禁用控件等高） */}
                            <div className="flex flex-col justify-end">
                                <div
                                    className={`inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium border
      ${form.verified
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : 'bg-rose-50 text-rose-700 border-rose-200'
                                    }`}
                                    title={form.verified ? '该通知对象已完成校验' : '该通知对象尚未校验'}
                                >
                                    {form.verified ? '已校验' : '未校验'}
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <LabeledTextArea
                                    label="备注"
                                    value={form.descText || ''}
                                    onChange={(v) => setForm({...form, descText: v})}
                                    rows={3}
                                    placeholder="例如：仅在高优先级任务失败时通知"
                                />
                            </div>
                        </div>

                        {/* 底部按钮 */}
                        <div className="mt-4 text-right">
                            <button
                                onClick={() => setVisible(false)}
                                className="px-3.5 py-2 rounded-lg border text-sm bg-white border-gray-200 hover:bg-gray-50 mr-2"
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