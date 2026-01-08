import {useEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {Link, useLocation} from 'react-router-dom';
import AppNav, {NAV_ITEMS} from '@/components/AppNav';

type AppHeaderProps = {
    title: string;
};

export default function AppHeader({title}: AppHeaderProps) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [compactNav, setCompactNav] = useState(false);
    const navWrapRef = useRef<HTMLDivElement | null>(null);
    const location = useLocation();

    useEffect(() => {
        const wrapper = navWrapRef.current;
        if (!wrapper) return;
        const nav = wrapper.querySelector('nav');
        if (!nav) return;

        const evaluate = () => {
            const needsCompact = nav.scrollWidth > wrapper.clientWidth + 2;
            setCompactNav(needsCompact);
        };

        evaluate();
        const resizeObserver = new ResizeObserver(evaluate);
        resizeObserver.observe(wrapper);
        resizeObserver.observe(nav);
        if ('fonts' in document) {
            (document as Document & { fonts?: FontFaceSet }).fonts?.ready.then(evaluate).catch(() => undefined);
        }
        window.addEventListener('resize', evaluate);
        return () => {
            resizeObserver.disconnect();
            window.removeEventListener('resize', evaluate);
        };
    }, []);

    useEffect(() => {
        if (!menuOpen) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                setMenuOpen(false);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [menuOpen]);

    useEffect(() => {
        if (!menuOpen) return;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, [menuOpen]);

    useEffect(() => {
        if (!compactNav && menuOpen) {
            setMenuOpen(false);
        }
    }, [compactNav, menuOpen]);

    return (
        <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-gray-100">
            <div className="mx-auto max-w-6xl px-4 py-4 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4">
                <div className="min-w-0 max-w-[46vw]">
                    <div className="text-[11px] uppercase tracking-[0.35em] text-slate-400">kanseiu</div>
                    <h1 className="text-xl font-semibold text-slate-900 truncate">{title}</h1>
                </div>
                <div className="min-w-0 w-full flex justify-center overflow-hidden" ref={navWrapRef}>
                    <div className={`${compactNav ? 'opacity-0 pointer-events-none' : 'opacity-100'} transition`}>
                        <AppNav />
                    </div>
                </div>
                <div className="flex justify-end">
                    <button
                        type="button"
                        className={`${compactNav ? 'inline-flex' : 'hidden'} items-center justify-center w-10 h-10 rounded-full border border-gray-200 bg-white text-slate-700 hover:bg-slate-50`}
                        aria-label="打开导航菜单"
                        aria-expanded={menuOpen}
                        onClick={() => setMenuOpen(true)}
                    >
                        ☰
                    </button>
                </div>
            </div>
            {menuOpen && createPortal(
                <div className="fixed inset-0 z-[200] flex">
                    <div
                        className="absolute inset-0 bg-slate-900/40"
                        onClick={() => setMenuOpen(false)}
                        aria-hidden="true"
                    />
                    <aside className="relative w-full h-full bg-white p-6 drawer-panel flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <div className="text-xs uppercase tracking-[0.3em] text-slate-400">导航</div>
                            <button
                                type="button"
                                className="w-8 h-8 rounded-full border border-gray-200 bg-white text-slate-700"
                                aria-label="关闭导航菜单"
                                onClick={() => setMenuOpen(false)}
                            >
                                ×
                            </button>
                        </div>
                        <nav className="flex flex-col flex-1 justify-between gap-4 py-2">
                            {NAV_ITEMS.map((item) => {
                                const isCurrent = location.pathname === item.to;
                                return (
                                    <span key={item.to}>
                                        {isCurrent ? (
                                            <span
                                                className="inline-flex w-full items-center justify-between rounded-2xl bg-emerald-600 px-4 py-3 text-base text-white"
                                                aria-current="page"
                                            >
                                                {item.label}
                                            </span>
                                        ) : (
                                            <Link
                                                to={item.to}
                                                className="inline-flex w-full items-center justify-between rounded-2xl px-4 py-3 text-base text-slate-700 hover:bg-slate-50"
                                                onClick={() => setMenuOpen(false)}
                                            >
                                                {item.label}
                                            </Link>
                                        )}
                                    </span>
                                );
                            })}
                        </nav>
                    </aside>
                </div>,
                document.body
            )}
        </header>
    );
}
