package com.kanseiu.devops.framework.ntfy.model;

import lombok.Getter;

@Getter
public class NtfyResult {

    /**
     * 是否成功（最终结果）
     */
    private final boolean success;

    /**
     * HTTP 状态码（如果请求根本没发出去则为 -1）
     */
    private final int httpStatus;

    /**
     * 响应体（截断保存）
     */
    private final String responseBody;

    /**
     * 错误信息（失败时）
     */
    private final String errorMessage;

    /**
     * 实际尝试次数
     */
    private final int attempts;

    /**
     * 总耗时（毫秒）
     */
    private final long costMs;

    private NtfyResult(boolean success, int httpStatus, String responseBody, String errorMessage, int attempts, long costMs) {
        this.success = success;
        this.httpStatus = httpStatus;
        this.responseBody = responseBody;
        this.errorMessage = errorMessage;
        this.attempts = attempts;
        this.costMs = costMs;
    }

    public static NtfyResult ok(int httpStatus, String responseBody, int attempts, long costMs) {
        return new NtfyResult(true, httpStatus, responseBody, null, attempts, costMs);
    }

    public static NtfyResult fail(int httpStatus, String responseBody, String errorMessage, int attempts, long costMs) {
        return new NtfyResult(false, httpStatus, responseBody, errorMessage, attempts, costMs);
    }

    @Override
    public String toString() {
        return "NtfyResult{" +
                "success=" + success +
                ", httpStatus=" + httpStatus +
                ", attempts=" + attempts +
                ", costMs=" + costMs +
                ", errorMessage='" + errorMessage + '\'' +
                '}';
    }
}