package com.kanseiu.devops.model.response;

import cn.hutool.core.date.DatePattern;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
public class DevServerResponse implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long id;

    // 显示名
    private String name;

    // 主机/IP
    private String host;

    // SSH 端口
    private Integer port;

    // 用户名
    private String username;

    // 鉴权类型：password / privateKey
    private String authType;

    // 标签（分组使用）
    private String labels;

    // 是否禁用
    private Boolean disabled;

    // 创建时间
    @JsonFormat(pattern = DatePattern.NORM_DATETIME_PATTERN)
    private LocalDateTime createdTime;

    // 更新时间
    @JsonFormat(pattern = DatePattern.NORM_DATETIME_PATTERN)
    private LocalDateTime updatedTime;
}
