package com.kanseiu.devops.framework.mail.config;

import com.kanseiu.devops.framework.mail.callback.DefaultSendMailCallback;
import com.kanseiu.devops.framework.mail.callback.SendMessageCallback;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

// 发送邮件结束后的回调配置类
@Configuration
public class SendMessageCallbackAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean(SendMessageCallback.class)
    public SendMessageCallback sendMessageCallback() {
        return new DefaultSendMailCallback();
    }

}
