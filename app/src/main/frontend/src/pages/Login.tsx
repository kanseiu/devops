import {useMemo, useState} from 'react';
import {useLocation} from 'react-router-dom';
import LabeledInput from '@/components/LabeledInput';

function getCookie(name: string) {
    return document.cookie.split('; ').find(x => x.startsWith(name + '='))?.split('=')[1] || '';
}

export default function Login() {
    const location = useLocation();
    const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
    const hasError = params.has('error');
    const csrf = getCookie('XSRF-TOKEN');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    return (
        <div className="app-shell min-h-screen flex items-center justify-center px-4">
            <div className="w-[420px] max-w-[92vw] bg-white border border-gray-200 rounded-2xl shadow-card p-6 page-content">
                <div className="mb-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-gray-400">kanseiu</div>
                    <div className="text-lg font-semibold text-gray-800">内部运维工具</div>
                </div>
                <div className="text-xs text-gray-500 mb-4">请输入账号和密码</div>

                {hasError && (
                    <div className="mb-4 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                        登录失败，请检查账号或密码。
                    </div>
                )}

                <form action="/login" method="post" className="space-y-3">
                    <input type="hidden" name="_csrf" value={csrf} />
                    <LabeledInput
                        label="用户名"
                        name="username"
                        value={username}
                        onChange={setUsername}
                        placeholder="admin"
                        autoComplete="username"
                    />
                    <LabeledInput
                        label="密码"
                        name="password"
                        type="password"
                        value={password}
                        onChange={setPassword}
                        placeholder="••••••••"
                        autoComplete="current-password"
                    />

                    <div className="flex justify-end pt-2">
                        <button
                            type="submit"
                            className="px-3.5 py-2 rounded-lg text-white text-sm bg-blue-600 hover:bg-blue-700"
                        >
                            登录
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
