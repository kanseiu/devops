package com.kanseiu.devops.framework.ntfy.model;

import com.kanseiu.devops.framework.base.notify.model.SendMessageRequest;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

// 发送NTFY消息请求
@Data
@EqualsAndHashCode(callSuper = true)
@ToString
@AllArgsConstructor
public class SendNtfyRequest extends SendMessageRequest {

    // 主题名，例如：devops-alert
    private String topic;

    // Bearer token（可为空，但在 deny-all 下基本就是 401/403）
    private String token;

    // 标题（Header: Title）
    private String title;

    // 内容（Body）
    private String message;
}