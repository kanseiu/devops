package com.kanseiu.devops.service.business;

import com.baomidou.mybatisplus.extension.service.IService;
import com.kanseiu.devops.model.entity.DevCronJobNotify;
import com.kanseiu.devops.model.entity.DevNotifyTarget;

import java.util.List;

public interface DevCronJobNotifyService extends IService<DevCronJobNotify> {

    List<DevCronJobNotify> listByJobId(Long jobId);

    List<DevNotifyTarget> couldSelectNotifyTarget(Long jobId);

    void add(DevCronJobNotify request);

    void update(DevCronJobNotify request);
}
