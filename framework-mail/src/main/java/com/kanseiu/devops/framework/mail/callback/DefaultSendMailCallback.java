package com.kanseiu.devops.framework.mail.callback;

import com.kanseiu.devops.framework.base.notify.api.SendMessageCallback;
import com.kanseiu.devops.framework.mail.model.SendEmailRequest;
import com.kanseiu.devops.framework.base.notify.model.SendMessageResult;

public class DefaultSendMailCallback implements SendMessageCallback<SendEmailRequest> {

    @Override
    public void done(SendMessageResult<SendEmailRequest> result) {
        System.out.println("触发邮件发送回调默认实现：" + result.toString());
    }
}
