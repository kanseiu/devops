package com.kanseiu.devops.framework.base.notify.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.ThreadPoolExecutor;

@Configuration
public class SendMessagePoolConfig {

    // 受控线程池，限制并发与队列，避免把SMTP打爆
    @Bean
    public ThreadPoolTaskExecutor sendMesExecutor() {
        ThreadPoolTaskExecutor ex = new ThreadPoolTaskExecutor();
        ex.setThreadNamePrefix("send-mes-");
        ex.setCorePoolSize(4);
        ex.setMaxPoolSize(8);
        ex.setQueueCapacity(200);
        ex.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy()); // 拒绝策略：回退到调用线程
        ex.initialize();
        return ex;
    }

}
