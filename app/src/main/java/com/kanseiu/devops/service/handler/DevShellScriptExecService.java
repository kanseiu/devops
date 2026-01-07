package com.kanseiu.devops.service.handler;

import com.jcraft.jsch.ChannelExec;
import com.jcraft.jsch.JSch;
import com.jcraft.jsch.Session;
import com.kanseiu.devops.model.entity.DevCronJob;
import com.kanseiu.devops.model.entity.DevScript;
import com.kanseiu.devops.model.entity.DevServer;
import com.kanseiu.devops.service.callback.LiveExecCallback;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Objects;
import java.util.UUID;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

// 执行SHELL脚本
@Slf4j
@Service("shellScriptExecService")
public class DevShellScriptExecService implements DevScriptExecService {

    @Resource
    private ThreadPoolTaskExecutor sshExecPool;

    @Resource
    private DevCommonScriptExecService devCommonScriptExecService;

    @Override
    public void execute(DevCronJob job, LiveExecCallback cb) {
        log.info("[执行脚本]scriptName = {}, serverId = {}, timeoutSec = {}, args = {}", job.getScriptName(), job.getServerId(), job.getTimeoutSec(), job.getArgsText());

        // 获取服务器
        DevServer server = devCommonScriptExecService.getServerBeforeExec(job, cb);
        if (server == null) {return;}

        // 获取脚本
        DevScript script = devCommonScriptExecService.getScriptBeforeExec(job, server.getHost(), cb);
        if (script == null) {return;}

        if(Objects.isNull(cb)) {
            cb = devCommonScriptExecService.getDbLoggingCallback(job, script, server.getHost());
        }

        this.execute(job, cb, server, script);
    }

