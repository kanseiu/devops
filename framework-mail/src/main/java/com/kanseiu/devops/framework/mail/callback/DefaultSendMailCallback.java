package com.kanseiu.devops.framework.mail.callback;

import com.kanseiu.devops.framework.mail.model.SendMessageRequest;
import com.kanseiu.devops.framework.mail.model.SendMessageResult;

public class DefaultSendMailCallback implements SendMessageCallback<SendMessageRequest> {

    @Override
    public void done(SendMessageResult<SendMessageRequest> result) {
        System.out.println("触发邮件发送回调默认实现：" + result.toString());
    }
}
