package com.kanseiu.devops.service.callback;

import com.kanseiu.devops.constant.JobLogStatus;
import com.kanseiu.devops.framework.mail.callback.SendMessageCallback;
import com.kanseiu.devops.framework.mail.model.SendMessageResult;
import com.kanseiu.devops.model.request.SendEmailRequest;
import com.kanseiu.devops.service.business.DevCronJobNotifyLogService;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;

@Component
public class SendMailCallback implements SendMessageCallback<SendEmailRequest> {

    @Resource
    private DevCronJobNotifyLogService devCronJobNotifyLogService;

    @Override
    public void done(SendMessageResult<SendEmailRequest> result) {
        SendEmailRequest sendMessageRequest = result.getSendMessageRequest();
        // 获取通知日志ID
        Long notifyLogId = sendMessageRequest.getBusinessId();
        // 更新状态
        JobLogStatus jobLogStatus = JobLogStatus.fromExit(result.getCode());
        devCronJobNotifyLogService.end(notifyLogId, jobLogStatus.name(), result.getMes());
    }

}
