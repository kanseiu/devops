import {Link, useLocation} from 'react-router-dom';

export type NavItem = { label: string; to: string };

export const NAV_ITEMS: NavItem[] = [
    { label: '首页', to: '/' },
    { label: '服务器', to: '/servers' },
    { label: '脚本', to: '/scripts' },
    { label: '任务', to: '/checks' },
    { label: '数据库', to: '/databases' },
    { label: '通知方式', to: '/notifyTargets' },
];

type AppNavProps = {
    className?: string;
    linkClassName?: string;
    activeClassName?: string;
};

export default function AppNav({
    className = 'flex flex-nowrap items-center justify-center gap-3 text-base text-slate-600 h-10',
    linkClassName = 'inline-flex items-center justify-center h-10 px-4 rounded-full whitespace-nowrap hover:text-slate-900 hover:bg-slate-100 transition',
    activeClassName = 'inline-flex items-center justify-center h-10 px-4 rounded-full whitespace-nowrap font-semibold text-slate-900 cursor-not-allowed',
}: AppNavProps) {
    const location = useLocation();

    return (
        <nav className={className}>
            {NAV_ITEMS.map((item) => {
                const isCurrent = location.pathname === item.to;
                return (
                    <span key={item.to}>
                        {isCurrent ? (
                            <span className={activeClassName} aria-current="page">
                                {item.label}
                            </span>
                        ) : (
                            <Link to={item.to} className={linkClassName}>
                                {item.label}
                            </Link>
                        )}
                    </span>
                );
            })}
        </nav>
    );
}
