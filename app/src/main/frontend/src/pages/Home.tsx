// 中文注释：首页（顶部导航 + 中间滚动 + 底部页脚固定可见）
import {Link} from 'react-router-dom';
import {Server, FileCode, CalendarCheck, Database, Bell} from 'lucide-react';
import {useEffect, useState} from 'react';
import {api} from '@/utils/api';

// ===== 类型定义 =====
type Stat = { servers: number; scripts: number; jobs: number; databases: number; notifyTargets: number; };

type TodayFailLog = {
    id: number;
    jobId: number;
    jobName: string;
    createTime?: string;
    startTime?: string;
    endTime?: string;
    durationMs?: number;
    exitCode?: number | null;
    status: 'SUCCESS' | 'FAIL' | 'TIMEOUT' | 'ERROR' | string;
};

type DevCronJobLogDetail = {
    id: number;
    jobId: number;
    connectInfo?: string;
    scriptName?: string;
    scriptContent?: string;
    argsText?: string;
    createTime?: string;
    startTime?: string;
    endTime?: string;
    durationMs?: number;
    exitCode?: number | null;
    status?: 'SUCCESS' | 'FAIL' | 'TIMEOUT' | 'ERROR' | string;
    outputText?: string;
    errorText?: string;
};

export default function Home() {
    // ===== 顶部统计 =====
    const [stat, setStat] = useState<Stat>({servers: 0, scripts: 0, jobs: 0, databases: 0, notifyTargets: 0});

    // ===== 今日失败列表 =====
    const [failList, setFailList] = useState<TodayFailLog[]>([]);
    const [loadingFail, setLoadingFail] = useState(false);

    // ===== 日志详情弹窗 =====
    const [detailVisible, setDetailVisible] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detail, setDetail] = useState<DevCronJobLogDetail | null>(null);

    // 中文注释：时间/时长/状态徽标工具
    const fmtTime = (s?: string | number) => {
        if (!s) return '';
        try {
            if (typeof s === 'number') return new Date(s).toLocaleString();
            return new Date(String(s).replace(' ', 'T')).toLocaleString();
        } catch {
            return String(s);
        }
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
            case 'SUCCESS':
                return 'bg-emerald-50 text-emerald-700';
            case 'FAIL':
                return 'bg-rose-50 text-rose-700';
            case 'TIMEOUT':
                return 'bg-amber-50 text-amber-700';
            case 'ERROR':
                return 'bg-gray-100 text-gray-600';
            default:
                return 'bg-gray-100 text-gray-600';
        }
    };

    // 中文注释：加载统计
    useEffect(() => {
        (async () => {
            try {
                const [sv, sc, jb, db, nt] = await Promise.all([
                    api.get<any[]>('/api/servers/list'),
                    api.get<any[]>('/api/devScript/list'),
                    api.get<any[]>('/api/cron/jobs'),
                    api.get<any[]>('/api/databases/list'),
                    api.get<any[]>('/api/notifyTarget/list'),
                ]);
                setStat({
                    servers: Array.isArray(sv) ? sv.length : 0,
                    scripts: Array.isArray(sc) ? sc.length : 0,
                    jobs: Array.isArray(jb) ? jb.length : 0,
                    databases: Array.isArray(db) ? db.length : 0,
                    notifyTargets: Array.isArray(nt) ? nt.length : 0,
                });
            } catch {
            }
        })();
    }, []);

    // 中文注释：加载今日失败列表
    const loadTodayFail = async () => {
        setLoadingFail(true);
        try {
            const data = await api.get<TodayFailLog[]>('/api/cron/job/log/todayFail');
            setFailList(Array.isArray(data) ? data : []);
        } finally {
            setLoadingFail(false);
        }
    };
    useEffect(() => {
        loadTodayFail();
    }, []);

    // 中文注释：打开日志详情
    const openDetail = async (logId: number) => {
        setDetailVisible(true);
        setDetailLoading(true);
        setDetail(null);
        try {
            const data = await api.get<DevCronJobLogDetail>(`/api/cron/job/log/detail/${logId}`);
            setDetail(data || null);
        } finally {
            setDetailLoading(false);
        }
    };

    useEffect(() => {
        if (!detailVisible) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                setDetailVisible(false);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [detailVisible]);

    // 中文注释：入口卡片
    // 中文注释：入口卡片配置 —— 保留不变
    const items = [
        { to: '/servers',   title: '服务器管理', desc: '集中管理服务器信息，支持 SSH 测试', icon: <Server className="w-6 h-6 text-blue-500" />,   key: 'servers'   as const },
        { to: '/scripts',   title: '脚本管理',   desc: '维护可复用脚本，支持新增、修改和查看', icon: <FileCode className="w-6 h-6 text-emerald-500" />, key: 'scripts'   as const },
        { to: '/checks',    title: '任务/检查',  desc: '定时任务调度与执行日志查看',           icon: <CalendarCheck className="w-6 h-6 text-violet-500" />, key: 'jobs'      as const },
        { to: '/databases', title: '数据库管理', desc: '管理数据库连接信息，支持 JDBC 测试',   icon: <Database className="w-6 h-6 text-amber-500" />,      key: 'databases' as const },
        { to: '/notifyTargets', title: '通知方式管理', desc: '维护手机号/邮箱/Hook 等并与任务关联', icon: <Bell className="w-6 h-6 text-pink-500" />, key: 'notifyTargets' as const },
    ] as const;

    return (
        // 中文注释：使用 flex 布局撑满视口，高度固定为 100vh；header/footer 固定可见，main 中间区域滚动
        <div className="flex flex-col h-screen bg-gray-50">
            {/* 顶部导航（固定高度，始终可见） */}
            <header className="shrink-0 bg-white/80 backdrop-blur border-b border-gray-100 shadow-sm">
                <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
                    <h1 className="text-xl font-bold">运维管理平台</h1>
                    <nav className="text-sm text-gray-600">
                        <Link to="/servers" className="hover:text-gray-900">服务器</Link>
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

            {/* 中间主内容区域：flex-1 + overflow-y-auto，只有这里滚动 */}
            <main className="flex-1 overflow-y-auto">
                <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
                    {/* ✅ 功能入口卡片：右上角加入数量徽标 */}
                    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
                        {items.map((it) => {
                            // 中文注释：从 stat 中取对应数量
                            const count =
                                it.key === 'servers'   ? stat.servers   :
                                    it.key === 'scripts'   ? stat.scripts   :
                                        it.key === 'jobs'      ? stat.jobs      :
                                            it.key === 'databases' ? stat.databases :
                                                it.key === 'notifyTargets' ? stat.notifyTargets : 0;

                            return (
                                <Link
                                    key={it.to}
                                    to={it.to}
                                    className="relative group bg-white rounded-2xl shadow-card hover:shadow-cardHover transition p-6 flex flex-col h-full"
                                >
                                    {/* 右上角数量徽标 */}
                                    <span
                                        className="absolute right-4 top-4 text-[11px] leading-none px-2 py-1 rounded-full
                     bg-gray-100 text-gray-600 border border-gray-200"
                                        title={`${it.title}数量`}
                                    >
          {count}
        </span>

                                    <div className="mb-4">{it.icon}</div>
                                    <div className="text-lg font-semibold mb-1">{it.title}</div>
                                    <div className="text-gray-500 text-sm leading-6 flex-1">{it.desc}</div>
                                    <div className="mt-4 text-sm text-blue-600 group-hover:translate-x-0.5 transition">
                                        进入 →
                                    </div>
                                </Link>
                            );
                        })}
                    </section>

                    {/* 今日失败任务列表（行样式） */}
                    <section>
                    <div className="flex items-center justify-between mb-3">
                            <h2 className="text-base font-semibold">今日失败任务</h2>
                            <button
                                onClick={loadTodayFail}
                                className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 bg-white hover:bg-gray-50"
                            >
                                刷新
                            </button>
                        </div>

                        {/* 表头（桌面端显示） */}
                        <div className="hidden md:grid md:grid-cols-12 text-xs text-gray-500 px-2 py-2">
                            <div className="col-span-2">日志ID / 任务ID</div>
                            <div className="col-span-3">任务名称</div>
                            <div className="col-span-3">时间（开始 ~ 结束）</div>
                            <div className="col-span-2">耗时 / 退出码</div>
                            <div className="col-span-2">状态 / 操作</div>
                        </div>

                        {/* 数据区（白底，内部按行分割） */}
                        <div className="divide-y divide-gray-200 bg-white rounded-2xl border border-gray-200">
                            {loadingFail && (
                                <div className="px-3 py-3 text-sm text-gray-500">加载中...</div>
                            )}
                            {!loadingFail && failList.length === 0 && (
                                <div className="px-3 py-3 text-sm text-gray-500">今日暂无失败任务</div>
                            )}
                            {failList.map(row => (
                                <div key={row.id} className="px-3 py-3 md:grid md:grid-cols-12 md:gap-3 text-sm">
                                    {/* 左侧：ID */}
                                    <div className="md:col-span-2">
                                        <div className="font-mono text-xs text-gray-700">#{row.id}</div>
                                        <div className="text-xs text-gray-500">jobId: {row.jobId}</div>
                                    </div>

                                    {/* 名称 */}
                                    <div className="md:col-span-3">
                                        <div className="font-medium text-gray-800 line-clamp-1">{row.jobName}</div>
                                        <div className="mt-1 md:hidden text-xs text-gray-500">
                                            {fmtTime(row.startTime)} ~ {fmtTime(row.endTime)}
                                        </div>
                                    </div>

                                    {/* 时间段（桌面端显示） */}
                                    <div className="hidden md:block md:col-span-3 text-gray-600">
                                        <div className="text-xs">{fmtTime(row.startTime)} ~ {fmtTime(row.endTime)}</div>
                                    </div>

                                    {/* 耗时/退出码 */}
                                    <div className="md:col-span-2 text-gray-600">
                                        <div className="text-xs">耗时：{fmtDur(row.durationMs)}</div>
                                        <div className="text-xs">退出码：{row.exitCode ?? '—'}</div>
                                    </div>

                                    {/* 状态 + 操作 */}
                                    <div
                                        className="md:col-span-2 flex items-center gap-2 justify-between md:justify-start mt-2 md:mt-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusBadge(row.status)}`}>
                      {row.status}
                    </span>
                                        <button
                                            onClick={() => openDetail(row.id)}
                                            className="px-2.5 py-1.5 rounded-lg text-xs text-white bg-slate-600 hover:bg-slate-700"
                                        >
                                            详情
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </main>

            {/* 底部页脚（固定高度，始终可见） */}
            <footer className="shrink-0 bg-white border-t border-gray-100 drop-shadow-md">
                <div className="mx-auto max-w-6xl px-4 py-3 text-xs text-gray-500 flex items-center justify-between">
                    <span>v1.0 · 内部工具</span>
                    <span className="space-x-3">
                        <Link to="/servers" className="hover:text-gray-800">服务器</Link>
                        <Link to="/scripts" className="hover:text-gray-800">脚本</Link>
                        <Link to="/checks" className="hover:text-gray-800">任务</Link>
                        <Link to="/databases" className="hover:text-gray-800">数据库</Link>
                        <Link to="/notifyTargets" className="hover:text-gray-800">通知方式</Link>
          </span>
                </div>
            </footer>

            {/* 日志详情弹窗（与之前一致） */}
            {detailVisible && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45">
                    <div className="w-[900px] max-w-[96vw] bg-white rounded-2xl shadow-2xl p-4">
                        {/* 标题栏 */}
                        <div className="flex items-center justify-between mb-3">
                            <div className="font-semibold">日志详情 {detail?.id ? `#${detail.id}` : ''}</div>
                            <button
                                onClick={() => setDetailVisible(false)}
                                className="w-8 h-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
                            >×
                            </button>
                        </div>

                        {/* 内容 */}
                        {detailLoading ? (
                            <div className="text-sm text-gray-500">加载中...</div>
                        ) : !detail ? (
                            <div className="text-sm text-gray-500">未找到日志</div>
                        ) : (
                            <div className="space-y-3 max-h-[72vh] overflow-auto pr-1">
                                {/* 基本信息 */}
                                <div className="flex flex-wrap items-center gap-2 text-sm">
                                    <span className="font-semibold">#{detail.id}</span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusBadge(detail.status)}`}>
                    {detail.status || '—'}
                  </span>
                                    <span className="text-gray-500">jobId: {detail.jobId}</span>
                                    <span className="text-gray-500">连接信息: {detail.connectInfo || '—'}</span>
                                    <span className="text-gray-500">脚本: {detail.scriptName || '—'}</span>
                                    <span className="text-gray-500">退出码: {detail.exitCode ?? '—'}</span>
                                    <span className="text-gray-500">耗时: {fmtDur(detail.durationMs)}</span>
                                </div>

                                {/* 时间信息 */}
                                <div className="text-xs text-gray-500 space-x-3">
                                    <span>创建: {fmtTime(detail.createTime)}</span>
                                    <span>开始: {fmtTime(detail.startTime)}</span>
                                    <span>结束: {fmtTime(detail.endTime)}</span>
                                </div>

                                {/* 参数 */}
                                {detail.argsText && (
                                    <div className="text-xs text-gray-600">
                                        参数：<code className="px-1 border rounded">{detail.argsText}</code>
                                    </div>
                                )}

                                {/* 输出区 */}
                                <details className="group">
                                    <summary
                                        className="cursor-pointer select-none text-sm text-gray-700 group-open:mb-1">
                                        标准输出（output）
                                    </summary>
                                    <pre
                                        className="whitespace-pre-wrap text-xs bg-gray-50 border border-gray-200 rounded-lg p-2 overflow-auto max-h-64">
{detail.outputText || ''}
                  </pre>
                                </details>

                                <details className="group">
                                    <summary
                                        className="cursor-pointer select-none text-sm text-gray-700 group-open:mb-1">
                                        错误输出（error）
                                    </summary>
                                    <pre
                                        className="whitespace-pre-wrap text-xs bg-white border border-gray-200 rounded-lg p-2 overflow-auto max-h-64 text-rose-700">
{detail.errorText || ''}
                  </pre>
                                </details>

                                <details className="group">
                                    <summary
                                        className="cursor-pointer select-none text-sm text-gray-700 group-open:mb-1">
                                        脚本内容（只读）
                                    </summary>
                                    <pre
                                        className="whitespace-pre-wrap text-xs bg-white border border-gray-200 rounded-lg p-2 overflow-auto max-h-64">
{detail.scriptContent || ''}
                  </pre>
                                </details>
                            </div>
                        )}

                        {/* 底部 */}
                        <div className="mt-4 text-right">
                            <button
                                onClick={() => setDetailVisible(false)}
                                className="px-3.5 py-2 rounded-lg border text-sm bg-white border-gray-200 hover:bg-gray-50"
                            >
                                关闭
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// 中文注释：统计卡片
function StatCard({label, value}: { label: string; value: number }) {
    return (
        <div className="bg-white rounded-2xl shadow-card p-5">
            <div className="text-sm text-gray-500">{label}</div>
            <div className="mt-2 text-2xl font-bold">{value}</div>
        </div>
    );
}