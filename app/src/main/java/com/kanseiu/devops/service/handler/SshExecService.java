package com.kanseiu.devops.service.handler;

import com.jcraft.jsch.*;
import com.kanseiu.devops.model.entity.DevServer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.Objects;
import java.util.Properties;
import java.util.concurrent.Future;

@Service
public class SshExecService {

    // ===================== 可配置超时/参数 =====================

    // 中文注释：SSH 连接超时（毫秒）
    private static final int CONNECT_TIMEOUT_MS = 8_000;
    // 中文注释：指令通道连接/首包超时（毫秒）
    private static final int CHANNEL_CONNECT_TIMEOUT_MS = 8_000;
    // 中文注释：通道关闭轮询间隔（毫秒）
    private static final int POLL_INTERVAL_MS = 50;
    // 中文注释：默认测试命令
    private static final String DEFAULT_TEST_CMD = "echo ping";

    // 中文注释：并行读取 stdout/stderr 的线程池（也可以不注入，改用 newFixedThreadPool(2)）
    @Autowired(required = false)
    private ThreadPoolTaskExecutor sshExecPool;

    // ===================== 对外主入口 =====================

    /**
     * 中文注释：根据服务器的认证方式（数据库字段），从 DB 中读取凭据后执行命令，并通过 SSE 实时推送输出。
     *
     * @param s       数据库中的服务器信息（包含 host/port/username/authType/密码或私钥等）
     * @param cmd     前端可选传入的命令；为空则使用服务器默认命令或系统默认
     * @param emitter SSE 推送器
     */
    public void execFromDb(DevServer s, String cmd, SseEmitter emitter) throws Exception {
        Objects.requireNonNull(s, "DevServer 不能为空");
        final String command = (cmd == null || cmd.isBlank()) ? ((s.getDefaultTestCmd() == null || s.getDefaultTestCmd().isBlank()) ? DEFAULT_TEST_CMD : s.getDefaultTestCmd()) : cmd;

        Session session = null;
        ChannelExec channel = null;
        long t0 = System.nanoTime();

        try {
            // 中文注释：建立/连接 Session（根据认证类型选择）
            if ("privateKey".equalsIgnoreCase(s.getAuthType())) {
                session = buildSessionWithKey(s);
            } else {
                session = buildSessionWithPassword(s);
            }

            sendEvent(emitter, "meta", "连接中... " + s.getHost());
            session.connect(CONNECT_TIMEOUT_MS);
            sendEvent(emitter, "meta", "已连接，开始执行: " + command);

            // 中文注释：打开执行通道并设置命令
            channel = (ChannelExec) session.openChannel("exec");
            channel.setCommand(command);
            channel.setInputStream(null);

            // 中文注释：按行读取输出，便于实时显示
            BufferedReader outReader = new BufferedReader(new InputStreamReader(channel.getInputStream(), StandardCharsets.UTF_8));
            BufferedReader errReader = new BufferedReader(new InputStreamReader(channel.getErrStream(), StandardCharsets.UTF_8));

            channel.connect(CHANNEL_CONNECT_TIMEOUT_MS);

            // 中文注释：并行泵出 stdout/stderr
            Future<?> fStdout = submit(() -> pump(outReader, "stdout", emitter));
            Future<?> fStderr = submit(() -> pump(errReader, "stderr", emitter));

            // 中文注释：等待命令结束
            while (!channel.isClosed()) {
                Thread.sleep(POLL_INTERVAL_MS);
            }
            // 中文注释：等待两个读取任务收尾
            if (fStdout != null) {
                fStdout.get();
            }
            if (fStderr != null) {
                fStderr.get();
            }

            int exit = channel.getExitStatus();
            long latencyMs = (System.nanoTime() - t0) / 1_000_000L;
            sendEvent(emitter, "meta", "退出码: " + exit + "，耗时: " + latencyMs + "ms");
            sendEvent(emitter, "end", exit);
        } catch (Throwable ex) {
            // 中文注释：尽量把错误信息推送到前端
            sendEvent(emitter, "error", ex.getClass().getSimpleName() + ": " + safeMsg(ex));
            throw ex;
        } finally {
            // 中文注释：资源兜底关闭
            safeDisconnect(channel);
            safeDisconnect(session);
            try {
                emitter.complete();
            } catch (Throwable ignore) {
            }
        }
    }

    // ===================== Session 构建（密码/私钥） =====================

    /**
     * 中文注释：使用“密码/keyboard-interactive”认证方式建立 Session（尚未 connect）
     */
    private Session buildSessionWithPassword(DevServer s) throws JSchException {
        JSch jsch = new JSch();
        Session session = jsch.getSession(s.getUsername(), s.getHost(), (s.getPort() == null || s.getPort() == 0) ? 22 : s.getPort());

        // 中文注释：基础配置（开发阶段关闭 HostKey 校验；生产建议开启并配置 known_hosts）
        session.setConfig(defaultSessionProps());
        // 中文注释：同时兼容 password 与 keyboard-interactive（有的服务端只开后者）
        session.setUserInfo(new SimpleUserInfo(s.getPasswordEnc()));
        session.setPassword(s.getPasswordEnc());
        return session;
    }

