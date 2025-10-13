package com.kanseiu.devops.model.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.EqualsAndHashCode;

// 定时任务执行通知配置表
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("dev_cron_job_notify")
public class DevCronJobNotify extends BaseEntity {

    /** 主键ID */
    @TableId(type = IdType.AUTO)
    private Long id;

    /** 关联定时任务ID */
    private Long devCronJobId;

    /** 关联通知目标ID */
    private Long devNotifyTargetId;

    /** 触发状态集合，逗号分隔，例如：FAIL,TIMEOUT,ERROR */
    private String notifyOnStatus;

    /** 是否禁用：0启用，1禁用 */
    private Boolean disabled;

    /** 用户名称（可与系统用户映射） */
    @TableField(exist = false)
    private String username;

    /** 通知方式，PHONE、EMAIL等 */
    @TableField(exist = false)
    private String notifyType;

    /** 通知方式内容，如手机号、邮箱地址，对应上方 */
    @TableField(exist = false)
    private String notifyTypeContent;

    // 备注
    @TableField(exist = false)
    private String descText;
}