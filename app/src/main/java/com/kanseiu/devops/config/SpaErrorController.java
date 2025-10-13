// 中文注释：把“前端路由导致的 404”转发给 index.html，排除后端接口和控制台路径
package com.kanseiu.devops.config;

import org.springframework.boot.web.servlet.error.ErrorController;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

import javax.servlet.RequestDispatcher;
import javax.servlet.http.HttpServletRequest;

@Controller
public class SpaErrorController implements ErrorController {

    @RequestMapping("/error")
    public String handleError(HttpServletRequest request) {
        Object status = request.getAttribute(RequestDispatcher.ERROR_STATUS_CODE);
        String uri = (String) request.getAttribute(RequestDispatcher.ERROR_REQUEST_URI);

        // 中文注释：仅当 404 且不是接口/控制台/登录/静态资源时，交给前端
        if ("404".equals(String.valueOf(status))
                && uri != null
                && !uri.startsWith("/api")
                && !uri.startsWith("/h2-console")
                && !uri.startsWith("/druid")
                && !"/login".equals(uri)
                && !uri.contains(".")) {
            return "forward:/index.html";
        }
        // 中文注释：其他错误按默认处理（可替换为自定义错误页）
        return null;
    }
}