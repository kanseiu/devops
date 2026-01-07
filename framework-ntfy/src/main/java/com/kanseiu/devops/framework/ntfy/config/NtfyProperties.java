package com.kanseiu.devops.framework.ntfy.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Setter
@Getter
@ConfigurationProperties(prefix = "ntfy")
public class NtfyProperties {

    /**
     * ntfy 服务的 base url，例如：https://push.kanseiu.com
     */
    private String baseUrl;

    /**
     * 连接超时（毫秒）
     */
    private int connectTimeoutMs = 3000;

    /**
     * 读取超时（毫秒）
     */
    private int readTimeoutMs = 8000;

    private Retry retry = new Retry();

    @Setter
    @Getter
    public static class Retry {
        /**
         * 最大尝试次数（包含首次）
         */
        private int maxAttempts = 3;

        /**
         * 重试间隔（毫秒），简单固定 backoff
         */
        private long backoffMs = 500;

    }

}