package com.kanseiu.devops.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

// 线程池
@Configuration
public class ExecPoolConfig {

    // 执行ssh
    @Bean("sshExecPool")
    public org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor sshExecPool() {
        var ex = new org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor();
        ex.setThreadNamePrefix("ssh-exec-");
        ex.setCorePoolSize(4);
        ex.setMaxPoolSize(16);
        ex.setQueueCapacity(100);
        ex.initialize();
        return ex;
    }

    // 执行数据库连接测试
    @Bean("dbExecPool")
    public org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor dbExecPool() {
        var ex = new org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor();
        ex.setThreadNamePrefix("db-exec-");
        ex.setCorePoolSize(4);
        ex.setMaxPoolSize(16);
        ex.setQueueCapacity(100);
        ex.initialize();
        return ex;
    }
}