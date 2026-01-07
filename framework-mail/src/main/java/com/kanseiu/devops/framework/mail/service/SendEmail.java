package com.kanseiu.devops.framework.mail.service;

import com.kanseiu.devops.framework.base.notify.api.SendMessageCallback;
import com.kanseiu.devops.framework.mail.model.SendEmailRequest;
import com.kanseiu.devops.framework.base.notify.model.SendMessageResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;

@Slf4j
@Component
public class SendEmail {

    @Resource
    private ThreadPoolTaskExecutor sendMesExecutor;

    @Resource
    private SendMessageCallback<SendEmailRequest> sendEmailCallback;

    @Resource
    private MailService mailService;

    // 发送html
    public <T extends SendEmailRequest> void html(T sendMessageRequest) {
        this.send(sendMessageRequest, true);
    }

    // 发送纯文本
    public <T extends SendEmailRequest> void text(T sendMessageRequest) {
        this.send(sendMessageRequest, false);
    }

    // 异步发送邮件
    private void send(SendEmailRequest sendMessageRequest, boolean html) {
        log.info("开始发送EMAIL消息，请求参数：{}", sendMessageRequest);
        sendMesExecutor.execute(() -> {
            SendMessageResult<SendEmailRequest> result = new SendMessageResult<>(sendMessageRequest);
            result.setCode(0);
            try {
                mailService.sendEmail(sendMessageRequest.getTo(), sendMessageRequest.getSubject(), sendMessageRequest.getMes(), html);
            } catch (Exception e) {
                log.error("发送邮件失败！", e);
                result.setMes(e.getMessage());
                result.setCode(-1);
            } finally {
                sendEmailCallback.done(result);
            }
        });
    }
}
