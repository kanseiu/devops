// 中文注释：路由表（无全局菜单，页面通过 <a> 超链接跳转）
import { createBrowserRouter } from 'react-router-dom';
import Home from '@/pages/Home';
import Servers from '@/pages/Servers';
import Scripts from '@/pages/Scripts';
import Checks from '@/pages/Checks';
import Databases from "@/pages/Databases";
import NotifyTargets from "@/pages/NotifyTargets";

export const router = createBrowserRouter([
    { path: '/', element: <Home /> },
    { path: '/servers', element: <Servers /> },
    { path: '/scripts', element: <Scripts /> },
    { path: '/checks', element: <Checks /> },
    { path: '/databases', element: <Databases /> },
    { path: '/notifyTargets', element: <NotifyTargets /> },
]);