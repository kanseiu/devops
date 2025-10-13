package com.kanseiu.devops.controller;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.kanseiu.devops.framework.mail.service.MailService;
import com.kanseiu.devops.model.R;
import com.kanseiu.devops.model.entity.DevCronJobLog;
import com.kanseiu.devops.model.response.DevCronJobLogResp;
import com.kanseiu.devops.service.business.DevCronJobLogService;
import com.kanseiu.devops.service.renderer.DevCronJobLogHtmlRenderer;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import java.util.List;

// 定时任务执行日志
@RestController
@RequestMapping("/api/cron/job/log")
public class DevCronJobLogController {

    @Resource
    private DevCronJobLogService devCronJobLogService;

    @Resource
    private MailService mailService;

    // 根据定时任务ID，获取最新的10条执行记录
    @GetMapping("{jobId}")
    public R<List<DevCronJobLog>> byJobId(@PathVariable("jobId") Long jobId) {
        List<DevCronJobLog> list = devCronJobLogService.list(Wrappers.<DevCronJobLog>lambdaQuery().
                eq(DevCronJobLog::getJobId, jobId)
                .orderByDesc(DevCronJobLog::getId)
                .last("LIMIT 10"));
        return R.ok(list);
    }

    // 根据定时任务日志ID，获取详情
    @GetMapping("detail/{id}")
    public R<DevCronJobLog> detail(@PathVariable("id") Long id) {
        DevCronJobLog devCronJobLog = devCronJobLogService.getById(id);
        return R.ok(devCronJobLog);
    }

    // 获取今日定时任务执行失败列表
    @GetMapping("todayFail")
    public R<List<DevCronJobLogResp>> todayFailJobLog() {
        return R.ok(devCronJobLogService.getTodayFail());
    }

    // 中文注释：预览接口，返回 text/html，前端可直接打开看样式
    @GetMapping(value = "/mailPreview/{id}")
    public R<String> mailPreview(@PathVariable("id") Long id) throws Exception {
        DevCronJobLog log = devCronJobLogService.getById(id);
        if (log == null) {
            return R.error("<!doctype html><html><head><meta charset='utf-8'><title>日志预览</title></head>"
                    + "<body style='font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, \"Noto Sans\", \"Apple Color Emoji\", \"Segoe UI Emoji\";'>"
                    + "<h2>未找到日志</h2><p>ID=" + id + "</p></body></html>");
        }
        String html = DevCronJobLogHtmlRenderer.renderHtml(log);

        mailService.sendEmail("hanqingyu@hbisco.com", "定时任务执行失败通知", html, true);

        return R.ok(html);
    }

}