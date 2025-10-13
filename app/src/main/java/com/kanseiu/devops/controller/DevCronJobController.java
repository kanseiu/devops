package com.kanseiu.devops.controller;

import cn.hutool.extra.spring.SpringUtil;
import com.kanseiu.devops.constant.JobTypeEnum;
import com.kanseiu.devops.cron.CronScheduler;
import com.kanseiu.devops.model.R;
import com.kanseiu.devops.model.entity.DevCronJob;
import com.kanseiu.devops.service.business.DevCronJobService;
import com.kanseiu.devops.service.handler.DevScriptExecService;
import com.kanseiu.devops.service.callback.SseCallback;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import javax.annotation.Resource;
import java.io.IOException;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;

// 中文注释：定时任务控制器
@RestController
@RequestMapping("/api/cron")
public class DevCronJobController {

    @Resource
    private DevCronJobService devCronJobService;

    @Resource
    private CronScheduler cronScheduler;

    // 任务列表
    @GetMapping("/jobs")
    public R<List<DevCronJob>> list() {
        return R.ok(devCronJobService.listAll());
    }

    // 保存（新增/更新）
    @PostMapping("/job/save")
    public R<Map<String, Object>> save(@RequestBody DevCronJob req) {
        Long id;
        if(Objects.isNull(req.getId())) {
            // 新增
            id = devCronJobService.add(req);
        } else {
            // 更新
            id = devCronJobService.update(req);
        }
        return R.ok(Collections.singletonMap("id", id));
    }

    // 从数据库重载任务
    @GetMapping("/reload")
    public R<?> reload() {
        devCronJobService.reloadAll();
        return R.ok();
    }

    // 执行一次定时任务，并将结果流式输出到浏览器
    @GetMapping(value = "/job/runOnce/{id}/stream", produces = "text/event-stream")
    public SseEmitter runOnceStream(@PathVariable("id") Long id) throws IOException {

        // 超时可按需设置（毫秒）
        SseEmitter emitter = new SseEmitter(30 * 60 * 1000L);

        DevCronJob job = devCronJobService.getById(id);
        if (job == null) {
            // 立刻告知前端错误并结束
            try {
                emitter.send(SseEmitter.event().name("stderr").data("任务不存在: id=" + id));
                emitter.send(SseEmitter.event().name("end").data(-1));
            } catch (IOException ignored) {}
            emitter.complete();
            return emitter;
        }

        // 根据JOB类型，获取bean
        String execBeanName = JobTypeEnum.getExecBeanNameByType(job.getJobType());
        DevScriptExecService scriptExecService = SpringUtil.getBean(execBeanName, DevScriptExecService.class);

        // 异步执行，逐行回调
        scriptExecService.execute(job, new SseCallback(emitter));

        // 4) 客户端断开处理（可选：中断执行）
        emitter.onTimeout(() -> {
            try { emitter.send(SseEmitter.event().name("stderr").data("[timeout] SSE 超时")); } catch (IOException ignored) {}
            emitter.complete();
        });
        emitter.onCompletion(() -> {
            // TODO：如需“点×关闭弹窗时中断执行”，可在这里设置标志并让 liveExecService 停止任务
        });

        return emitter;
    }

    // 启动调度器
    @PostMapping("/start")
    public R<Map<String, Object>> start() {
        cronScheduler.start();
        Map<String, Object> data = cronScheduler.status();
        return R.ok(data, "调度器已启动并重载任务");
    }

    // 停止调度器
    @PostMapping("/stop")
    public R<Map<String, Object>> stop() {
        cronScheduler.stop();
        Map<String, Object> data = cronScheduler.status();
        return R.ok(null, "调度器已停止");
    }

    // 查询状态
    @GetMapping("/status")
    public R<Map<String, Object>> status() {
        return R.ok(cronScheduler.status());
    }

    // 暂停单个任务
    @PostMapping("/job/pause/{id}")
    public R<?> pause(@PathVariable("id") Long id) {
        devCronJobService.pause(id);
        return R.ok(null, "任务已暂停");
    }

    // 恢复启动单个任务
    @PostMapping("/job/resume/{id}")
    public R<Map<String, Object>> resume(@PathVariable("id") Long id) {
        devCronJobService.resume(id);
        return R.ok(null, "任务已恢复");
    }
}