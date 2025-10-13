// 中文注释：统一兜底 API 异常，返回 {code,msg,data}；开发环境附带 stack
package com.kanseiu.devops.config;

import com.kanseiu.devops.model.R;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import javax.servlet.http.HttpServletRequest;

@RestControllerAdvice
public class GlobalApiExceptionHandler {

    @ExceptionHandler(Throwable.class)
    public R<Object> handle(Throwable ex, HttpServletRequest req) {
        String uri = req.getRequestURI();
        // 中文注释：仅拦截 /api/**，页面错误仍交给默认/你的 SPA 兜底
        if (uri != null && uri.startsWith("/api")) {
            ex.printStackTrace();
            String msg = ex.getMessage() != null ? ex.getMessage() : ex.getClass().getSimpleName();
            return R.error(msg);
        }
        // 中文注释：非 /api/** 放行，交给默认错误处理
        throw new RuntimeException(ex);
    }

}