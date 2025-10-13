package com.kanseiu.devops.model.response;

import cn.hutool.core.date.DatePattern;
import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.TableField;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
public class DevCronJobLogResp implements Serializable {

    private static final long serialVersionUID = 1L;

    // 定时任务日志表ID
    private Long id;

    /** 定时任务表ID */
    private Long jobId;

    // 定时任务名称
    private String jobName;

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
}
