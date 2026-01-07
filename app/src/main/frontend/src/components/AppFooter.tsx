import {useState} from 'react';
import AppNav from '@/components/AppNav';
import {useConfirm} from '@/components/ConfirmDialog';

type AppFooterProps = {
    centerText?: string;
};

export default function AppFooter({centerText = 'v1.0 · 内部工具'}: AppFooterProps) {
    const confirm = useConfirm();
    const [loggingOut, setLoggingOut] = useState(false);

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
        <footer className="shrink-0 bg-white border-t border-gray-100 drop-shadow-md">
            <div className="mx-auto max-w-6xl px-4 py-3 text-xs text-gray-500 grid grid-cols-3 items-center">
                <div className="justify-self-start">
                    <button
                        onClick={logout}
                        className={`px-2.5 py-1.5 rounded-lg text-xs text-white ${
                            loggingOut ? 'bg-rose-400 cursor-not-allowed' : 'bg-rose-600 hover:bg-rose-700'
                        }`}
                        disabled={loggingOut}
                    >
                        注销
                    </button>
                </div>
                <span className="justify-self-center">{centerText}</span>
                <div className="justify-self-end">
                    <AppNav
                        className="text-xs text-slate-500"
                        linkClassName="hover:text-slate-800 transition"
                        activeClassName="text-slate-900 font-semibold underline underline-offset-4 cursor-not-allowed"
                        separatorClassName="mx-2 text-slate-300"
                    />
                </div>
            </div>
        </footer>
    );
}
