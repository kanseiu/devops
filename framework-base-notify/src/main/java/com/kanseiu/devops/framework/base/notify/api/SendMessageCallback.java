package com.kanseiu.devops.framework.base.notify.api;

import com.kanseiu.devops.framework.base.notify.model.SendMessageRequest;
import com.kanseiu.devops.framework.base.notify.model.SendMessageResult;

// 发送消息（邮件、短信等）的回调
public interface SendMessageCallback<T extends SendMessageRequest> {

    void done(SendMessageResult<T> result);

}
