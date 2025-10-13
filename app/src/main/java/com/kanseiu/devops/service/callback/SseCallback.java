package com.kanseiu.devops.service.callback;

import lombok.RequiredArgsConstructor;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;

// 向前端推送
@RequiredArgsConstructor
public class SseCallback extends LiveExecCallback {

    private final SseEmitter emitter;

    @Override
    public void onStdout(String line) {
        try {
            emitter.send(SseEmitter.event().name("stdout").data(line));
        } catch (IOException ignored) {
        }
    }

    @Override
    public void onStderr(String line) {
        try {
            emitter.send(SseEmitter.event().name("stderr").data(line));
        } catch (IOException ignored) {
        }
    }

    @Override
    public void onMeta(String line) {
        try {
            emitter.send(SseEmitter.event().name("meta").data(line));
        } catch (IOException ignored) {
        }
    }

    @Override
    public void onEnd(int exitCode) {
        try {
            emitter.send(SseEmitter.event().name("end").data(exitCode));
        } catch (IOException ignored) {
        }
        emitter.complete();
    }

    @Override
    public void onError(Throwable t) {
        try {
            emitter.send(SseEmitter.event().name("stderr").data("[exception] " + t.getMessage()));
        } catch (IOException ignored) {
        }
        try {
            emitter.send(SseEmitter.event().name("end").data(-1));
        } catch (IOException ignored) {
        }
        emitter.complete();
    }

}
