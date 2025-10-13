package com.kanseiu.devops.service.callback;

import com.kanseiu.devops.constant.JobLogStatus;
import com.kanseiu.devops.service.business.DevCronJobLogService;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;

// 仅写库的回调，不向前端推送 SSE
@RequiredArgsConstructor
public class DbLoggingCallback extends LiveExecCallback {

    private final DevCronJobLogService logService;

    private final Long logId;

    private final LocalDateTime startAt;

    @Override
    public void onStdout(String line) {
        // 中文注释：只写库（内部有截断保护）
        try {
            logService.appendOut(logId, line);
        } catch (Exception ignore) {}
    }

    @Override
    public void onStderr(String line) {
        try {
            logService.appendErr(logId, line);
        } catch (Exception ignore) {
        }
    }

    @Override
    public void onMeta(String line) {}

    @Override
    public void onEnd(int exitCode) {
        JobLogStatus status = (exitCode == 124) ? JobLogStatus.TIMEOUT : JobLogStatus.fromExit(exitCode);
        try {
            logService.finish(logId, exitCode, status, startAt);
        } catch (Exception ignore) {
        }
    }

    @Override
    public void onError(Throwable t) {
        try {
            logService.appendErr(logId, "[exception] " + (t == null ? "unknown" : t.getMessage()));
        } catch (Exception ignore) {
        }
        try {
            logService.finish(logId, -1, JobLogStatus.ERROR, startAt);
        } catch (Exception ignore) {
        }
    }
}