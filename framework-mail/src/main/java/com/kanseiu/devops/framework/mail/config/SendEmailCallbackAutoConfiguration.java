package com.kanseiu.devops.framework.mail.config;

import com.kanseiu.devops.framework.base.notify.api.SendMessageCallback;
import com.kanseiu.devops.framework.mail.callback.DefaultSendMailCallback;
import com.kanseiu.devops.framework.mail.model.SendEmailRequest;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

// 发送邮件结束后的回调配置类
@Configuration
public class SendEmailCallbackAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean(SendMessageCallback.class)
    public SendMessageCallback<SendEmailRequest> sendEmailCallback() {
        return new DefaultSendMailCallback();
    }

}
