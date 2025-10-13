package com.kanseiu.devops.framework.mail.callback;

import com.kanseiu.devops.framework.mail.model.SendMessageRequest;
import com.kanseiu.devops.framework.mail.model.SendMessageResult;

// 发送消息（邮件、短信等）的回调
public interface SendMessageCallback<T extends SendMessageRequest> {

    void done(SendMessageResult<T> result);

}
