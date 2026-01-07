package com.kanseiu.devops.framework.ntfy.callback;

import com.kanseiu.devops.framework.base.notify.api.SendMessageCallback;
import com.kanseiu.devops.framework.base.notify.model.SendMessageResult;
import com.kanseiu.devops.framework.ntfy.model.SendNtfyRequest;

public class DefaultSendNtfyCallback implements SendMessageCallback<SendNtfyRequest> {

    @Override
    public void done(SendMessageResult<SendNtfyRequest> result) {
        System.out.println("触发NTFY回调默认实现：" + result.toString());
    }
}
