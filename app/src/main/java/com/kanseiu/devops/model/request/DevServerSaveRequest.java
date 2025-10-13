package com.kanseiu.devops.model.request;

import lombok.Data;

import java.io.Serializable;

@Data
public class DevServerSaveRequest implements Serializable {

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

}
