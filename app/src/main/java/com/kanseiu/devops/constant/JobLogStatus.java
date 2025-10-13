package com.kanseiu.devops.constant;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum JobLogStatus {
    RUNNING,     // 运行中（仅内部使用）
    SUCCESS,
    FAIL,
    TIMEOUT,
    ERROR;

    public static JobLogStatus fromExit(int exitCode) {
        return exitCode == 0 ? SUCCESS : FAIL;
    }
}