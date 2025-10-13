package com.kanseiu.devops.service.business;

import com.baomidou.mybatisplus.extension.service.IService;
import com.kanseiu.devops.model.entity.DevCronJob;
import com.kanseiu.devops.model.request.CronJobSaveRequest;
import com.kanseiu.devops.model.response.CronJobListResp;

import java.util.List;

public interface DevCronJobService extends IService<DevCronJob> {

    List<DevCronJob> listAll();

    Long add(DevCronJob req);

    Long update(DevCronJob req);

    String getJobName(Long id);



    void pause(Long id);

    void resume(Long id);

    void reloadAll();
}
