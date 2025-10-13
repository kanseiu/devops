package com.kanseiu.devops.cron;

import cn.hutool.cron.CronUtil;
import cn.hutool.cron.Scheduler;
import com.kanseiu.devops.service.business.DevCronJobService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.DependsOn;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import javax.annotation.Resource;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.locks.ReentrantLock;

@Slf4j
@Component
public class CronScheduler {

    private final ReentrantLock lock = new ReentrantLock();

    @Resource
    private DevCronJobService devCronJobService;

    public void schedulerInit() {
        // 开启秒级匹配
        CronUtil.setMatchSecond(true);
        // 启动
        this.start();
    }

    // 启动调度器，并从DB重载任务
    public void start() {
        lock.lock();
        try {
            // 如果调度器没启动，则启动
            if (!isStarted()) {
                // 启动前，做一次全量重载，确保内存任务与DB一致
                devCronJobService.reloadAll();
                // 启动调度器
                CronUtil.start();
            }
        } finally {
            lock.unlock();
        }
    }

    // 停止调度器
    public void stop() {
        lock.lock();
        try {
            if (isStarted()) {
                // 停止调度器
                CronUtil.stop();
            }
        } finally {
            lock.unlock();
        }
    }

    // 调度器状态信息
    public Map<String, Object> status() {
        Map<String, Object> m = new HashMap<>();
        boolean started = isStarted();
        m.put("started", started);
        m.put("status", started ? "STARTED" : "STOPPED");
        try {
            Scheduler scheduler = CronUtil.getScheduler();
            int size = (scheduler != null && scheduler.getTaskTable() != null) ? scheduler.getTaskTable().size() : 0;
            m.put("registeredTasks", size); // 已注册任务数
        } catch (Exception ignore) {
            m.put("registeredTasks", 0);
        }
        return m;
    }

    // 判断调度器是否已启动
    public boolean isStarted() {
        try {
            return CronUtil.getScheduler() != null && CronUtil.getScheduler().isStarted();
        } catch (Exception e) {
            log.error("查询调度器启动状态失败！", e);
            return false;
        }
    }

}
