// 中文注释：直接把构建输出到后端的 resources/static
import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'url';

export default defineConfig({
    build: {
        outDir: '../resources/static',   // ← 关键：输出到后端静态目录
        emptyOutDir: true,               // 每次清空旧产物
        sourcemap: false
    },
    resolve: {
        alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }
    }
});