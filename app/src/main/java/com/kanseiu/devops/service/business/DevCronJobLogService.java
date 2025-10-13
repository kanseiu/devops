package com.kanseiu.devops.service.business;

import com.baomidou.mybatisplus.extension.service.IService;
import com.kanseiu.devops.constant.JobLogStatus;
import com.kanseiu.devops.model.entity.*;
import com.kanseiu.devops.model.response.DevCronJobLogResp;

import java.time.LocalDateTime;
import java.util.List;

public interface DevCronJobLogService extends IService<DevCronJobLog> {

    List<DevCronJobLogResp> getTodayFail();

    Long createStartLog(DevCronJob job, String connectInfo, DevScript script, String argsText);

    void appendOut(Long logId, String line);

    void appendErr(Long logId, String line);

    void finish(Long logId, Integer exitCode, JobLogStatus status, LocalDateTime startTime);
}
