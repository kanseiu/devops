package com.kanseiu.devops.framework.mail.model;

import lombok.Data;
import lombok.ToString;

import java.io.Serializable;

// 发送消息结果
@Data
@ToString
public class SendMessageResult<T extends SendMessageRequest> implements Serializable {

    private static final long serialVersionUID = 1L;

    protected SendMessageResult() {

    }

    public SendMessageResult(T sendMessageRequest) {
        this.sendMessageRequest = sendMessageRequest;
    }

    // 把请求返回去
    private T sendMessageRequest;

    // 发送结果CODE，0 成功，-1 失败
    private Integer code;

    // 发送结果的消息，可能没有
    private String mes;
}
