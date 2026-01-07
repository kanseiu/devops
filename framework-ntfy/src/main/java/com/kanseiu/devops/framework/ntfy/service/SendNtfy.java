package com.kanseiu.devops.framework.ntfy.service;

import com.kanseiu.devops.framework.base.notify.api.SendMessageCallback;
import com.kanseiu.devops.framework.base.notify.model.SendMessageResult;
import com.kanseiu.devops.framework.ntfy.config.NtfyProperties;
import com.kanseiu.devops.framework.ntfy.model.NtfyResult;
import com.kanseiu.devops.framework.ntfy.model.SendNtfyRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import javax.annotation.Resource;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

@Slf4j
@Component
public class SendNtfy {

    @Resource
    private RestTemplate restTemplate;

    @Resource
    private NtfyProperties props;

    @Resource
    private ThreadPoolTaskExecutor sendMesExecutor;

    @Resource
    private SendMessageCallback<SendNtfyRequest> sendNtfyCallback;

    // NtfyResult{success=true, httpStatus=200, attempts=1, costMs=888, errorMessage='null'}
    // 发布消息到某个主题
    public void text(SendNtfyRequest request) {
        log.info("开始发送NTFY消息，请求参数：{}", request);
        sendMesExecutor.execute(() -> {
            SendMessageResult<SendNtfyRequest> result = new SendMessageResult<>(request);
            result.setCode(0);
            try {
                NtfyResult ntfyResult = this.publish(request);
                log.info("发送NTFY返回结果：{}", ntfyResult);
                if(!ntfyResult.isSuccess()) {
                    result.setMes(ntfyResult.getErrorMessage());
                    result.setCode(-1);
                }
            } catch (Exception e) {
                log.error("发送NTFY失败！", e);
                result.setMes(e.getMessage());
                result.setCode(-1);
            } finally {
                sendNtfyCallback.done(result);
            }
        });
    }

    // 发布消息到某个主题
    private NtfyResult publish(SendNtfyRequest request) {
        long startNs = System.nanoTime();

        if (!StringUtils.hasText(props.getBaseUrl())) {
            return NtfyResult.fail(-1, null, "ntfy.base-url 未配置", 0, 0);
        }
        if (!StringUtils.hasText(request.getTopic())) {
            return NtfyResult.fail(-1, null, "topic 不能为空", 0, 0);
        }
        if (!StringUtils.hasText(request.getMessage())) {
            return NtfyResult.fail(-1, null, "message 不能为空", 0, 0);
        }

        String url = buildTopicUrl(props.getBaseUrl(), request.getTopic());

        int maxAttempts = Math.max(1, props.getRetry().getMaxAttempts());
        long backoffMs = Math.max(0, props.getRetry().getBackoffMs());

        int attempt = 0;
        int lastStatus = -1;
        String lastBody = null;
        String lastErr = null;

        while (attempt < maxAttempts) {
            attempt++;

            try {
                ResponseEntity<String> resp = doPost(url, request.getToken(), request.getTitle(), request.getMessage());
                lastStatus = resp.getStatusCodeValue();
                lastBody = trimBody(resp.getBody());

                if (resp.getStatusCode().is2xxSuccessful()) {
                    return NtfyResult.ok(lastStatus, lastBody, attempt, costMs(startNs));
                }

                // 非 2xx：决定是否重试
                if (!shouldRetry(lastStatus) || attempt >= maxAttempts) {
                    lastErr = "ntfy 返回非 2xx，HTTP=" + lastStatus;
                    return NtfyResult.fail(lastStatus, lastBody, lastErr, attempt, costMs(startNs));
                }

                sleepQuietly(backoffMs);

            } catch (RestClientException e) {
                // 网络错误/超时等
                lastErr = "请求异常：" + e.getMessage();
                if (attempt >= maxAttempts) {
                    return NtfyResult.fail(-1, lastBody, lastErr, attempt, costMs(startNs));
                }
                sleepQuietly(backoffMs);
            } catch (Exception e) {
                lastErr = "未知异常：" + e.getMessage();
                return NtfyResult.fail(-1, lastBody, lastErr, attempt, costMs(startNs));
            }
        }

        // 理论上不会走到这里
        return NtfyResult.fail(lastStatus, lastBody, lastErr, attempt, costMs(startNs));
    }

    private ResponseEntity<String> doPost(String url, String token, String title, String message) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(new MediaType("text", "plain", StandardCharsets.UTF_8));

        if (StringUtils.hasText(title)) {
            headers.add("Title", title);
        }
        if (StringUtils.hasText(token)) {
            headers.setBearerAuth(token.trim());
        }

        HttpEntity<String> entity = new HttpEntity<>(message, headers);
        return restTemplate.exchange(url, HttpMethod.POST, entity, String.class);
    }

    /**
     * 只对“可能是临时性问题”的状态码重试
     */
    private boolean shouldRetry(int httpStatus) {
        // 429：限流，5xx：服务端错误
        if (httpStatus == 429) return true;
        return httpStatus >= 500 && httpStatus <= 599;
    }

    private String buildTopicUrl(String baseUrl, String topic) {
        String b = baseUrl.trim();
        String t = topic.trim();

        if (t.startsWith("/")) t = t.substring(1);
        if (b.endsWith("/")) b = b.substring(0, b.length() - 1);

        return b + "/" + t;
    }

    private String trimBody(String body) {
        if (body == null) return null;
        if (body.length() <= 800) return body;
        return body.substring(0, 800) + "...";
    }

    private long costMs(long startNs) {
        return Duration.ofNanos(System.nanoTime() - startNs).toMillis();
    }

    private void sleepQuietly(long ms) {
        if (ms <= 0) return;
        try {
            Thread.sleep(ms);
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
        }
    }
}