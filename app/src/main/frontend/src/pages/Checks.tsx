// 中文注释：定时任务维护（Hutool Cron）- Tailwind 统一风格 + jobType 区分 SHELL/SQL
import {useEffect, useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
import {api} from '@/utils/api';
import {showGeekOverlay} from '@/components/toast';
import LabeledInput from '@/components/LabeledInput';
import LabeledTextArea from '@/components/LabeledTextArea';
import LabeledSelect from '@/components/LabeledSelect'; // ★ 新增：统一风格的下拉
import NotifyConfigModal from '@/components/NotifyConfigModal';

// ======== 类型定义 ========
type Server = { id: number; name?: string; host?: string; port?: number; };
type Database = { id: number; name: string; jdbcUrl?: string }; // ★ 新增：数据库最小字段
type DevScript = { id: number; scriptName: string; scriptType?: 'SHELL' | 'SQL' }; // ★ 增加 scriptType

type JobItem = {
    id?: number;
    jobName: string;
    cronExpr: string;
    jobType?: 'SHELL' | 'SQL';         // ★ 新增：任务类型（必选）
    scriptName: string;
    serverId?: number;                 // SHELL 使用
    databaseId?: number;               // SQL 使用（★ 新增）
    argsText?: string;
    timeoutSec?: number;
    disabled?: boolean;
    descText?: string;
    nextRunTime?: string | number;
    status?: 'RUNNING' | 'PAUSED' | 'READY' | 'DISABLED';
};

// 定时任务执行日志（保持不动）
type DevCronJobLog = {
    id: number;
    jobId: number;
    connectInfo: string;
    scriptName: string;
    scriptContent: string;
    argsText?: string | null;
    createTime?: string;
    startTime?: string;
    endTime?: string;
    durationMs?: number;
    exitCode?: number | null;
    status?: 'SUCCESS' | 'FAIL' | 'TIMEOUT' | 'ERROR' | string;
    outputText?: string | null;
    errorText?: string | null;
};

// 表单初始值（jobType 无默认，必须选）
const emptyForm: JobItem = {
    jobName: '',
    cronExpr: '0 0 15 * * ?',
    jobType: undefined,   // ★ 必须选择
    scriptName: '',
    serverId: undefined,
    databaseId: undefined,
    argsText: '',
    timeoutSec: 300,
    disabled: false,
    descText: '',
};

export default function HutoolCronJobs() {
    // 列表与加载状态
    const [list, setList] = useState<JobItem[]>([]);
    const [loading, setLoading] = useState(false);

    // 下拉选项
    const [servers, setServers] = useState<Server[]>([]);
    const [databases, setDatabases] = useState<Database[]>([]); // ★ 新增：数据库列表
    const [scripts, setScripts] = useState<DevScript[]>([]);

    // 弹窗与表单
    const [visible, setVisible] = useState(false);
    const [form, setForm] = useState<JobItem>(emptyForm);
    const isEdit = useMemo(() => form.id != null, [form.id]);

    // 日志弹窗状态
    const [logVisible, setLogVisible] = useState(false);
    const [logLoading, setLogLoading] = useState(false);
    const [logJob, setLogJob] = useState<JobItem | null>(null);
    const [logs, setLogs] = useState<DevCronJobLog[]>([]);
    const [notifyModalJobId, setNotifyModalJobId] = useState<number | null>(null);

    // ========= 工具：时间格式化 =========
    const fmtTime = (s?: string | number) => {
        if (!s) return '';
        try {
            if (typeof s === 'number') return new Date(s).toLocaleString();
            return new Date(String(s).replace(' ', 'T')).toLocaleString();
        } catch { return String(s); }
    };
    const fmtDur = (ms?: number) => {
        if (ms == null) return '';
        if (ms < 1000) return `${ms}ms`;
        const sec = Math.round(ms / 1000);
        if (sec < 60) return `${sec}s`;
        const m = Math.floor(sec / 60), s = sec % 60;
        return `${m}m ${s}s`;
    };
    const statusBadge = (st?: string) => {
        switch (st) {
            case 'SUCCESS': return 'bg-emerald-50 text-emerald-700';
            case 'FAIL':    return 'bg-rose-50 text-rose-700';
            case 'TIMEOUT': return 'bg-amber-50 text-amber-700';
            case 'ERROR':   return 'bg-gray-100 text-gray-600';
            default:        return 'bg-gray-100 text-gray-600';
        }
    };

    // ========= 过滤脚本：根据 jobType 显示 =========
    const filteredScripts = useMemo(() => {
        if (!form.jobType) return [];
        return scripts.filter(s => (s.scriptType || 'SHELL') === form.jobType);
    }, [scripts, form.jobType]);

    // ========= 加载数据 =========
    const loadAll = async () => {
        setLoading(true);
        try {
            const jobs = await api.get<JobItem[]>('/api/cron/jobs');
            setList(Array.isArray(jobs) ? jobs : []);

            const svs = await api.get<Server[]>('/api/servers/list');
            setServers(Array.isArray(svs) ? svs : []);

            const scs = await api.get<DevScript[]>('/api/devScript/list');
            setScripts(Array.isArray(scs) ? scs : []);

            const dbs = await api.get<Database[]>('/api/databases/list'); // ★ 加载数据库
            setDatabases(Array.isArray(dbs) ? dbs : []);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => { loadAll(); }, []);

    // ========= 日志 =========
    const openLogs = async (row: JobItem) => {
        if (!row?.id) return;
        setLogJob(row);
        setLogVisible(true);
        setLogLoading(true);
        try {
            const data = await api.get<DevCronJobLog[]>(`/api/cron/job/log/${row.id}`);
            setLogs(Array.isArray(data) ? data : []);
        } finally {
            setLogLoading(false);
        }
    };

    // 中文注释：“通知配置”按钮点击事件（放在操作函数区）
    const openNotifyConfig = (jobId?: number) => {
        if (!jobId) return;
        setNotifyModalJobId(jobId);
    };

    // ========= 弹窗 =========
    const openCreate = () => {
        setForm({ ...emptyForm });
        setVisible(true);
    };

    const openEdit = (row: JobItem) => {
        setForm({
            id: row.id,
            jobName: row.jobName ?? '',
            cronExpr: row.cronExpr ?? '',
            jobType: row.jobType, // ★ 带回 jobType
            scriptName: row.scriptName ?? '',
            serverId: row.serverId,
            databaseId: row.databaseId,
            argsText: row.argsText ?? '',
            timeoutSec: row.timeoutSec ?? 300,
            disabled: row.disabled === true,
            descText: row.descText ?? '',
        });
        setVisible(true);
    };

    // 当切换 jobType 时，重置依赖字段，避免脏数据
    useEffect(() => {
        setForm(prev => {
            // 新建时/切换时才需要重置，编辑场景禁止修改 jobType（见下方 disabled）
            return prev;
        });
    }, [form.jobType]);

    // ========= 保存与校验 =========
    const validate = (v: JobItem): string | null => {
        if (!v.jobName?.trim()) return '任务名称不能为空';
        if (!v.cronExpr?.trim()) return 'Cron 表达式不能为空';
        if (!v.jobType) return '任务类型必须选择（SHELL / SQL）';
        if (!v.scriptName?.trim()) return '脚本名称不能为空';
        if (v.jobType === 'SHELL') {
            if (!v.serverId || v.serverId <= 0) return '请选择目标服务器';
        } else if (v.jobType === 'SQL') {
            if (!v.databaseId || v.databaseId <= 0) return '请选择目标数据库';
        }
        if (v.timeoutSec != null && (v.timeoutSec <= 0 || v.timeoutSec > 86400)) return '超时需在 1~86400 秒';
        return null;
    };

    const save = async () => {
        const err = validate(form);
        if (err) { alert(err); return; }
        const payload: JobItem = {
            id: form.id,
            jobName: form.jobName.trim(),
            cronExpr: form.cronExpr.trim(),
            jobType: form.jobType,                    // ★ 传 jobType
            scriptName: form.scriptName.trim(),
            serverId: form.jobType === 'SHELL' ? Number(form.serverId) : undefined,   // ★ SHELL 用 serverId
            databaseId: form.jobType === 'SQL' ? Number(form.databaseId) : undefined, // ★ SQL 用 databaseId
            argsText: form.argsText?.trim() || undefined,
            timeoutSec: form.timeoutSec ?? 300,
            disabled: form.disabled,
            descText: form.descText?.trim() || undefined,
        };
        await api.post('/api/cron/job/save', payload);
        setVisible(false);
        await loadAll();
    };

    // ========= 执行一次（SSE） =========
    const runOnceStream = (row: JobItem) => {
        if (!row?.id) return;
        const title = `执行一次：#${row.id} ${row.jobName}`;
        const init = [
            `[meta] jobId=${row.id}`,
            `[meta] type=${row.jobType || '-'}`,
            `[meta] script=${row.scriptName}`,
            row.jobType === 'SQL'
                ? `[meta] databaseId=${row.databaseId ?? '-'}`
                : `[meta] serverId=${row.serverId ?? '-'}`,
            `[meta] cron=${row.cronExpr}`, ''
        ].join('\n');
        showGeekOverlay(title, init + '\n');

        const es = new EventSource(`/api/cron/job/runOnce/${row.id}/stream`);
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
        es.addEventListener('stderr', (e: any) => append(`[ERR] ${e.data}`));
        es.addEventListener('end', (e: any) => {
            append(`\n[done] exit=${e.data}`);
            es.close();
            loadAll();
        });
        es.onerror = () => {
            append('\n[error] 连接中断');
            try { es.close(); } catch {}
        };
    };

    // ========= 任务控制 =========
    const pause = async (id?: number) => { if (!id) return; await api.post(`/api/cron/job/pause/${id}`, {}); await loadAll(); };
    const resume = async (id?: number) => { if (!id) return; await api.post(`/api/cron/job/resume/${id}`, {}); await loadAll(); };
    const startScheduler = async () => { await api.post('/api/cron/start', {}); await loadAll(); };
    const stopScheduler = async () => { await api.post('/api/cron/stop', {}); await loadAll(); };
    const reloadJobs = async () => { await api.get('/api/cron/reload'); await loadAll(); };

    // 弹窗 ESC 关闭
    useEffect(() => {
        if (!visible) return;
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); setVisible(false); } };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [visible]);

    useEffect(() => {
        if (!logVisible) return;
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); setLogVisible(false); } };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [logVisible]);

    // ========= UI =========
    return (
        <div className="flex flex-col h-screen bg-gray-50">
            {/* 顶部导航 */}
            <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-gray-100 shadow-sm">
                <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
                    <h1 className="text-xl font-bold">定时任务维护</h1>
                    <nav className="text-sm text-gray-600">
                        <Link to="/" className="hover:text-gray-900">首页</Link>
                        <span className="mx-3">·</span>
                        <Link to="/servers" className="hover:text-gray-900">服务器</Link>
                        <span className="mx-3">·</span>
                        <Link to="/scripts" className="hover:text-gray-900">脚本</Link>
                        <span className="mx-3">·</span>
                        <Link to="/databases" className="hover:text-gray-900">数据库</Link>
                        <span className="mx-3">·</span>
                        <Link to="/notifyTargets" className="hover:text-gray-900">通知方式</Link>
                    </nav>
                </div>
            </header>

            {/* 主体 */}
            <main className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
                    {/* 操作区 */}
                    <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                        <div className="text-sm text-gray-500">
                            共 <span className="font-semibold text-gray-700">{list.length}</span> 个任务
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button onClick={openCreate}
                                    className="px-3.5 py-2 rounded-lg text-white text-sm bg-blue-600 hover:bg-blue-700">新建任务</button>
                            <button onClick={startScheduler}
                                    className="px-3.5 py-2 rounded-lg text-white text-sm bg-emerald-600 hover:bg-emerald-700">启动调度器</button>
                            <button onClick={stopScheduler}
                                    className="px-3.5 py-2 rounded-lg text-white text-sm bg-rose-600 hover:bg-rose-700">停止调度器</button>
                            <button onClick={reloadJobs}
                                    className="px-3.5 py-2 rounded-lg text-white text-sm bg-indigo-600 hover:bg-indigo-700">重载任务（DB）</button>
                        </div>
                    </div>

                    {/* 列表 */}
                    {loading && <div className="text-sm text-gray-500">加载中...</div>}
                    {!loading && list.length === 0 && (
                        <div className="bg-white rounded-2xl shadow-card p-8 text-center text-gray-500">暂无数据</div>
                    )}

                    <section className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                        {list.map((row) => (
                            <div key={row.id} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm hover:shadow-cardHover transition">
                                {/* 标题 + 状态 */}
                                <div className="font-semibold mb-1 flex items-center gap-2">
                                    <span>#{row.id} {row.jobName}</span>
                                    {/* jobType badge */}
                                    {row.jobType && (
                                        <span className={`text-[11px] px-2 py-0.5 rounded-full border ${
                                            row.jobType === 'SQL'
                                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        }`}>{row.jobType}</span>
                                    )}
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${row.disabled ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                    {row.disabled ? '已禁用' : '启用中'}
                  </span>
                                    {row.status && <span className="text-xs text-gray-500">· {row.status}</span>}
                                </div>

                                {/* 基本信息（根据 jobType 展示目标） */}
                                <div className="text-xs text-gray-500 mb-2 space-x-3">
                                    <span>Cron：{row.cronExpr}</span>
                                    <span>脚本：{row.scriptName}</span>
                                    {row.jobType === 'SQL'
                                        ? <span>数据库ID：{row.databaseId ?? '-'}</span>
                                        : <span>服务器ID：{row.serverId ?? '-'}</span>}
                                    <span>超时：{row.timeoutSec ?? 300}s</span>
                                </div>

                                {/* 时间信息与描述 */}
                                <div className="text-xs text-gray-500 mb-2 space-x-3">
                                    <span>下次：{fmtTime(row.nextRunTime)}</span>
                                </div>
                                {row.descText && <div className="text-sm text-gray-700 mb-3">{row.descText}</div>}

                                {/* 操作按钮 */}
                                <div className="mt-auto flex flex-wrap gap-2">
                                    <button onClick={() => openEdit(row)}
                                            className="px-3 py-1.5 rounded-lg border text-sm bg-white border-gray-200 hover:bg-gray-50">编辑
                                    </button>
                                    <button onClick={() => runOnceStream(row)}
                                            className="px-3 py-1.5 rounded-lg text-white text-sm bg-blue-600 hover:bg-blue-700">执行一次
                                    </button>
                                    <button onClick={() => openLogs(row)}
                                            className="px-3 py-1.5 rounded-lg text-white text-sm bg-slate-600 hover:bg-slate-700">日志
                                    </button>
                                    <button onClick={() => openNotifyConfig(row.id)}
                                        className="px-3 py-1.5 rounded-lg text-white text-sm bg-amber-600 hover:bg-amber-700">通知配置
                                    </button>
                                    <button onClick={() => pause(row.id)}
                                            className="px-3 py-1.5 rounded-lg border text-sm bg-white border-gray-200 hover:bg-gray-50">暂停
                                    </button>
                                    <button onClick={() => resume(row.id)}
                                            className="px-3 py-1.5 rounded-lg text-white text-sm bg-emerald-600 hover:bg-emerald-700">恢复
                                    </button>
                                </div>
                            </div>
                        ))}
                    </section>
            </div>
            </main>

            {/* 底部页脚 */}
            <footer className="shrink-0 bg-white border-t border-gray-100 drop-shadow-md">
                <div className="mx-auto max-w-6xl px-4 py-3 text-xs text-gray-500 flex items-center justify-between">
                    <span>v1.0 · 内部工具</span>
                    <span className="space-x-3">
                        <Link to="/" className="hover:text-gray-800">首页</Link>
                        <Link to="/servers" className="hover:text-gray-800">服务器</Link>
                        <Link to="/checks" className="hover:text-gray-800">任务</Link>
                        <Link to="/databases" className="hover:text-gray-800">数据库</Link>
                        <Link to="/notifyTargets" className="hover:text-gray-800">通知方式</Link>
          </span>
                </div>
            </footer>

            {/* 日志弹窗（保持不变） */}
            {logVisible && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45">
                    <div className="w-[860px] max-w-[96vw] bg-white rounded-2xl shadow-2xl p-4">
                        <div className="flex items-center justify-between mb-3">
                            <div className="font-semibold">任务日志 {logJob ? `#${logJob.id} ${logJob.jobName}` : ''}</div>
                            <button onClick={() => setLogVisible(false)} className="w-8 h-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-50">×</button>
                        </div>
                        {logLoading ? (
                            <div className="text-sm text-gray-500">加载中...</div>
                        ) : logs.length === 0 ? (
                            <div className="text-sm text-gray-500">暂无日志</div>
                        ) : (
                            <div className="space-y-3 max-h-[70vh] overflow-auto pr-1">
                                {logs.map(log => (
                                    <div key={log.id} className="border border-gray-200 rounded-xl p-3 bg-gray-50">
                                        <div className="flex flex-wrap items-center gap-2 text-sm">
                                            <span className="font-semibold">#{log.id}</span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${statusBadge(log.status)}`}>{log.status || '—'}</span>
                                            <span className="text-gray-500">连接信息: {log.connectInfo || '—'}</span>
                                            <span className="text-gray-500">脚本: {log.scriptName || '—'}</span>
                                            <span className="text-gray-500">退出码: {log.exitCode ?? '—'}</span>
                                            <span className="text-gray-500">耗时: {fmtDur(log.durationMs)}</span>
                                        </div>
                                        <div className="mt-1 text-xs text-gray-500 space-x-3">
                                            <span>创建: {fmtTime(log.createTime)}</span>
                                            <span>开始: {fmtTime(log.startTime)}</span>
                                            <span>结束: {fmtTime(log.endTime)}</span>
                                        </div>
                                        {log.argsText && (
                                            <div className="mt-1 text-xs text-gray-600">参数：<code className="px-1 border rounded">{log.argsText}</code></div>
                                        )}
                                        <details className="mt-2 group">
                                            <summary className="cursor-pointer select-none text-sm text-gray-700 group-open:mb-1">标准输出（output）</summary>
                                            <pre className="whitespace-pre-wrap text-xs bg-white border border-gray-200 rounded-lg p-2 overflow-auto max-h-64">{log.outputText || ''}</pre>
                                        </details>
                                        <details className="mt-2 group">
                                            <summary className="cursor-pointer select-none text-sm text-gray-700 group-open:mb-1">错误输出（error）</summary>
                                            <pre className="whitespace-pre-wrap text-xs bg-white border border-gray-200 rounded-lg p-2 overflow-auto max-h-64 text-rose-700">{log.errorText || ''}</pre>
                                        </details>
                                        <details className="mt-2 group">
                                            <summary className="cursor-pointer select-none text-sm text-gray-700 group-open:mb-1">脚本内容（只读）</summary>
                                            <pre className="whitespace-pre-wrap text-xs bg-white border border-gray-200 rounded-lg p-2 overflow-auto max-h-64">{log.scriptContent || ''}</pre>
                                        </details>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="mt-4 text-right">
                            <button onClick={() => setLogVisible(false)} className="px-3.5 py-2 rounded-lg border text-sm bg-white border-gray-200 hover:bg-gray-50">关闭</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 新建/编辑 弹窗 */}
            {visible && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45">
                    <div className="w-[760px] max-w-[94vw] bg-white rounded-2xl shadow-2xl p-4">
                        {/* 标题 */}
                        <div className="flex items-center justify-between mb-3">
                            <div className="font-semibold">{isEdit ? '编辑任务' : '新建任务'}</div>
                            <button onClick={() => setVisible(false)} className="w-8 h-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-50">×</button>
                        </div>

                        {/* 表单 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {/* 第一行：任务名 / Cron */}
                            <div>
                                <LabeledInput
                                    label="任务名称"
                                    value={form.jobName}
                                    onChange={(v) => setForm({ ...form, jobName: v })}
                                    placeholder="例如：check-backup-daily"
                                    disabled={isEdit} // ★ 编辑时不可改
                                />
                            </div>
                            <div>
                                <LabeledInput
                                    label="Cron 表达式（秒级）"
                                    value={form.cronExpr}
                                    onChange={(v) => setForm({ ...form, cronExpr: v })}
                                    placeholder="0 0 15 * * ?（每天 15:00）"
                                />
                                <div className="text-xs text-gray-500 mt-1">
                                    例：每 5 分钟 <code className="px-1 border rounded">0 */5 * * * ?</code>；每天 02:30 <code className="px-1 border rounded">0 30 2 * * ?</code>
                                </div>
                            </div>

                            {/* 第二行：任务类型（整行） */}
                            <div className="md:col-span-2">
                                <LabeledSelect
                                    label="任务类型"
                                    value={form.jobType || ''} // ★ 必选，无默认
                                    onChange={(v) => {
                                        // 切换类型时重置脚本与目标
                                        setForm(f => ({
                                            ...f,
                                            jobType: (v as 'SHELL' | 'SQL'),
                                            scriptName: '',
                                            serverId: undefined,
                                            databaseId: undefined,
                                        }));
                                    }}
                                    options={[
                                        { value: 'SHELL', label: 'SHELL' },
                                        { value: 'SQL', label: 'SQL' },
                                    ]}
                                    placeholder="请选择任务类型（SHELL / SQL）"
                                    disabled={isEdit} // ★ 编辑时不可改
                                />
                            </div>

                            {/* 第三行：脚本（根据 jobType 过滤） */}
                            <div>
                                <label className="block mb-2 text-xs text-gray-500">脚本名称</label>
                                <select
                                    value={form.scriptName}
                                    onChange={(e) => setForm({ ...form, scriptName: e.target.value })}
                                    disabled={!form.jobType || isEdit} // ★ 未选类型或编辑时禁用
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                                >
                                    <option value="">{form.jobType ? '请选择脚本' : '请先选择任务类型'}</option>
                                    {filteredScripts.map(s => (
                                        <option key={s.id} value={s.scriptName}>{s.scriptName}</option>
                                    ))}
                                </select>
                            </div>

                            {/* 第三行右侧：目标（服务器或数据库） */}
                            <div>
                                {form.jobType === 'SQL' ? (
                                    <>
                                        <label className="block mb-2 text-xs text-gray-500">目标数据库</label>
                                        <select
                                            value={form.databaseId || 0}
                                            onChange={(e) => setForm({ ...form, databaseId: Number(e.target.value) || undefined })}
                                            disabled={!form.jobType || form.jobType !== 'SQL' || isEdit}
                                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                                        >
                                            <option value={0}>请选择数据库</option>
                                            {databases.map(d => (
                                                <option key={d.id} value={d.id}>#{d.id} {d.name}</option>
                                            ))}
                                        </select>
                                    </>
                                ) : (
                                    <>
                                        <label className="block mb-2 text-xs text-gray-500">目标服务器</label>
                                        <select
                                            value={form.serverId || 0}
                                            onChange={(e) => setForm({ ...form, serverId: Number(e.target.value) || undefined })}
                                            disabled={!form.jobType || form.jobType !== 'SHELL' || isEdit}
                                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                                        >
                                            <option value={0}>请选择服务器</option>
                                            {servers.map(s => (
                                                <option key={s.id} value={s.id}>#{s.id} {s.name ?? `${s.host}:${s.port}`}</option>
                                            ))}
                                        </select>
                                    </>
                                )}
                            </div>

                            {/* 其它字段 */}
                            <div className="md:col-span-2">
                                <LabeledInput
                                    label="附加参数（传给脚本）"
                                    value={form.argsText || ''}
                                    onChange={(v) => setForm({ ...form, argsText: v })}
                                    placeholder={form.jobType === 'SQL' ? '例如：--schema public' : '/home/admin/backup-job/backup-persist'}
                                />
                            </div>

                            <div>
                                <LabeledInput
                                    label="超时（秒）"
                                    type="number"
                                    value={form.timeoutSec ?? 300}
                                    onChange={(v) => setForm({ ...form, timeoutSec: Number(v) || 300 })}
                                />
                            </div>

                            <div>
                                <label className="block mb-2 text-xs text-gray-500">是否启用</label>
                                <select
                                    value={form.disabled ? '1' : '0'}
                                    onChange={(e) => setForm({ ...form, disabled: e.target.value === '1' })}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="0">启用</option>
                                    <option value="1">禁用</option>
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <LabeledTextArea
                                    label="描述"
                                    value={form.descText || ''}
                                    onChange={(v) => setForm({ ...form, descText: v })}
                                    rows={3}
                                    placeholder="例如：每天 15:00 检查最新备份是否生成；失败会报警"
                                />
                            </div>
                        </div>

                        {/* 底部：速查 + 操作按钮 */}
                        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <CronCheats/>
                            <div className="flex gap-2 justify-end">
                                <button onClick={() => setVisible(false)}
                                        className="px-3.5 py-2 rounded-lg border text-sm bg-white border-gray-200 hover:bg-gray-50">取消</button>
                                <button onClick={save}
                                        className="px-3.5 py-2 rounded-lg text-white text-sm bg-blue-600 hover:bg-blue-700">
                                    {isEdit ? '保存' : '创建'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {notifyModalJobId != null && (
                <NotifyConfigModal
                    jobId={notifyModalJobId}
                    onClose={() => {
                        setNotifyModalJobId(null);
                        // 中文注释：关闭后可选刷新任务列表（如果你会在配置变更后展示关联信息，保持一致）
                        // loadAll();
                    }}
                />
            )}

        </div>
    );
}

// Cron 速查
function CronCheats() {
    return (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-600 leading-6">
            <div className="font-semibold mb-1 text-gray-700">Cron 速查（Hutool 秒级）</div>
            <div>每天 15:00：<code className="px-1 border rounded">0 0 15 * * ?</code></div>
            <div>每 5 分钟：<code className="px-1 border rounded">0 */5 * * * ?</code></div>
            <div>每小时整点：<code className="px-1 border rounded">0 0 * * * ?</code></div>
            <div>工作日 9:00：<code className="px-1 border rounded">0 0 9 ? * MON-FRI</code></div>
        </div>
    );
}