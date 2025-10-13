package com.kanseiu.devops.model.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

// 服务器实体
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("dev_server")
public class DevServer extends BaseEntity {

    @TableId(type = IdType.AUTO)
    private Long id;

    // 服务器名称
    private String name;

    // 主机/IP
    private String host;

    // SSH 端口
    private Integer port;

    // 用户名
    private String username;

    // 鉴权类型：password / privateKey
    private String authType;

    // 密码
    private String passwordEnc;

    // 私钥内容
    private String privateKeyEnc;

    // 私钥口令（如有）
    private String passphraseEnc;

    // 命令白名单（正则，多行；为空=不限制，生产不建议）
    private String commandAllowList;

    // 默认测试命令
    private String defaultTestCmd;

    // 标签（分组使用）
    private String labels;

    // 是否禁用
    private Boolean disabled = false;
}