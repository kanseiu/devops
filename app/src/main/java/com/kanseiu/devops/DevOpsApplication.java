package com.kanseiu.devops;

import com.kanseiu.devops.cron.CronScheduler;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import javax.annotation.Resource;

@SpringBootApplication
public class DevOpsApplication implements ApplicationRunner {

    public static void main(String[] args) {
        SpringApplication.run(DevOpsApplication.class, args);
    }

    @Resource
    private CronScheduler cronScheduler;

    @Override
    public void run(ApplicationArguments args) {
        cronScheduler.schedulerInit();
    }
}
