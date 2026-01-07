package com.kanseiu.devops.framework.ntfy.config;

import com.kanseiu.devops.framework.base.notify.api.SendMessageCallback;
import com.kanseiu.devops.framework.ntfy.callback.DefaultSendNtfyCallback;
import com.kanseiu.devops.framework.ntfy.model.SendNtfyRequest;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

// 发送NTFY结束后的回调配置类
@Configuration
public class SendNtfyCallbackAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean(SendMessageCallback.class)
    public SendMessageCallback<SendNtfyRequest> sendNtfyCallback() {
        return new DefaultSendNtfyCallback();
    }

}