    /**
     * 中文注释：使用“私钥”认证方式建立 Session（尚未 connect）
     * 注意：会对 DB 中的私钥 PEM 做换行/BOM 规范化，避免 invalid privatekey
     */
    private Session buildSessionWithKey(DevServer s) throws JSchException {
        String pem = normalizePem(s.getPrivateKeyEnc());
        byte[] keyBytes = pem.getBytes(StandardCharsets.UTF_8);
        byte[] passphraseBytes = (s.getPassphraseEnc() == null || s.getPassphraseEnc().isEmpty()) ? null : s.getPassphraseEnc().getBytes(StandardCharsets.UTF_8);

        JSch jsch = new JSch();
        jsch.addIdentity("db-key", keyBytes, null, passphraseBytes);

        Session session = jsch.getSession(s.getUsername(), s.getHost(), (s.getPort() == null || s.getPort() == 0) ? 22 : s.getPort());
        session.setConfig(defaultSessionProps());
        return session;
    }

    /**
     * 中文注释：Session 的默认配置（可按需收紧算法/HostKey 等）
     */
    private Properties defaultSessionProps() {
        Properties p = new Properties();
        // 中文注释：开发阶段关闭；生产建议设置为 "yes" 并配 known_hosts
        p.put("StrictHostKeyChecking", "no");
        // 中文注释：首选认证方式（公钥优先，其次密码与 keyboard-interactive）
        p.put("PreferredAuthentications", "publickey,password,keyboard-interactive");
        // 中文注释：Host Key 算法偏好（视服务端版本可调）
        p.put("server_host_key", "rsa-sha2-512,rsa-sha2-256,ssh-ed25519,ecdsa-sha2-nistp256,ssh-rsa");
        return p;
    }

    // ===================== I/O 读取与工具方法 =====================

    /**
     * 中文注释：按行读取并通过 SSE 推送；任何发送异常（客户端断开）都会终止循环
     */
    private void pump(BufferedReader br, String eventName, SseEmitter emitter) {
        String line;
        try {
            while ((line = br.readLine()) != null) {
                if (!sendEvent(emitter, eventName, line)) {
                    break; // 中文注释：客户端断开或发送失败，提前退出
                }
            }
        } catch (IOException ignore) {
            // 中文注释：读流异常时直接结束（多为通道关闭或客户端断开）
        } finally {
            try {
                br.close();
            } catch (IOException ignore) {
            }
        }
    }

    /**
     * 中文注释：发送 SSE 事件（失败返回 false，不抛异常，便于上层继续清理）
     */
    private boolean sendEvent(SseEmitter emitter, String name, Object data) {
        try {
            emitter.send(SseEmitter.event().name(name).data(data));
            return true;
        } catch (Throwable ignore) {
            return false;
        }
    }

    /**
     * 中文注释：提交并行任务（优先使用注入的线程池；没有则用临时线程）
     */
    private Future<?> submit(Runnable r) {
        if (sshExecPool != null) {
            return sshExecPool.submit(r);
        }
        // 中文注释：兜底：没有线程池时开一条线程跑
        return java.util.concurrent.CompletableFuture.runAsync(r);
    }

    /**
     * 中文注释：规范化 PEM（换行/BOM），避免 JSch 报 invalid privatekey
     */
    private String normalizePem(String pem) {
        if (pem == null) {
            return "";
        }
        String s = pem.replace("\r\n", "\n").replace("\r", "\n").replace("\uFEFF", ""); // 去 BOM
        if (!s.endsWith("\n")) {
            s = s + "\n";
        }
        return s;
    }

    /**
     * 中文注释：安全获取异常信息
     */
    private String safeMsg(Throwable e) {
        return e == null ? "" : (e.getMessage() == null ? "" : e.getMessage());
    }

    /**
     * 中文注释：安全断开 JSch 资源
     */
    private void safeDisconnect(Channel channel) {
        try {
            if (channel != null && channel.isConnected()) {
                channel.disconnect();
            }
        } catch (Throwable ignore) {
        }
    }

    private void safeDisconnect(Session session) {
        try {
            if (session != null && session.isConnected()) {
                session.disconnect();
            }
        } catch (Throwable ignore) {
        }
    }

    // ===================== 兼容 keyboard-interactive 的 UserInfo =====================

    /**
     * 中文注释：
     * - 某些服务器仅开启 keyboard-interactive（PAM）而非纯 password；
     * - 该实现会在 keyboard-interactive 提示时返回同一份密码，提升兼容性；
     * - 同时允许 StrictHostKeyChecking=no 时自动接受主机指纹。
     */
    static class SimpleUserInfo implements UserInfo, UIKeyboardInteractive {
        private final String password;

        SimpleUserInfo(String password) {
            this.password = password == null ? "" : password;
        }

        @Override
        public String getPassword() {
            return password;
        }

        @Override
        public boolean promptYesNo(String str) {
            return true;
        }    // 接受 host key（仅开发便捷）

        @Override
        public String getPassphrase() {
            return null;
        }

        @Override
        public boolean promptPassphrase(String message) {
            return false;
        }

        @Override
        public boolean promptPassword(String message) {
            return true;
        }

        @Override
        public void showMessage(String message) { /* no-op */ }

        @Override
        public String[] promptKeyboardInteractive(String destination, String name, String instruction, String[] prompt, boolean[] echo) {
            if (prompt != null && prompt.length > 0) {
                String[] ans = new String[prompt.length];
                for (int i = 0; i < prompt.length; i++) {
                    ans[i] = password;
                }
                return ans;
            }
            return null;
        }
    }
}