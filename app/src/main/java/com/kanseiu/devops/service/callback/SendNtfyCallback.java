package com.kanseiu.devops.service.callback;

import com.kanseiu.devops.constant.JobLogStatus;
import com.kanseiu.devops.framework.base.notify.api.SendMessageCallback;
import com.kanseiu.devops.framework.base.notify.model.SendMessageResult;
import com.kanseiu.devops.framework.ntfy.model.SendNtfyRequest;
import com.kanseiu.devops.service.business.DevCronJobNotifyLogService;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;

@Component
public class SendNtfyCallback implements SendMessageCallback<SendNtfyRequest> {

    @Resource
    private DevCronJobNotifyLogService devCronJobNotifyLogService;

    @Override
    public void done(SendMessageResult<SendNtfyRequest> result) {
        SendNtfyRequest sendMessageRequest = result.getSendMessageRequest();
        // 获取通知日志ID
        Long notifyLogId = sendMessageRequest.getBusinessId();
        // 更新状态
        JobLogStatus jobLogStatus = JobLogStatus.fromExit(result.getCode());
        devCronJobNotifyLogService.end(notifyLogId, jobLogStatus.name(), result.getMes());
    }

}
