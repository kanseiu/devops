package com.kanseiu.devops.framework.ntfy.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

/**
 * ntfy 相关配置
 */
@Configuration
@EnableConfigurationProperties(NtfyProperties.class)
public class NtfyConfig {

    @Bean
    public RestTemplate ntfyRestTemplate(NtfyProperties props) {
        SimpleClientHttpRequestFactory f = new SimpleClientHttpRequestFactory();
        f.setConnectTimeout(props.getConnectTimeoutMs());
        f.setReadTimeout(props.getReadTimeoutMs());
        return new RestTemplate(f);
    }
}