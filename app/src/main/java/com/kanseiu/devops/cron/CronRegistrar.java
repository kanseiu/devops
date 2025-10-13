package com.kanseiu.devops.cron;

import cn.hutool.cron.CronUtil;
import cn.hutool.cron.pattern.CronPattern;
import cn.hutool.cron.task.Task;
import cn.hutool.extra.spring.SpringUtil;
import com.kanseiu.devops.constant.JobTypeEnum;
import com.kanseiu.devops.model.entity.DevCronJob;
import com.kanseiu.devops.service.handler.DevScriptExecService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

// 调度注册器，将 DB 任务注册到 Hutool Cron 调度器
@Slf4j
@Component
@RequiredArgsConstructor
public class CronRegistrar {

    /** 生成调度器内唯一任务ID（字符串） */
    public static String taskIdOf(Long id) {
        return "job-" + id;
    }

    /**
     * 注册/更新任务
     * @param job DB实体
     */
    public void register(DevCronJob job) {
        final String taskId = taskIdOf(job.getId());

        // 中文注释：先移除旧任务，避免重复
        CronUtil.remove(taskId);

        // 校验 Cron 表达式合法性（Hutool）
        this.checkCronCorrect(job);

        // 根据JOB类型，获取bean
        String execBeanName = JobTypeEnum.getExecBeanNameByType(job.getJobType());
        DevScriptExecService scriptExecService = SpringUtil.getBean(execBeanName, DevScriptExecService.class);

        // 中文注释：包装 Task，执行时从 execService 调用真实逻辑
        Task task = () -> {
            log.info("[Cron] run job#{} jobType={} name={} script={}", job.getId(), job.getJobType(), job.getJobName(), job.getScriptName());
            // 执行
            scriptExecService.execute(job, null);
        };

        // 中文注释：注册到调度器
        CronUtil.schedule(taskId, job.getCronExpr(), task);
    }

    /** 从调度器移除任务（用于禁用/删除） */
    public void unregister(Long id) {
        CronUtil.remove(taskIdOf(id));
    }

    // 检查CRON表达式是否正确
    public void checkCronCorrect(DevCronJob req) {
        // 先做一次 cron 预校验
        try {
            new CronPattern(req.getCronExpr());
        } catch (Exception e) {
            throw new IllegalArgumentException("Cron 表达式不合法：" + req.getCronExpr(), e);
        }
    }
}