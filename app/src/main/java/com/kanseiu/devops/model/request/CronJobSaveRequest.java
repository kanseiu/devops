package com.kanseiu.devops.model.request;

import lombok.Data;

import java.io.Serializable;

// 定时任务保存参数
@Data
public class CronJobSaveRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    // 更新时必带；新增为空
    private Long id;

    // 任务名称（唯一）
    private String jobName;

    // Cron 表达式（秒级）
    private String cron;

    // 任务类型，SHELL、SQL等
    private String jobType;

    // 脚本名
    private String scriptName;

    // 服务器ID
    private Long serverId;

    // 数据库ID
    private Long databaseId;

    // 附加参数
    private String args;

    // 超时（秒）
    private Integer timeoutSec;

    // 是否启用
    private Boolean disabled;

    // 描述
    private String descText;
}