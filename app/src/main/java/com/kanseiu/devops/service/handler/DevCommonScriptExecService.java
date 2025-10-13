package com.kanseiu.devops.service.handler;

import com.kanseiu.devops.constant.JobLogStatus;
import com.kanseiu.devops.model.entity.DevCronJob;
import com.kanseiu.devops.model.entity.DevDatabase;
import com.kanseiu.devops.model.entity.DevScript;
import com.kanseiu.devops.model.entity.DevServer;
import com.kanseiu.devops.service.business.DevCronJobLogService;
import com.kanseiu.devops.service.business.DevDatabaseService;
import com.kanseiu.devops.service.business.DevScriptService;
import com.kanseiu.devops.service.business.DevServerService;
import com.kanseiu.devops.service.callback.DbLoggingCallback;
import com.kanseiu.devops.service.callback.LiveExecCallback;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.time.LocalDateTime;
import java.util.Objects;

@Slf4j
@Service
public class DevCommonScriptExecService {

    @Resource
    private DevCronJobLogService devCronJobLogService;

    @Resource
    private DevScriptService devScriptService;

    @Resource
    private DevDatabaseService devDatabaseService;

    @Resource
    private DevServerService devServerService;


    // 执行前，获取数据库信息
    public DevDatabase getDbBeforeExec(DevCronJob job, LiveExecCallback cb) {
        DevDatabase db = devDatabaseService.getById(job.getDatabaseId());
        if (db == null || Boolean.TRUE.equals(db.getDisabled())) {
            if(Objects.isNull(cb)) {
                // 不推 SSE，这里直接记一条 ERROR 日志并返回
                createAndFinishError(job, "UNKNOWN", null, "数据库不存在或被禁用");
            } else {
                cb.onStderr("数据库不存在或被禁用: " + job.getDatabaseId());
                cb.onEnd(-1);
            }
            return null;
        }
        return db;
    }

    // 执行前，获取服务器信息
    public DevServer getServerBeforeExec(DevCronJob job, LiveExecCallback cb) {
        DevServer server = devServerService.getById(job.getServerId());
        if (server == null || Boolean.TRUE.equals(server.getDisabled())) {
            if (Objects.isNull(cb)) {
                // 不推 SSE，这里直接记一条 ERROR 日志并返回
                createAndFinishError(job, "UNKNOWN", null, "服务器不存在或被禁用");
            } else {
                cb.onStderr("服务器不存在或被禁用: " + job.getServerId());
                cb.onEnd(-1);
            }
            return null;
        }
        return server;
    }

    // 执行前，获取脚本信息
    public DevScript getScriptBeforeExec(DevCronJob job, String connectInfo, LiveExecCallback cb) {
        DevScript script = devScriptService.getByName(job.getScriptName());
        if (script == null || Boolean.TRUE.equals(script.getDisabled())) {
            if(Objects.isNull(cb)) {
                createAndFinishError(job, connectInfo, script, "脚本不存在或被禁用");
            } else {
                cb.onStderr("脚本不存在或被禁用: " + job.getScriptName());
                cb.onEnd(-1);
            }
            return null;
        }
        return script;
    }

    // 获取 DbLoggingCallback
    public DbLoggingCallback getDbLoggingCallback(DevCronJob job, DevScript script, String connectInfo)  {
        Long logId = devCronJobLogService.createStartLog(job, connectInfo, script, job.getArgsText());
        LocalDateTime startAt = LocalDateTime.now();
        return new DbLoggingCallback(devCronJobLogService, logId, startAt);
    }

    // 针对开始阶段就失败的情况，记录日志
    private void createAndFinishError(DevCronJob job, String connectInfo, DevScript script, String errMsg) {
        try {
            Long id = devCronJobLogService.createStartLog(job, connectInfo, script, job.getArgsText());
            devCronJobLogService.appendErr(id, errMsg);
            devCronJobLogService.finish(id, -1, JobLogStatus.ERROR, LocalDateTime.now());
        } catch (Exception ignore) {}
    }
}
