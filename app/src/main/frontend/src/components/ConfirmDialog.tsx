import {createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState} from 'react';

type ConfirmOptions = {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    tone?: 'default' | 'danger';
};

type ConfirmState = ConfirmOptions & {
    open: boolean;
};

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function useConfirm(): ConfirmFn {
    const ctx = useContext(ConfirmContext);
    if (!ctx) {
        throw new Error('useConfirm must be used within ConfirmProvider');
    }
    return ctx;
}

export function ConfirmProvider({children}: { children: ReactNode }) {
    const [state, setState] = useState<ConfirmState>({
        open: false,
        title: '确认操作',
        message: '',
        confirmText: '确认',
        cancelText: '取消',
        tone: 'default',
    });
    const resolverRef = useRef<((v: boolean) => void) | null>(null);

    const confirm = useCallback((options: ConfirmOptions) => {
        return new Promise<boolean>((resolve) => {
            resolverRef.current = resolve;
            setState({
                open: true,
                title: options.title ?? '确认操作',
                message: options.message,
                confirmText: options.confirmText ?? '确认',
                cancelText: options.cancelText ?? '取消',
                tone: options.tone ?? 'default',
            });
        });
    }, []);

    const close = (result: boolean) => {
        setState(prev => ({...prev, open: false}));
        if (resolverRef.current) {
            resolverRef.current(result);
            resolverRef.current = null;
        }
    };

    useEffect(() => {
        if (!state.open) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                close(false);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [state.open]);

    return (
        <ConfirmContext.Provider value={confirm}>
            {children}
            {state.open && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45">
                    <div className="w-[420px] max-w-[92vw] bg-white rounded-2xl shadow-2xl p-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="font-semibold text-gray-800">{state.title}</div>
                            <button
                                onClick={() => close(false)}
                                className="w-8 h-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
                                aria-label="close"
                            >
                                ×
                            </button>
                        </div>
                        <div className="text-sm text-gray-600 leading-6 mb-4 whitespace-pre-wrap">
                            {state.message}
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => close(true)}
                                className={`px-3.5 py-2 rounded-lg text-white text-sm ${
                                    state.tone === 'danger'
                                        ? 'bg-rose-600 hover:bg-rose-700'
                                        : 'bg-blue-600 hover:bg-blue-700'
                                }`}
                            >
                                {state.confirmText}
                            </button>
                            <button
                                onClick={() => close(false)}
                                className="px-3.5 py-2 rounded-lg border text-sm bg-white border-gray-200 hover:bg-gray-50"
                            >
                                {state.cancelText}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ConfirmContext.Provider>
    );
}
