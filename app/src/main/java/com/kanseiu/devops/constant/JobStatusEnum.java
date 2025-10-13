package com.kanseiu.devops.constant;

import lombok.AllArgsConstructor;
import lombok.Getter;

// 定时任务的状态枚举
@Getter
@AllArgsConstructor
public enum JobStatusEnum {

    DISABLED("禁用", "数据库内的JOB的 disabled = true"),
    PAUSED("暂停", "!DISABLED && 未注册到CRON调度器"),
    READY("准备", "!DISABLED && 已注册到CRON调度器"),
    RUNNING("运行中", "!DISABLED && 已注册到CRON调度器 && 调度器已启动")
    ;

    // 状态名称
    public final String statusName;

    // 状态描述
    public final String statusDesc;

    // 根据禁用状态、注册状态、调度器启动状态，获取JOB状态
    public static JobStatusEnum get(boolean disabled, boolean registered, boolean schedulerStarted) {
        if (disabled) {
            return DISABLED;
        } else if (!registered) {
            // 启用但未注册，则状态为 PAUSED
            return PAUSED;
        } else if (!schedulerStarted) {
            // 启用了、注册了，但是调度器未启动，则状态为 READY
            return READY;
        } else {
            return RUNNING;
        }
    }
}
