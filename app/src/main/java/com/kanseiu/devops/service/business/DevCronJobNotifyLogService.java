package com.kanseiu.devops.service.business;

import com.baomidou.mybatisplus.extension.service.IService;
import com.kanseiu.devops.model.entity.DevCronJobLog;
import com.kanseiu.devops.model.entity.DevCronJobNotify;
import com.kanseiu.devops.model.entity.DevCronJobNotifyLog;

public interface DevCronJobNotifyLogService extends IService<DevCronJobNotifyLog> {

    Long start(DevCronJobLog log, DevCronJobNotify devCronJobNotify);

    Long end(Long notifyLogId, String status, String mes);
}
