package com.kanseiu.devops.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

// 中文注释：把 "/" 与 单层无后缀的路径 交给前端
@Controller
public class IndexController {

    // 中文注释：根路径 -> 前端首页
    @RequestMapping("/")
    public String index() {
        return "forward:/index.html";
    }
}