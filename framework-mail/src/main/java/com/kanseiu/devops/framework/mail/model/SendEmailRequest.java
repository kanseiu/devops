package com.kanseiu.devops.framework.mail.model;

import com.kanseiu.devops.framework.base.notify.model.SendMessageRequest;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

// 发送邮件消息请求
@Data
@EqualsAndHashCode(callSuper = true)
@ToString
public class SendEmailRequest extends SendMessageRequest {

    private static final long serialVersionUID = 1L;

    // 发送对象
    private String to;

    // 主题
    private String subject;

    // 内容
    private String mes;
}
