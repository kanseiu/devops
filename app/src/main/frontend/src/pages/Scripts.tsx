// 中文注释：脚本管理页面（Tailwind 风格，统一导航/卡片/弹窗）
import { useEffect, useMemo, useState } from 'react';
import { api } from '@/utils/api';
import LabeledInput from '@/components/LabeledInput';
import LabeledTextArea from '@/components/LabeledTextArea';
import LabeledSelect from '@/components/LabeledSelect';
import AppHeader from '@/components/AppHeader';
import AppFooter from '@/components/AppFooter';
import {useConfirm} from '@/components/ConfirmDialog';

type DevScript = {
    id?: number;
    scriptName: string;
    scriptType?: 'SHELL' | 'SQL';
    scriptContent: string;
    workDir?: string;
    disabled?: boolean;
    descText?: string;
    createTime?: string | number;
    updateTime?: string | number;
};

const emptyForm: DevScript = {
    scriptName: '',
    scriptType: undefined,
    scriptContent: '',
    workDir: '',
    disabled: false,
    descText: '',
};

export default function DevScripts() {
    const [list, setList] = useState<DevScript[]>([]);
    const [loading, setLoading] = useState(false);

    const [visible, setVisible] = useState(false);
    const [form, setForm] = useState<DevScript>(emptyForm);
    const isEdit = useMemo(() => form.id != null, [form.id]);
    const confirm = useConfirm();

    const fmtTime = (s: string | number | undefined) => {
        if (!s) return '';
        try {
            if (typeof s === 'number') return new Date(s).toLocaleString();
            return new Date(String(s).replace(' ', 'T')).toLocaleString();
        } catch {
            return String(s);
        }
    };

    const load = async () => {
        setLoading(true);
        try {
            const data = await api.get<DevScript[]>('/api/devScript/list');
            setList(Array.isArray(data) ? data : []);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const openCreate = () => {
        setForm({ ...emptyForm });
        setVisible(true);
    };

    const openEdit = (row: DevScript) => {
        setForm({
            id: row.id,
            scriptName: row.scriptName ?? '',
            scriptType: row.scriptType,
            scriptContent: row.scriptContent ?? '',
            workDir: row.workDir ?? '',
            disabled: !!row.disabled,
            descText: row.descText ?? '',
        });
        setVisible(true);
    };

    const validate = (v: DevScript): string | null => {
        if (!v.scriptName?.trim()) return '脚本名称不能为空';
        if (!v.scriptType) return '脚本类型必须选择';
        if (!v.scriptContent?.trim()) return '脚本内容不能为空';
        return null;
    };

    const save = async () => {
        const err = validate(form);
        if (err) {
            alert(err);
            return;
        }
        const payload: DevScript = {
            id: form.id,
            scriptName: form.scriptName.trim(),
            scriptType: form.scriptType,
            scriptContent: normalizeUnixNewline(form.scriptContent),
            workDir: form.workDir?.trim() || undefined,
            disabled: !!form.disabled,
            descText: form.descText?.trim() || undefined,
        };
        await api.post('/api/devScript/save', payload);
        setVisible(false);
        await load();
    };

    const remove = async (row: DevScript) => {
        if (!row?.id) return;
        const first = await confirm({
            title: '确认删除',
            message: `确认删除脚本 #${row.id} ${row.scriptName}？`,
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
        await api.post(`/api/devScript/delete/${row.id}`, {});
        await load();
    };

    const normalizeUnixNewline = (s: string) => s.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

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
        <div className="app-shell flex flex-col h-screen">
            {/* 顶部导航 */}
            <AppHeader title="脚本管理" />

            {/* 主体 */}
            <main className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
                    {/* 操作区 */}
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                            共 <span className="font-semibold text-gray-700">{list.length}</span> 个脚本
                        </div>
                        <div>
                            <button
                                onClick={openCreate}
                                className="px-3.5 py-2 rounded-lg text-white text-sm bg-blue-600 hover:bg-blue-700"
                            >
                                新建
                            </button>
                        </div>
                    </div>

                    {/* 列表 */}
                    {loading && <div className="text-sm text-gray-500">加载中...</div>}

                    {!loading && list.length === 0 && (
                        <div className="bg-white rounded-2xl shadow-card p-8 text-center text-gray-500">
                            暂无数据
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {list.map((row) => (
                            <div
                                key={row.id}
                                className="bg-white flex flex-col border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-cardHover transition"

                            >
                                {/* 标题 + 类型 */}
                                <div className="flex items-center justify-between mb-1">
                                    <div className="font-semibold">
                                        #{row.id} {row.scriptName}
                                    </div>
                                    <span
                                        className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                            row.scriptType === 'SQL'
                                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                                : row.scriptType === 'SHELL'
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-gray-100 text-gray-500 border border-gray-200'
                                        }`}
                                    >
        {row.scriptType || '未指定'}
      </span>
                                </div>

                                {/* 状态 / 目录 / 更新时间 */}
                                <div className="text-xs text-gray-500 mb-3 space-x-3">
      <span>
        状态：
          {row.disabled ? (
              <b className="text-gray-400">已禁用</b>
          ) : (
              <b className="text-emerald-600">启用中</b>
          )}
      </span>
                                    <span>
        目录：
                                        {row.workDir || <span className="text-gray-400">(未设置)</span>}
      </span>
                                    <span>更新时间：{fmtTime(row.updateTime)}</span>
                                </div>

                                {/* 内容预览 */}
                                <div className="flex-1 whitespace-pre-wrap bg-gray-50 border border-gray-100 rounded-lg p-2 text-xs font-mono text-gray-800">
                                    {(row.scriptContent || '').slice(0, 200)}
                                    {row.scriptContent && row.scriptContent.length > 200 ? ' …' : ''}
                                </div>

                                {/* 操作 */}
                                <div className="mt-3 flex items-center justify-between gap-2">
                                    <button
                                        onClick={() => remove(row)}
                                        className="px-3 py-1.5 rounded-lg text-white text-sm bg-rose-600 hover:bg-rose-700"
                                    >
                                        删除
                                    </button>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => openEdit(row)}
                                            className="px-3 py-1.5 rounded-lg border text-sm bg-white border-gray-200 hover:bg-gray-50"
                                        >
                                            编辑
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </main>

            {/* 底部页脚（固定高度，始终可见） */}
            <AppFooter />

            {/* 弹窗 */}
            {visible && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45">
                    <div className="w-[760px] max-w-[94vw] bg-white rounded-2xl shadow-2xl p-4">
                        {/* 标题行 */}
                        <div className="flex items-center justify-between mb-3">
                            <div className="font-semibold">{isEdit ? '编辑' : '新建'}</div>
                            <button
                                onClick={() => setVisible(false)}
                                className="w-8 h-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
                            >
                                ×
                            </button>
                        </div>

                        {/* 表单 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <LabeledInput
                                    label="脚本名称"
                                    value={form.scriptName}
                                    onChange={(v) => setForm({ ...form, scriptName: v })}
                                    placeholder="例如：restart-nginx"
                                    disabled={isEdit}
                                />
                            </div>
                            <div>
                                <LabeledInput
                                    label="工作目录"
                                    value={form.workDir || ''}
                                    onChange={(v) => setForm({ ...form, workDir: v })}
                                    placeholder="/ 或 /opt/app"
                                />
                            </div>

                            {/* 脚本类型 */}
                            <div className="md:col-span-2">
                                <LabeledSelect
                                    label="脚本类型"
                                    value={form.scriptType ?? ''}
                                    onChange={(v) => setForm({ ...form, scriptType: v as 'SHELL' | 'SQL' })}
                                    options={[
                                        { value: 'SHELL', label: 'SHELL' },
                                        { value: 'SQL', label: 'SQL' },
                                    ]}
                                    disabled={isEdit}
                                    placeholder="请选择脚本类型"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <LabeledSelect
                                    label="是否禁用"
                                    value={form.disabled ? '1' : '0'}
                                    onChange={(e) => setForm({ ...form, disabled: e.target.value === '1' })}
                                    options={[
                                        { value: '0', label: '启用' },
                                        { value: '1', label: '禁用' },
                                    ]}
                                />
                            </div>

                            <div className="md:col-span-2">
                                <LabeledInput
                                    label="描述"
                                    value={form.descText || ''}
                                    onChange={(v) => setForm({ ...form, descText: v })}
                                    placeholder="简要说明用途"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <LabeledTextArea
                                    label="脚本内容"
                                    value={form.scriptContent}
                                    onChange={(v) => setForm({...form, scriptContent: v})}
                                    placeholder={`#!/bin/bash\nsystemctl restart nginx && systemctl status nginx --no-pager`}
                                    rows={14}
                                />
                            </div>
                        </div>

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
