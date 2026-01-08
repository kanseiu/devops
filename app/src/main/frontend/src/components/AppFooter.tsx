import {useEffect, useState} from 'react';
import {useConfirm} from '@/components/ConfirmDialog';

type AppFooterProps = {
    centerText?: string;
};

export default function AppFooter({centerText = 'v1.0 · 内部工具'}: AppFooterProps) {
    const confirm = useConfirm();
    const [loggingOut, setLoggingOut] = useState(false);
    const [dateText, setDateText] = useState('');
    const [timeText, setTimeText] = useState('');

    useEffect(() => {
        const WEEK_LABELS = ['日', '一', '二', '三', '四', '五', '六'];
        const pad2 = (v: number) => String(v).padStart(2, '0');
        const formatNow = () => {
            const d = new Date();
            const y = d.getFullYear();
            const m = pad2(d.getMonth() + 1);
            const day = pad2(d.getDate());
            const hh = pad2(d.getHours());
            const mm = pad2(d.getMinutes());
            const ss = pad2(d.getSeconds());
            const wk = WEEK_LABELS[d.getDay()];
            return {
                date: `${y}年${m}月${day}日 星期${wk}`,
                time: `${hh}:${mm}:${ss}`,
            };
        };
        const tick = () => {
            const {date, time} = formatNow();
            setDateText(date);
            setTimeText(time);
        };
        tick();
        const id = window.setInterval(tick, 1000);
        return () => window.clearInterval(id);
    }, []);

    const getCookie = (name: string) => {
        return document.cookie.split('; ').find(x => x.startsWith(name + '='))?.split('=')[1] || '';
    };

    const logout = async () => {
        if (loggingOut) return;
        const ok = await confirm({
            title: '确认注销',
            message: '确认注销并退出登录？',
            confirmText: '注销',
            cancelText: '取消',
            tone: 'danger',
        });
        if (!ok) return;
        setLoggingOut(true);
        try {
            await fetch('/logout', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-XSRF-TOKEN': getCookie('XSRF-TOKEN'),
                },
                body: '',
            });
        } finally {
            window.location.href = '/login';
        }
    };

    return (
        <footer className="shrink-0 bg-white/90 border-t border-gray-100">
            <div className="mx-auto max-w-6xl px-4 py-3 text-xs text-gray-500 grid grid-cols-3 items-center">
                <div className="justify-self-start">
                    <button
                        onClick={logout}
                        className={`px-3 py-1.5 rounded-full text-xs text-white ${
                            loggingOut ? 'bg-rose-400 cursor-not-allowed' : 'bg-rose-600 hover:bg-rose-700'
                        }`}
                        disabled={loggingOut}
                    >
                        注销
                    </button>
                </div>
                <span className="justify-self-center text-slate-500 font-mono tabular-nums">
                    <span className="flex flex-col items-center gap-1 sm:flex-row sm:gap-2 sm:items-center">
                        <span>{dateText}</span>
                        <span>{timeText}</span>
                    </span>
                </span>
                <span className="justify-self-end text-slate-500">{centerText}</span>
            </div>
        </footer>
    );
}
