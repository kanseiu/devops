// 中文注释：通知配置弹窗（样式优化版）
// 说明：仅样式与结构优化，数据请求与保存请用你现有逻辑替换“TODO”部分。

import {useEffect, useMemo, useState} from 'react';
import {api} from '@/utils/api';

// ========= 类型定义（与后端保持一致） =========
type DevCronJobNotify = {
    id?: number;
    devCronJobId: number;
    devNotifyTargetId: number;
    notifyOnStatus: string;              // 逗号分隔，例如 FAIL,TIMEOUT,ERROR
    disabled?: boolean;
    // 展示字段（来自 DevNotifyTarget）
    username?: string;
    notifyType?: string;
    notifyTypeContent?: string;
    descText?: string;
};

type DevNotifyTarget = {
    id: number;
    name: string;
    username: string;
    notifyType: string;                  // EMAIL / PHONE ...
    notifyTypeContent: string;
    disabled?: boolean;
    verified?: boolean;
    descText?: string;
};

const ALL_STATUS = ['FAIL', 'TIMEOUT', 'ERROR'] as const;
type StatusKey = typeof ALL_STATUS[number];

export default function NotifyConfigModal({
                                              jobId,
                                              onClose
                                          }: {
    jobId: number;
    onClose: () => void;
}) {
    // ============ ESC 关闭 ============
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    // ============ 上半区表单状态 ============
    const [editing, setEditing] = useState<DevCronJobNotify>({
        devCronJobId: jobId,
        devNotifyTargetId: 0,
        notifyOnStatus: '',
        disabled: false,
    });

    const isEdit = useMemo(() => !!editing.id, [editing.id]);

    // 下拉：可选通知对象
    const [targets, setTargets] = useState<DevNotifyTarget[]>([]);
    // 下半区：已配置列表
    const [list, setList] = useState<DevCronJobNotify[]>([]);
    const [loadingList, setLoadingList] = useState(false);
    const [saving, setSaving] = useState(false);

    // ============ 加载可选通知对象 & 已配置列表 ============
    const loadTargets = async () => {
        // 中文注释：可选通知对象（新增时需要；编辑时也用于显示）
        const data = await api.get<DevNotifyTarget[]>(`/api/cronJobNotify/couldSelectNotifyTarget/${jobId}`);
        setTargets(Array.isArray(data) ? data : []);
    };
    const loadList = async () => {
        setLoadingList(true);
        try {
            const data = await api.get<DevCronJobNotify[]>(`/api/cronJobNotify/listByJobId/${jobId}`);
            setList(Array.isArray(data) ? data : []);
        } finally {
            setLoadingList(false);
        }
    };

    useEffect(() => {
        loadTargets();
        loadList();
    }, [jobId]);

    // ============ 工具：状态多选切换 ============
    const statusSet = useMemo<Set<string>>(
        () => new Set((editing.notifyOnStatus || '').split(',').map(s => s.trim()).filter(Boolean)),
        [editing.notifyOnStatus]
    );
    const toggleStatus = (key: StatusKey) => {
        const s = new Set(statusSet);
        if (s.has(key)) s.delete(key); else s.add(key);
        setEditing({...editing, notifyOnStatus: Array.from(s).join(',')});
    };

    // ============ 选择行进行编辑 ============
    const pickForEdit = (row: DevCronJobNotify) => {
        // 中文注释：编辑场景下，仅可修改 notifyOnStatus/disabled；其他字段锁定（下方 UI 已处理）
        setEditing({
            id: row.id,
            devCronJobId: row.devCronJobId,
            devNotifyTargetId: row.devNotifyTargetId,
            notifyOnStatus: row.notifyOnStatus || '',
            disabled: !!row.disabled,
        });
    };

    // ============ 重置为新增 ============
    const resetCreate = () => {
        setEditing({
            devCronJobId: jobId,
            devNotifyTargetId: 0,
            notifyOnStatus: '',
            disabled: false,
        });
    };

    // ============ 保存（新增/更新） ============
    const canSave = useMemo(() => {
        // 中文注释：新增时必须选通知对象，且至少选择一个触发状态；编辑时仅校验触发状态
        const hasStatus = statusSet.size > 0;
        if (isEdit) return hasStatus;
        return editing.devNotifyTargetId > 0 && hasStatus;
    }, [isEdit, editing.devNotifyTargetId, statusSet]);

    const save = async () => {
        if (!canSave || saving) return;
        setSaving(true);
        try {
            const payload: DevCronJobNotify = {
                id: editing.id,
                devCronJobId: jobId,
                devNotifyTargetId: editing.devNotifyTargetId,
                notifyOnStatus: editing.notifyOnStatus || '',
                disabled: !!editing.disabled,
            };
            await api.post('/api/cronJobNotify/save', payload);
            await Promise.all([loadList(), loadTargets()]);
            if (isEdit) {
                // 中文注释：编辑后保持当前态（已保存的新状态）
            } else {
                // 中文注释：新增后清空回新增态
                resetCreate();
            }
        } finally {
            setSaving(false);
        }
    };

    // ============ 派生：展示当前 target 信息（便于只读提示） ============
    const currentTarget = useMemo(
        () => targets.find(t => t.id === editing.devNotifyTargetId),
        [targets, editing.devNotifyTargetId]
    );

    // ============ UI ============

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45">
            <div className="w-[980px] max-w-[96vw] bg-white rounded-2xl shadow-2xl p-4">
                {/* 标题栏 */}
                <div className="flex items-center justify-between mb-4">
                    <div className="font-semibold">{isEdit ? '编辑通知配置' : '新增通知配置'}</div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={save}
                            disabled={!canSave || saving}
                            className={`px-3.5 py-2 rounded-lg text-white text-sm transition
              ${(!canSave || saving) ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                        >
                            {saving ? '保存中…' : '保存'}
                        </button>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
                        >×</button>
                    </div>
                </div>

                {/* 上半区：编辑表单 */}
                <section className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                        {/* 通知对象（新增可选，编辑只读提示） */}
                        <div className="min-w-0">
                            <div className="text-xs text-gray-500 mb-2">通知对象</div>
                            {isEdit ? (
                                // 中文注释：编辑态显示只读卡片
                                <div className="p-3 rounded-xl border border-gray-200 bg-white">
                                    <div className="text-sm font-medium text-gray-800">
                                        {currentTarget
                                            ? `${currentTarget.name}（${currentTarget.username}）`
                                            : '（已配置的通知对象）'}
                                    </div>
                                    <div className="mt-1 text-xs text-gray-500">
                                        {currentTarget
                                            ? `${currentTarget.notifyType} · ${currentTarget.notifyTypeContent}`
                                            : 'ID: ' + editing.devNotifyTargetId}
                                    </div>
                                </div>
                            ) : (
                                <select
                                    value={editing.devNotifyTargetId || 0}
                                    onChange={e => setEditing({...editing, devNotifyTargetId: Number(e.target.value)})}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value={0}>请选择通知对象</option>
                                    {targets.map(t => (
                                        <option key={t.id} value={t.id}>
                                            {t.name}（{t.username}） · {t.notifyType}:{t.notifyTypeContent}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {/* 启用状态切换（新增/编辑都可改） */}
                        <div className="min-w-0">
                            <div className="text-xs text-gray-500 mb-2">是否启用</div>
                            <select
                                value={editing.disabled ? '1' : '0'}
                                onChange={e => setEditing({...editing, disabled: e.target.value === '1'})}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="0">启用</option>
                                <option value="1">禁用</option>
                            </select>
                        </div>

                        {/* 触发状态（多选 Chip） */}
                        <div className="md:col-span-2">
                            <div className="text-xs text-gray-500 mb-2">触发状态（多选）</div>
                            <div className="flex flex-wrap gap-2">
                                {ALL_STATUS.map(k => {
                                    const active = statusSet.has(k);
                                    const base =
                                        'px-3 py-1 rounded-full text-xs border transition select-none cursor-pointer';
                                    const on =
                                        'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100';
                                    const off =
                                        'bg-white text-gray-600 border-gray-200 hover:bg-gray-50';
                                    return (
                                        <button
                                            key={k}
                                            type="button"
                                            onClick={() => toggleStatus(k)}
                                            className={`${base} ${active ? on : off}`}
                                        >
                                            {k}
                                        </button>
                                    );
                                })}
                            </div>
                            {/* 新增态：重置/编辑态：返回新增 */}
                            <div className="mt-3">
                                {isEdit ? (
                                    <button
                                        onClick={resetCreate}
                                        className="text-xs px-2.5 py-1.5 rounded-lg border bg-white border-gray-200 hover:bg-gray-50"
                                    >
                                        新增另一个通知对象
                                    </button>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </section>

                {/* 下半区：列表（固定可视高度，空态也占位） */}
                <section className="bg-white border border-gray-200 rounded-2xl">
                    {/* 表头（吸顶） */}
                    <div className="sticky top-0 bg-white/90 backdrop-blur rounded-t-2xl grid grid-cols-12 text-xs text-gray-500 px-3 py-2 border-b border-gray-200">
                        <div className="col-span-4">通知对象</div>
                        <div className="col-span-4">触发状态</div>
                        <div className="col-span-2 text-center">启用</div>
                        <div className="col-span-2 text-center">操作</div>
                    </div>

                    {/* 列表体 —— 设定固定高度：约 5 行（每行 ~56px） */}
                    <div className="min-h-[280px] max-h-[320px] overflow-y-auto rounded-b-2xl">
                        {loadingList ? (
                            // 中文注释：加载态骨架
                            <SkeletonRows />
                        ) : list.length === 0 ? (
                            // 中文注释：空态也占位同样高度
                            <div className="h-[280px] flex items-center justify-center text-sm text-gray-500">
                                暂无通知配置
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {list.map((row, idx) => (
                                    <div
                                        key={row.id || idx}
                                        className="grid grid-cols-12 items-center px-3 py-3 hover:bg-gray-50 transition"
                                    >
                                        {/* 通知对象 */}
                                        <div className="col-span-4 min-w-0">
                                            <div className="text-sm font-medium text-gray-800 truncate">
                                                {row.username || '—'}（{row.notifyType}）
                                            </div>
                                            <div className="text-xs text-gray-500 truncate">
                                                {row.notifyTypeContent || '—'}
                                            </div>
                                            {row.descText && (
                                                <div className="text-[11px] text-gray-400 truncate mt-0.5">
                                                    {row.descText}
                                                </div>
                                            )}
                                        </div>

                                        {/* 触发状态 */}
                                        <div className="col-span-4">
                                            <div className="flex flex-wrap gap-1.5">
                                                {splitStatus(row.notifyOnStatus).map(s => (
                                                    <span
                                                        key={`${row.id}-${s}`}
                                                        className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100"
                                                    >
                            {s}
                          </span>
                                                ))}
                                                {splitStatus(row.notifyOnStatus).length === 0 && (
                                                    <span className="text-xs text-gray-400">—</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* 启用 */}
                                        <div className="col-span-2 text-center">
                      <span className={`inline-flex items-center justify-center text-[11px] px-2 py-0.5 rounded-full border
                        ${row.disabled ? 'bg-gray-100 text-gray-500 border-gray-200' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
                        {row.disabled ? '禁用' : '启用'}
                      </span>
                                        </div>

                                        {/* 操作 */}
                                        <div className="col-span-2 text-center">
                                            <button
                                                onClick={() => pickForEdit(row)}
                                                className="px-3 py-1.5 rounded-lg border text-sm bg-white border-gray-200 hover:bg-gray-50"
                                            >
                                                编辑
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}

// ============ 小工具：切分 notifyOnStatus =============
function splitStatus(s?: string) {
    if (!s) return [];
    return s.split(',').map(x => x.trim()).filter(Boolean);
}

// ============ 小组件：骨架行（5 行） ============
function SkeletonRows() {
    // 中文注释：简单骨架屏，模拟 5 行
    return (
        <div className="divide-y divide-gray-100">
            {Array.from({length: 5}).map((_, i) => (
                <div key={i} className="grid grid-cols-12 items-center px-3 py-4">
                    <div className="col-span-4">
                        <div className="h-3 w-40 bg-gray-200 rounded mb-2" />
                        <div className="h-2.5 w-56 bg-gray-100 rounded" />
                    </div>
                    <div className="col-span-4">
                        <div className="h-6 w-24 bg-gray-100 rounded inline-block mr-2" />
                        <div className="h-6 w-20 bg-gray-100 rounded inline-block" />
                    </div>
                    <div className="col-span-2 flex justify-center">
                        <div className="h-5 w-14 bg-gray-100 rounded" />
                    </div>
                    <div className="col-span-2 flex justify-center">
                        <div className="h-8 w-16 bg-gray-100 rounded" />
                    </div>
                </div>
            ))}
        </div>
    );
}