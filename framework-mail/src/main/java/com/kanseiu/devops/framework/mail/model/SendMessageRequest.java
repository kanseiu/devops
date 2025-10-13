package com.kanseiu.devops.framework.mail.model;

import lombok.Data;
import lombok.ToString;

import java.io.Serializable;

// 发送消息请求
@Data
@ToString
public class SendMessageRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    // 发送对象
    private String to;

    // 主题
    private String subject;

    // 内容
    private String mes;
}
