package com.kanseiu.devops.service.handler;

import cn.hutool.core.util.StrUtil;
import com.kanseiu.devops.constant.NotifyTypeEnum;
import com.kanseiu.devops.framework.mail.service.SendEmail;
import com.kanseiu.devops.model.entity.DevCronJobLog;
import com.kanseiu.devops.model.entity.DevCronJobNotify;
import com.kanseiu.devops.model.request.SendEmailRequest;
import com.kanseiu.devops.service.business.DevCronJobNotifyLogService;
import com.kanseiu.devops.service.business.DevCronJobNotifyService;
import com.kanseiu.devops.service.business.DevCronJobService;
import com.kanseiu.devops.service.renderer.DevCronJobLogHtmlRenderer;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import javax.annotation.Resource;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

// 发通知
@Slf4j
@Service
public class SendNotifyService {

    @Resource
    private DevCronJobService devCronJobService;

    @Resource
    private DevCronJobNotifyService devCronJobNotifyService;

    @Resource
    private DevCronJobNotifyLogService devCronJobNotifyLogService;

    @Resource
    private SendEmail sendEmail;

    // 发送邮件
    public void send(DevCronJobLog devCronJobLog) {
        // 获取对应任务的通知对象
        List<DevCronJobNotify> devCronJobNotifyList = devCronJobNotifyService.listByJobId(devCronJobLog.getJobId());
        // 过滤出非禁用的
        if(!CollectionUtils.isEmpty(devCronJobNotifyList)) {
            devCronJobNotifyList = devCronJobNotifyList.stream().filter(r -> !r.getDisabled()).collect(Collectors.toList());
            // 获取过滤后的通知对象
            if(!CollectionUtils.isEmpty(devCronJobNotifyList)) {
                // 查询定时任务名称
                String jobName = devCronJobService.getJobName(devCronJobLog.getJobId());
                devCronJobLog.setJobName(jobName);
                // 发送
                this.sendMethodSelector(devCronJobNotifyList, devCronJobLog);
            }
        }
    }

    private void sendMethodSelector(List<DevCronJobNotify> devCronJobNotifyList, DevCronJobLog devCronJobLog) {
        // 获取任务执行状态
        String status = devCronJobLog.getStatus();
        // 循环处理
        for (DevCronJobNotify devCronJobNotify : devCronJobNotifyList) {
            // 获取触发状态
            String notifyOnStatus = devCronJobNotify.getNotifyOnStatus();
            // 如果触发状态中包含任务执行状态
            if(Arrays.asList(notifyOnStatus.split(StrUtil.COMMA)).contains(status)) {
                String notifyType = devCronJobNotify.getNotifyType();
                NotifyTypeEnum notifyTypeEnum = NotifyTypeEnum.getByName(notifyType);
                if(Objects.nonNull(notifyTypeEnum)) {
                    if(NotifyTypeEnum.EMAIL.equals(notifyTypeEnum)) {
                        this.sendEmail(devCronJobLog, devCronJobNotify);
                    } else if (NotifyTypeEnum.PHONE.equals(notifyTypeEnum)) {
                        this.sendPhone(devCronJobLog, devCronJobNotify);
                    } else {
                        log.warn("还没有实现[{}]的通知功能！", notifyType);
                    }
                }
            }
        }
    }

    private void sendEmail(DevCronJobLog devCronJobLog, DevCronJobNotify devCronJobNotify) {
        // 记录日志
        Long notifyLogId = devCronJobNotifyLogService.start(devCronJobLog, devCronJobNotify);
        // 组装发送邮件请求
        SendEmailRequest sendEmailRequest = new SendEmailRequest();
        sendEmailRequest.setBusinessId(notifyLogId);
        sendEmailRequest.setTo(devCronJobNotify.getNotifyTypeContent());
        sendEmailRequest.setSubject(devCronJobLog.getJobName());
        // 获取html
        String html = DevCronJobLogHtmlRenderer.renderHtml(devCronJobLog);
        sendEmailRequest.setMes(html);
        // 发送
        sendEmail.html(sendEmailRequest);
    }

    private void sendPhone(DevCronJobLog log, DevCronJobNotify devCronJobNotify) {
        // 记录日志

        // 发送

    }

}
