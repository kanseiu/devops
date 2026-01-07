import {Link, useLocation} from 'react-router-dom';

type NavItem = { label: string; to: string };

const NAV_ITEMS: NavItem[] = [
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
    separatorClassName?: string;
};

export default function AppNav({
    className = 'text-sm text-gray-600',
    linkClassName = 'hover:text-gray-900',
    activeClassName = 'text-gray-500 font-semibold underline underline-offset-4 cursor-not-allowed',
    separatorClassName = 'mx-2 text-gray-300',
}: AppNavProps) {
    const location = useLocation();

    return (
        <nav className={className}>
            {NAV_ITEMS.map((item, idx) => {
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
                        {idx < NAV_ITEMS.length - 1 && <span className={separatorClassName}>·</span>}
                    </span>
                );
            })}
        </nav>
    );
}
