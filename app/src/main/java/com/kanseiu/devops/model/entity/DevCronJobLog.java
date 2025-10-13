package com.kanseiu.devops.model.entity;

import cn.hutool.core.date.DatePattern;
import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 定时任务执行日志表
 */
@Data
@TableName("dev_cron_job_log")
public class DevCronJobLog {

    /** 主键ID */
    @TableId(type = IdType.AUTO)
    private Long id;

    /** 定时任务表ID */
    private Long jobId;

    // 定时任务名称
    @TableField(exist = false)
    private String jobName;

    /** 连接信息（host或JDBC） */
    private String connectInfo;

    /** 脚本名称 */
    private String scriptName;

    /** 脚本内容（纯文本） */
    private String scriptContent;

    /** 附加参数 */
    private String argsText;

    /** 创建时间 */
    @JsonFormat(pattern = DatePattern.NORM_DATETIME_PATTERN)
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    /** 开始时间 */
    @JsonFormat(pattern = DatePattern.NORM_DATETIME_PATTERN)
    private LocalDateTime startTime;

    /** 结束时间 */
    @JsonFormat(pattern = DatePattern.NORM_DATETIME_PATTERN)
    private LocalDateTime endTime;

    /** 耗时(毫秒) */
    private Long durationMs;

    /** 退出码 */
    private Integer exitCode;

    /** 状态：SUCCESS / FAIL / TIMEOUT / ERROR */
    private String status;

    /** 标准输出（可截断） */
    private String outputText;

    /** 错误输出（可截断） */
    private String errorText;
}