package com.kanseiu.devops.model.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

// 中文注释：前端所需的任务列表响应对象
@Data
@AllArgsConstructor
@NoArgsConstructor
public class CronJobListResp implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long id;                  // 任务ID

    private String jobName;           // 名称

    private String cron;              // Cron 表达式（秒级）

    private String scriptName;        // 关联脚本名

    private Long serverId;            // 目标服务器ID

    private String args;              // 附加参数
    private Integer timeoutSec;       // 超时（秒）
    private Boolean disabled;          // 是否启用
    private String descText;          // 描述
    private String jobType;
    private Long databaseId;

    // 中文注释：展示用（可选）
    private Object lastRunTime;       // 上次执行时间（预留：暂不计算，返回 null）
    private Object nextRunTime;       // 下次执行时间（预留：暂不计算，返回 null）
    private String status;            // 运行状态：RUNNING/READY/PAUSED/DISABLED
}