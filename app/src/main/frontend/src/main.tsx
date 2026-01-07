// 中文注释：应用入口，挂载到 #root
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { ConfirmProvider } from '@/components/ConfirmDialog';
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <ConfirmProvider>
            <RouterProvider router={router} />
        </ConfirmProvider>
    </React.StrictMode>
);
