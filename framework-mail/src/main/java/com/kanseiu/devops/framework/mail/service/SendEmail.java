package com.kanseiu.devops.framework.mail.service;

import com.kanseiu.devops.framework.mail.callback.SendMessageCallback;
import com.kanseiu.devops.framework.mail.model.SendMessageRequest;
import com.kanseiu.devops.framework.mail.model.SendMessageResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;

@Slf4j
@Component
public class SendEmail {

    @Resource
    private ThreadPoolTaskExecutor mailExecutor;

    @Resource
    private SendMessageCallback sendMessageCallback;

    @Resource
    private MailService mailService;

    // 发送html
    public <T extends SendMessageRequest> void html(T sendMessageRequest) {
        this.send(sendMessageRequest, true);
    }

    // 发送纯文本
    public <T extends SendMessageRequest> void text(T sendMessageRequest) {
        this.send(sendMessageRequest, false);
    }

    // 异步发送邮件
    private <T extends SendMessageRequest> void send(T sendMessageRequest, boolean html) {
        mailExecutor.execute(() -> {
            SendMessageResult<T> result = new SendMessageResult<T>(sendMessageRequest);
            result.setCode(0);
            try {
                mailService.sendEmail(sendMessageRequest.getTo(), sendMessageRequest.getSubject(), sendMessageRequest.getMes(), html);
            } catch (Exception e) {
                log.error("发送邮件失败！请求参数：{}", sendMessageRequest, e);
                result.setMes(e.getMessage());
                result.setCode(-1);
            } finally {
                sendMessageCallback.done(result);
            }
        });
    }
}
