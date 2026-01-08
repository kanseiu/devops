// 中文注释：首页（顶部导航 + 中间滚动 + 底部页脚固定可见）
import {useEffect, useMemo, useState, type MouseEvent} from 'react';
import {createPortal} from 'react-dom';
import {api} from '@/utils/api';
import AppHeader from '@/components/AppHeader';
import AppFooter from '@/components/AppFooter';

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

type JobStat = {
    jobId: number;
    jobName: string;
    successCount: number;
    failCount: number;
};

type DayStat = {
    day: string;
    successCount: number;
    failCount: number;
    jobs: JobStat[];
};

export default function Home() {
    // ===== 今日失败列表 =====
    const [failList, setFailList] = useState<TodayFailLog[]>([]);
    const [loadingFail, setLoadingFail] = useState(false);

    // ===== 日志详情弹窗 =====
    const [detailVisible, setDetailVisible] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detail, setDetail] = useState<DevCronJobLogDetail | null>(null);

    // ===== 7 天统计 =====
    const [weeklyStats, setWeeklyStats] = useState<DayStat[]>([]);
    const [weeklyLoading, setWeeklyLoading] = useState(false);
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

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

    // 中文注释：加载 7 天统计
    useEffect(() => {
        (async () => {
            setWeeklyLoading(true);
            try {
                const data = await api.get<DayStat[]>('/api/cron/job/log/summary7days');
                setWeeklyStats(Array.isArray(data) ? data : []);
            } finally {
                setWeeklyLoading(false);
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

    const chartData = useMemo(() => {
        if (weeklyStats.length > 0) return weeklyStats;
        const today = new Date();
        return Array.from({length: 7}).map((_, idx) => {
            const d = new Date(today);
            d.setDate(today.getDate() - (6 - idx));
            const day = d.toISOString().slice(0, 10);
            return {day, successCount: 0, failCount: 0, jobs: []};
        });
    }, [weeklyStats]);

    return (
        // 中文注释：使用 flex 布局撑满视口，高度固定为 100vh；header/footer 固定可见
        <div className="app-shell app-shell--fade flex flex-col h-screen">
            {/* 顶部导航（固定高度，始终可见） */}
            <AppHeader title="运维管理平台" />

            {/* 中间主内容区域：flex-1 + overflow-y-auto，只有这里滚动 */}
            <main className="flex-1 overflow-y-auto">
                <div className="mx-auto max-w-6xl px-4 py-6 flex flex-col gap-6 page-content">
                    {/* 今日失败任务列表（行样式） */}
                    <section className="flex flex-col">
                        <div className="w-full bg-white border border-gray-200 rounded-2xl shadow-card p-5 flex flex-col">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <div className="text-sm text-gray-500">今日失败任务</div>
                                    <div className="text-lg font-semibold text-gray-800">失败记录列表</div>
                                </div>
                                <button
                                    onClick={loadTodayFail}
                                    className="action-btn px-3 py-1.5 rounded-full text-sm border border-gray-200 bg-white hover:bg-gray-50"
                                >
                                    刷新
                                </button>
                            </div>

                            {/* 表头（桌面端显示） */}
                            <div className="hidden md:grid md:grid-cols-12 text-xs text-gray-500 px-2 py-2 border-b border-gray-100 text-center">
                                <div className="col-span-2">日志ID / 任务ID</div>
                                <div className="col-span-3">任务名称</div>
                                <div className="col-span-3">时间（开始 ~ 结束）</div>
                                <div className="col-span-2">耗时 / 退出码</div>
                                <div className="col-span-2">状态 / 操作</div>
                            </div>

                            {/* 数据区（内部按行分割，独立滚动） */}
                            <div className="max-h-[48vh] overflow-y-auto divide-y divide-gray-200">
                                {loadingFail && (
                                    <div className="px-3 py-3 text-sm text-gray-500">加载中...</div>
                                )}
                                {!loadingFail && failList.length === 0 && (
                                    <div className="px-3 py-3 text-sm text-gray-500">今日暂无失败任务</div>
                                )}
                                {failList.map(row => (
                                    <div key={row.id} className="px-3 py-3 text-sm">
                                        {/* 移动端：名称 + 操作同一行 */}
                                        <div className="md:hidden flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <div className="font-medium text-gray-800 truncate">{row.jobName}</div>
                                                <div className="text-xs text-gray-500 mt-1">开始：{fmtTime(row.startTime) || '—'}</div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0 mt-1">
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

                                        {/* 桌面端：表格列 */}
                                        <div className="hidden md:grid md:grid-cols-12 md:gap-3">
                                            <div className="md:col-span-2 md:flex md:flex-col md:items-center md:justify-center">
                                                <div className="font-mono text-xs text-gray-700">#{row.id}</div>
                                                <div className="text-xs text-gray-500">jobId: {row.jobId}</div>
                                            </div>
                                            <div className="md:col-span-3 flex flex-col md:items-center md:justify-center">
                                                <div className="font-medium text-gray-800 line-clamp-1 md:text-center">{row.jobName}</div>
                                            </div>
                                            <div className="md:col-span-3 md:flex md:items-center md:justify-center text-gray-600">
                                                <div className="text-xs text-center">{fmtTime(row.startTime)} ~ {fmtTime(row.endTime)}</div>
                                            </div>
                                            <div className="md:col-span-2 md:flex md:flex-col md:items-center md:justify-center text-gray-600">
                                                <div className="text-xs">耗时：{fmtDur(row.durationMs)}</div>
                                                <div className="text-xs">退出码：{row.exitCode ?? '—'}</div>
                                            </div>
                                            <div className="md:col-span-2 flex items-center gap-2 md:justify-center mt-2 md:mt-0">
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
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* 近 7 天执行统计 */}
                    <section className="flex flex-col">
                        <div className="w-full bg-white border border-gray-200 rounded-2xl shadow-card p-5 flex flex-col">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <div className="text-sm text-gray-500">近 7 天执行统计</div>
                                    <div className="text-lg font-semibold text-gray-800">成功 / 失败趋势</div>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <span className="inline-flex items-center gap-2">
                                        <i className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                        成功
                                    </span>
                                    <span className="inline-flex items-center gap-2">
                                        <i className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                                        失败
                                    </span>
                                </div>
                            </div>
                            <div className="flex-1 min-h-0">
                                <WeeklyChart
                                    data={chartData}
                                    loading={weeklyLoading}
                                    activeIndex={activeIndex}
                                    setActiveIndex={setActiveIndex}
                                />
                            </div>
                        </div>
                    </section>
                </div>
            </main>

            {/* 底部页脚（固定高度，始终可见） */}
            <AppFooter />

            {/* 日志详情弹窗（与之前一致） */}
            {detailVisible && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
                    <div className="w-[900px] max-w-[96vw] bg-white border border-gray-200 rounded-2xl shadow-card p-4 modal-panel modal-shell">
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
                        <div className="modal-body flex-1">
                        {detailLoading ? (
                            <div className="text-sm text-gray-500">加载中...</div>
                        ) : !detail ? (
                            <div className="text-sm text-gray-500">未找到日志</div>
                        ) : (
                            <div className="space-y-3">
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
                        </div>

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

function WeeklyChart({
    data,
    loading,
    activeIndex,
    setActiveIndex,
}: {
    data: DayStat[];
    loading: boolean;
    activeIndex: number | null;
    setActiveIndex: (idx: number | null) => void;
}) {
    const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
    const maxValue = Math.max(
        1,
        ...data.map(d => Math.max(d.successCount, d.failCount))
    );
    const points = data.map((d, idx) => ({
        x: idx,
        success: d.successCount,
        fail: d.failCount,
    }));
    const labels = data.map(d => d.day.slice(5));

    const handleMove = (e: MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const rawX = e.clientX - rect.left;
        const rawY = e.clientY - rect.top;
        const maxIdx = Math.max(data.length - 1, 0);
        const idx = maxIdx === 0 ? 0 : Math.round((rawX / Math.max(rect.width, 1)) * maxIdx);
        setActiveIndex(Math.max(0, Math.min(idx, data.length - 1)));
        const tooltipWidth = 384;
        const half = tooltipWidth / 2;
        const x = Math.min(Math.max(e.clientX, half + 12), window.innerWidth - half - 12);
        const y = Math.max(e.clientY, 140);
        setTooltipPos({x, y});
    };

    const active = activeIndex != null ? data[activeIndex] : null;

    return (
        <div
            className="relative w-full h-full"
            onMouseMove={handleMove}
            onMouseLeave={() => {
                setActiveIndex(null);
                setTooltipPos(null);
            }}
        >
            <svg className="w-full h-full" viewBox={`0 0 1000 320`} preserveAspectRatio="none">
                <defs>
                    <linearGradient id="lineSuccess" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#14b8a6" />
                    </linearGradient>
                    <linearGradient id="lineFail" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#f43f5e" />
                        <stop offset="100%" stopColor="#fb7185" />
                    </linearGradient>
                </defs>
                <rect x="0" y="0" width="1000" height="320" fill="#ffffff" />
                {[0.25, 0.5, 0.75].map((y, i) => (
                    <line key={i} x1="40" x2="980" y1={40 + (240 * y)} y2={40 + (240 * y)} stroke="#eef2f7" strokeWidth="1" />
                ))}
                {(() => {
                    const denom = Math.max(points.length - 1, 1);
                    return (
                        <>
                            <path
                                d={buildLinePath(points.map((p, idx) => ({x: 60 + (idx * 880) / denom, y: 280 - (p.success / maxValue) * 220})))}
                                fill="none"
                                stroke="url(#lineSuccess)"
                                strokeWidth="3"
                            />
                            <path
                                d={buildLinePath(points.map((p, idx) => ({x: 60 + (idx * 880) / denom, y: 280 - (p.fail / maxValue) * 220})))}
                                fill="none"
                                stroke="url(#lineFail)"
                                strokeWidth="3"
                            />
                            {points.map((p, idx) => {
                                const x = 60 + (idx * 880) / denom;
                                const ySuccess = 280 - (p.success / maxValue) * 220;
                                const yFail = 280 - (p.fail / maxValue) * 220;
                                const activePoint = activeIndex === idx;
                                return (
                                    <g key={idx}>
                                        <circle cx={x} cy={ySuccess} r={activePoint ? 5 : 4} fill="#10b981" />
                                        <circle cx={x} cy={yFail} r={activePoint ? 5 : 4} fill="#f43f5e" />
                                    </g>
                                );
                            })}
                            {labels.map((label, idx) => {
                                const x = 60 + (idx * 880) / denom;
                                return (
                                    <text key={label} x={x} y={305} textAnchor="middle" fontSize="12" fill="#94a3b8">
                                        {label}
                                    </text>
                                );
                            })}
                        </>
                    );
                })()}
            </svg>
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400">
                    加载中...
                </div>
            )}
            {active && tooltipPos && createPortal(
                <div
                    className="fixed z-[200] w-96 -translate-x-1/2 -translate-y-full rounded-2xl border border-gray-200 bg-white/95 shadow-card p-4 text-xs text-gray-600 pointer-events-none"
                    style={{left: tooltipPos.x, top: tooltipPos.y}}
                >
                    <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold text-gray-800">{active.day}</div>
                        <div className="flex items-center gap-3 text-[11px]">
                            <span className="inline-flex items-center gap-1 text-emerald-600">
                                <i className="w-2 h-2 rounded-full bg-emerald-500" />
                                {active.successCount}
                            </span>
                            <span className="inline-flex items-center gap-1 text-rose-600">
                                <i className="w-2 h-2 rounded-full bg-rose-500" />
                                {active.failCount}
                            </span>
                        </div>
                    </div>
                    <div className="grid grid-cols-[minmax(0,1fr)_48px_48px] gap-2 text-[11px] text-gray-500 pb-1 border-b border-gray-100">
                        <span>任务</span>
                        <span className="text-emerald-600 text-right">成功</span>
                        <span className="text-rose-600 text-right">失败</span>
                    </div>
                    <div className="space-y-1 max-h-36 overflow-auto pr-1 pt-2">
                        {active.jobs && active.jobs.length > 0 ? (
                            active.jobs.map(job => (
                                <div key={job.jobId} className="grid grid-cols-[minmax(0,1fr)_48px_48px] items-center gap-2">
                                    <span className="truncate text-gray-700">{job.jobName || `#${job.jobId}`}</span>
                                    <span className="text-emerald-600 text-right font-mono tabular-nums">{job.successCount}</span>
                                    <span className="text-rose-600 text-right font-mono tabular-nums">{job.failCount}</span>
                                </div>
                            ))
                        ) : (
                            <div className="text-gray-400">暂无记录</div>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}

function buildLinePath(points: { x: number; y: number }[]) {
    if (points.length === 0) return '';
    return points.map((p, idx) => `${idx === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
}
