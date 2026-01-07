import {useEffect, useState} from 'react';
import AppNav from '@/components/AppNav';

type AppHeaderProps = {
    title: string;
};

const WEEK_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

function pad2(v: number) {
    return String(v).padStart(2, '0');
}

function formatNow() {
    const d = new Date();
    const y = d.getFullYear();
    const m = pad2(d.getMonth() + 1);
    const day = pad2(d.getDate());
    const hh = pad2(d.getHours());
    const mm = pad2(d.getMinutes());
    const ss = pad2(d.getSeconds());
    const wk = WEEK_LABELS[d.getDay()];
    return `${y}年${m}月${day}日 星期${wk} ${hh}:${mm}:${ss}`;
}

export default function AppHeader({title}: AppHeaderProps) {
    const [nowText, setNowText] = useState(formatNow());

    useEffect(() => {
        const id = window.setInterval(() => setNowText(formatNow()), 1000);
        return () => window.clearInterval(id);
    }, []);

    return (
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-gray-100 shadow-sm">
            <div className="mx-auto max-w-6xl px-4 py-3 grid grid-cols-3 items-center">
                <h1 className="text-xl font-bold">{title}</h1>
                <div className="text-sm text-slate-600 text-center font-mono tabular-nums">
                    {nowText}
                </div>
                <div className="justify-self-end">
                    <AppNav />
                </div>
            </div>
        </header>
    );
}