    // 执行脚本
    private void execute(DevCronJob job, LiveExecCallback cb, DevServer server, DevScript script) {
        sshExecPool.submit(() -> {
            int exitCode = -1;
            Session session = null;
            ChannelExec channel = null;
            String remotePath = null;
            java.nio.file.Path localPath = null;

            try {
                int timeoutSec = job.getTimeoutSec() != null ? job.getTimeoutSec() : 300;
                String workDir = (script.getWorkDir() == null || script.getWorkDir().isBlank()) ? null : script.getWorkDir().trim();

                cb.onStdout("host=" + server.getHost() + ":" + (server.getPort() == null ? 22 : server.getPort()));
                cb.onStdout("user=" + server.getUsername());
                cb.onStdout("timeoutSec=" + timeoutSec);

                // 1) 本机执行：localhost / 127.0.0.1 不做 SSH 登录
                String host = server.getHost();
                boolean isLocal = "localhost".equals(host) || "127.0.0.1".equals(host);
                if (isLocal) {
                    // 1.1 落盘到本机临时文件
                    String tmpName = "devops-" + java.util.UUID.randomUUID() + ".sh";
                    localPath = java.nio.file.Paths.get("/tmp", tmpName);
                    java.nio.file.Files.writeString(
                            localPath,
                            script.getScriptContent(),
                            java.nio.charset.StandardCharsets.UTF_8,
                            java.nio.file.StandardOpenOption.CREATE,
                            java.nio.file.StandardOpenOption.TRUNCATE_EXISTING
                    );

                    // 1.2 尽量设置可执行权限（在非 POSIX 文件系统上会失败，忽略即可）
                    try {
                        java.util.Set<java.nio.file.attribute.PosixFilePermission> perms =
                                java.nio.file.attribute.PosixFilePermissions.fromString("rwx------");
                        java.nio.file.Files.setPosixFilePermissions(localPath, perms);
                    } catch (Exception ignore) {
                        // 忽略：例如在不支持 POSIX 权限的文件系统上
                    }

                    // 1.3 构造命令（尽量保持你原来“字符串拼接 args”的语义）
                    String args = (job.getArgsText() == null ? "" : job.getArgsText().trim());
                    String bash = java.nio.file.Files.exists(java.nio.file.Paths.get("/bin/bash")) ? "/bin/bash" : "bash";

                    String safeCmd = localPath.toAbsolutePath() + (args.isEmpty() ? "" : (" " + args));
                    String finalCmd = (workDir != null ? ("cd " + workDir + " && ") : "") + bash + " " + safeCmd;
                    cb.onMeta("cmd=" + finalCmd);

                    // 1.4 用 bash -lc 执行，确保 cd && ... 这类拼接能按 shell 语义跑起来
                    ProcessBuilder pb = new ProcessBuilder(bash, "-lc", finalCmd);
                    Process p = pb.start();

                    java.io.InputStream stdout = p.getInputStream();
                    java.io.InputStream stderr = p.getErrorStream();

                    Future<?> outF = sshExecPool.submit(() -> streamLines(stdout, cb::onStdout));
                    Future<?> errF = sshExecPool.submit(() -> streamLines(stderr, cb::onStderr));

                    boolean finished = p.waitFor(timeoutSec, java.util.concurrent.TimeUnit.SECONDS);
                    if (!finished) {
                        cb.onStderr("[timeout] 任务超时，强制关闭");
                        p.destroyForcibly();
                        exitCode = 124;
                    } else {
                        exitCode = p.exitValue();
                    }

                    // 给一点时间把最后的输出刷完
                    try { outF.get(1, java.util.concurrent.TimeUnit.SECONDS); } catch (Exception ignore) {}
                    try { errF.get(1, java.util.concurrent.TimeUnit.SECONDS); } catch (Exception ignore) {}

                    cb.onEnd(exitCode);
                    return; // 本机分支结束
                }

                // 2) 远程执行：建立 SSH 会话
                com.jcraft.jsch.JSch jsch = new com.jcraft.jsch.JSch();
                if ("privateKey".equalsIgnoreCase(server.getAuthType())) {
                    byte[] prvKey = server.getPrivateKeyEnc().getBytes(java.nio.charset.StandardCharsets.UTF_8);
                    if (server.getPassphraseEnc() != null && !server.getPassphraseEnc().isBlank()) {
                        jsch.addIdentity("key", prvKey, null, server.getPassphraseEnc().getBytes(java.nio.charset.StandardCharsets.UTF_8));
                    } else {
                        jsch.addIdentity("key", prvKey, null, null);
                    }
                }

                session = jsch.getSession(server.getUsername(), server.getHost(), server.getPort() == null ? 22 : server.getPort());
                if ("password".equalsIgnoreCase(server.getAuthType())) {
                    session.setPassword(server.getPasswordEnc());
                }
                session.setConfig("StrictHostKeyChecking", "no");
                session.connect(timeoutSec * 1000);

                // 3) 上传脚本到 /tmp
                remotePath = "/tmp/devops-" + java.util.UUID.randomUUID() + ".sh";
                uploadFile(session, script.getScriptContent(), remotePath);
                execSimple(session, "chmod 700 " + remotePath);

                // 4) 构造命令
                String args = (job.getArgsText() == null ? "" : job.getArgsText().trim());
                String safeCmd = remotePath + (args.isEmpty() ? "" : (" " + args));
                String finalCmd = (workDir != null ? ("cd " + workDir + " && ") : "") + "/bin/bash " + safeCmd;
                cb.onMeta("cmd=" + finalCmd);

                // 5) 执行命令
                channel = (com.jcraft.jsch.ChannelExec) session.openChannel("exec");
                channel.setCommand(finalCmd);
                channel.setInputStream(null);
                java.io.InputStream stdout = channel.getInputStream();
                java.io.InputStream stderr = channel.getErrStream();
                channel.connect();

                // 6) 异步读取输出
                Future<?> outF = sshExecPool.submit(() -> streamLines(stdout, cb::onStdout));
                Future<?> errF = sshExecPool.submit(() -> streamLines(stderr, cb::onStderr));

                // 7) 等待退出或超时
                long deadline = System.currentTimeMillis() + timeoutSec * 1000L;
                while (!channel.isClosed() && System.currentTimeMillis() < deadline) {
                    Thread.sleep(200);
                }
                if (!channel.isClosed()) {
                    cb.onStderr("[timeout] 任务超时，强制关闭");
                    channel.disconnect();
                    exitCode = 124;
                } else {
                    exitCode = channel.getExitStatus();
                }

                try { outF.get(1, java.util.concurrent.TimeUnit.SECONDS); } catch (Exception ignore) {}
                try { errF.get(1, java.util.concurrent.TimeUnit.SECONDS); } catch (Exception ignore) {}

            } catch (Exception e) {
                cb.onError(e);
                return;
            } finally {
                // 清理临时脚本：本机 & 远端
                try {
                    if (localPath != null) {
                        try { java.nio.file.Files.deleteIfExists(localPath); } catch (Exception ignore) {}
                    }
                    if (remotePath != null && session != null && session.isConnected()) {
                        try { execSimple(session, "rm -f " + remotePath); } catch (Exception ignore) {}
                    }
                } finally {
                    if (channel != null && channel.isConnected()) {
                        channel.disconnect();
                    }
                    if (session != null && session.isConnected()) {
                        session.disconnect();
                    }
                }
            }

            cb.onEnd(exitCode);
        });
    }

//    private void execute(DevCronJob job, LiveExecCallback cb, DevServer server, DevScript script) {
//        sshExecPool.submit(() -> {
//            int exitCode = -1;
//            Session session = null;
//            ChannelExec channel = null;
//            String remotePath = null;
//            try {
//
//                int timeoutSec = job.getTimeoutSec() != null ? job.getTimeoutSec() : 300;
//                String workDir = (script.getWorkDir() == null || script.getWorkDir().isBlank()) ? null : script.getWorkDir().trim();
//
//                cb.onStdout("host=" + server.getHost() + ":" + (server.getPort() == null ? 22 : server.getPort()));
//                cb.onStdout("user=" + server.getUsername());
//                cb.onStdout("timeoutSec=" + timeoutSec);
//
//                // 2) 建立 SSH 会话
//                JSch jsch = new JSch();
//                // 本机执行的情况，不SSH登录
//                if("localhost".equals(server.getHost()) || "127.0.0.1".equals(server.getHost())) {
//
//                }
//
//                if ("privateKey".equalsIgnoreCase(server.getAuthType())) {
//                    byte[] prvKey = server.getPrivateKeyEnc().getBytes(StandardCharsets.UTF_8);
//                    if (server.getPassphraseEnc() != null && !server.getPassphraseEnc().isBlank()) {
//                        jsch.addIdentity("key", prvKey, null, server.getPassphraseEnc().getBytes(StandardCharsets.UTF_8));
//                    } else {
//                        jsch.addIdentity("key", prvKey, null, null);
//                    }
//                }
//                session = jsch.getSession(server.getUsername(), server.getHost(), server.getPort() == null ? 22 : server.getPort());
//                if ("password".equalsIgnoreCase(server.getAuthType())) {
//                    session.setPassword(server.getPasswordEnc());
//                }
//                session.setConfig("StrictHostKeyChecking", "no");
//                session.connect(timeoutSec * 1000);
//
//                // 3) 上传脚本到 /tmp
//                remotePath = "/tmp/devops-" + UUID.randomUUID() + ".sh";
//                uploadFile(session, script.getScriptContent(), remotePath);
//                execSimple(session, "chmod 700 " + remotePath);
//
//                // 4) 构造命令
//                String args = (job.getArgsText() == null ? "" : job.getArgsText().trim());
//                String safeCmd = remotePath + (args.isEmpty() ? "" : (" " + args));
//                String finalCmd = (workDir != null ? ("cd " + workDir + " && ") : "") + "/bin/bash " + safeCmd;
//                cb.onMeta("cmd=" + finalCmd);
//
//                // 5) 执行命令
//                channel = (ChannelExec) session.openChannel("exec");
//                channel.setCommand(finalCmd);
//                channel.setInputStream(null);
//                InputStream stdout = channel.getInputStream();
//                InputStream stderr = channel.getErrStream();
//                channel.connect();
//
//                // 6) 异步读取输出
//                Future<?> outF = sshExecPool.submit(() -> streamLines(stdout, cb::onStdout));
//                Future<?> errF = sshExecPool.submit(() -> streamLines(stderr, cb::onStderr));
//
//                // 7) 等待退出或超时
//                long deadline = System.currentTimeMillis() + timeoutSec * 1000L;
//                while (!channel.isClosed() && System.currentTimeMillis() < deadline) {
//                    Thread.sleep(200);
//                }
//                if (!channel.isClosed()) {
//                    cb.onStderr("[timeout] 任务超时，强制关闭");
//                    channel.disconnect();
//                    exitCode = 124;
//                } else {
//                    exitCode = channel.getExitStatus();
//                }
//
//                outF.get(1, TimeUnit.SECONDS);
//                errF.get(1, TimeUnit.SECONDS);
//
//            } catch (Exception e) {
//                cb.onError(e);
//                return;
//            } finally {
//                try {
//                    // 在断开 session 之前清理远端临时文件
//                    if (remotePath != null && session != null && session.isConnected()) {
//                        try { execSimple(session, "rm -f " + remotePath); } catch (Exception ignore) {}
//                    }
//                } finally {
//                    if (channel != null && channel.isConnected()) {
//                        channel.disconnect();
//                    }
//                    if (session != null && session.isConnected()) {
//                        session.disconnect();
//                    }
//                }
//            }
//            cb.onEnd(exitCode);
//        });
//    }

