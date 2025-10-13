package com.kanseiu.devops.service.callback;

// 回调
public abstract class LiveExecCallback {

    public abstract void onStdout(String line);

    public abstract void onStderr(String line);

    public abstract void onMeta(String line);

    public abstract void onEnd(int exitCode);

    public abstract void onError(Throwable t);
}