package com.kanseiu.devops.model.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.fasterxml.jackson.annotation.JsonFormat;
import cn.hutool.core.date.DatePattern;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 定时任务执行通知日志表实体类
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("dev_cron_job_notify_log")
public class DevCronJobNotifyLog extends BaseEntity {

    /** 主键ID */
    @TableId(type = IdType.AUTO)
    private Long id;

    /** 定时任务执行通知配置表ID */
    private Long devCronJobNotifyId;

    // 定时任务执行日志ID, 可能为负数，表示定时任务执行日志ID不存在
    private Long devCronJobLogId;

    /** 用户名称（可与系统用户映射） */
    private String username;

    /** 通知方式：PHONE/EMAIL/WEBHOOK等 */
    private String notifyType;

    /** 通知地址/号码/URL等 */
    private String notifyTypeContent;

    /** 定时任务名称 */
    private String devCronJobName;

    /** 定时任务执行状态：SUCCESS / FAIL / TIMEOUT / ERROR */
    private String devCronJobLogStatus;

    /** 通知日志状态，RUNNING / SUCCESS / FAIL */
    private String status;

    // 通知发送后的消息，主要指报错
    private String mes;
}