package com.kanseiu.devops.model.entity;

import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.annotation.*;
import com.kanseiu.devops.constant.JobTypeEnum;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.Objects;

// 中文注释：实体类（dev_cron_job）
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("dev_cron_job")
public class DevCronJob extends BaseEntity {

    @TableId(type = IdType.AUTO)
    private Long id;

    // 任务名称（唯一）
    private String jobName;

    // 任务类型（SHELL、SQL）
    private String jobType;

    // Cron 表达式（秒级）
    @TableField("cron_expr")
    private String cronExpr;

    // 脚本名（外键-逻辑）
    private String scriptName;

    // 服务器ID
    private Long serverId;

    // 数据库ID
    private Long databaseId;

    // 附加参数
    private String argsText;

    // 超时秒
    private Integer timeoutSec;

    // 是否禁用
    private Boolean disabled = false;

    // 描述
    private String descText;



    // 下次执行时间
    @TableField(exist = false)
    private Object nextRunTime;

    // 运行状态：RUNNING/READY/PAUSED/DISABLED
    @TableField(exist = false)
    private String status;

    // 简单数据校验
    public void check() {
        if (StrUtil.isBlank(jobName)) {
            throw new IllegalArgumentException("任务名称不能为空");
        }
        if (StrUtil.isBlank(cronExpr)) {
            throw new IllegalArgumentException("Cron 表达式不能为空");
        }
        if (StrUtil.isBlank(scriptName)) {
            throw new IllegalArgumentException("脚本名称不能为空");
        }
        if (StrUtil.isBlank(jobType)) {
            throw new IllegalArgumentException("任务类型不能为空");
        } else {
            // 校验任务类型和必填
            if(JobTypeEnum.SHELL.name().equals(jobType) && Objects.isNull(serverId)) {
                throw new IllegalArgumentException("目标服务器不能为空");
            } else if(JobTypeEnum.SQL.name().equals(jobType) && Objects.isNull(databaseId)) {
                throw new IllegalArgumentException("目标数据库不能为空");
            }
        }

        if (timeoutSec != null && (timeoutSec <= 0 || timeoutSec > 86400)) {
            throw new IllegalArgumentException("超时需在 1~86400 秒");
        }
    }
}