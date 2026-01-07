package com.kanseiu.devops.framework.base.notify.api;

import com.kanseiu.devops.framework.base.notify.model.SendMessageRequest;
import com.kanseiu.devops.framework.base.notify.model.SendMessageResult;

public class DefaultSendMessageCallback implements SendMessageCallback<SendMessageRequest> {

    @Override
    public void done(SendMessageResult<SendMessageRequest> result) {
        System.out.println("触发发送消息通知回调的默认实现：" + result.toString());
    }
}
