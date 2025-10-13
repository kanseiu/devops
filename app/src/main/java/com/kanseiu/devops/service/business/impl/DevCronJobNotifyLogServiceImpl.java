package com.kanseiu.devops.service.business.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.kanseiu.devops.constant.JobLogStatus;
import com.kanseiu.devops.mapper.DevCronJobNotifyLogMapper;
import com.kanseiu.devops.model.entity.DevCronJobLog;
import com.kanseiu.devops.model.entity.DevCronJobNotify;
import com.kanseiu.devops.model.entity.DevCronJobNotifyLog;
import com.kanseiu.devops.service.business.DevCronJobNotifyLogService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class DevCronJobNotifyLogServiceImpl extends ServiceImpl<DevCronJobNotifyLogMapper, DevCronJobNotifyLog> implements DevCronJobNotifyLogService {

    // 开始发送消息前，记录日志
    @Override
    public Long start(DevCronJobLog devCronJobLog, DevCronJobNotify devCronJobNotify) {
        // 组装
        DevCronJobNotifyLog notifyLog = new DevCronJobNotifyLog();
        notifyLog.setDevCronJobNotifyId(devCronJobNotify.getId());
        notifyLog.setDevCronJobLogId(devCronJobLog.getId());
        notifyLog.setUsername(devCronJobNotify.getUsername());
        notifyLog.setNotifyType(devCronJobNotify.getNotifyType());
        notifyLog.setNotifyTypeContent(devCronJobNotify.getNotifyTypeContent());
        notifyLog.setDevCronJobName(devCronJobLog.getJobName());
        notifyLog.setDevCronJobLogStatus(devCronJobLog.getStatus());
        notifyLog.setStatus(JobLogStatus.RUNNING.name());
        // 保存
        this.save(notifyLog);
        // 返回
        return notifyLog.getId();
    }

    // 发送消息完成后，修改状态
    @Override
    public Long end(Long notifyLogId, String status, String mes) {
        DevCronJobNotifyLog notifyLog = this.getById(notifyLogId);
        notifyLog.setStatus(status);
        notifyLog.setMes(mes);
        // 更新
        this.updateById(notifyLog);
        // 返回
        return notifyLog.getId();
    }

}