    // ========== 工具方法 ==========
    private void uploadFile(Session session, String content, String remotePath) throws Exception {
        byte[] data = content.getBytes(StandardCharsets.UTF_8);
        String command = "scp -t " + remotePath;
        ChannelExec channel = (ChannelExec) session.openChannel("exec");
        channel.setCommand(command);

        try (OutputStream out = channel.getOutputStream();
             InputStream in = channel.getInputStream()) {
            channel.connect();

            if (checkAck(in) != 0) {
                throw new IOException("SCP ack failed (init)");
            }

            String header = "C0700 " + data.length + " script.sh\n";
            out.write(header.getBytes(StandardCharsets.UTF_8));
            out.flush();
            if (checkAck(in) != 0) {
                throw new IOException("SCP ack failed (header)");
            }

            out.write(data);
            out.write(0);
            out.flush();
            if (checkAck(in) != 0) {
                throw new IOException("SCP ack failed (data)");
            }
        } finally {
            channel.disconnect();
        }
    }

    private void execSimple(Session session, String cmd) throws Exception {
        ChannelExec channel = (ChannelExec) session.openChannel("exec");
        channel.setCommand(cmd);
        channel.connect();
        channel.disconnect();
    }

    private static void streamLines(InputStream in, java.util.function.Consumer<String> consumer) {
        try (BufferedReader br = new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8))) {
            String line;
            while ((line = br.readLine()) != null) {
                consumer.accept(line);
            }
        } catch (IOException ignored) {}
    }

    private static int checkAck(InputStream in) throws IOException {
        int b = in.read();
        if (b == 0 || b == -1) {
            return b;
        }
        if (b == 1 || b == 2) {
            StringBuilder sb = new StringBuilder();
            int c;
            do { c = in.read(); sb.append((char) c); } while (c != '\n');
            throw new IOException("SCP error: " + sb);
        }
        return b;
    }
}