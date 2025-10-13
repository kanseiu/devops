package com.kanseiu.devops.controller;

import com.kanseiu.devops.model.R;
import com.kanseiu.devops.model.entity.DevServer;
import com.kanseiu.devops.model.request.DevServerSaveRequest;
import com.kanseiu.devops.service.business.DevServerService;
import com.kanseiu.devops.service.handler.SshExecService;
import org.springframework.http.MediaType;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import javax.annotation.Resource;
import java.util.List;
import java.util.Objects;

@RestController
@RequestMapping("/api/servers")
public class DevServerController {

    @Resource
    private DevServerService devServerService;

    @Resource
    private SshExecService sshExecService;

    @Resource
    private ThreadPoolTaskExecutor sshExecPool;

    // 查询
    @GetMapping("list")
    public R<List<DevServer>> list() {
        return R.ok(devServerService.list());
    }

    // 保存（新增/更新）
    @PostMapping("save")
    public R<?> save(@RequestBody DevServerSaveRequest request) {
        if(Objects.isNull(request.getId())) {
            // 新增
            devServerService.add(request);
        } else {
            // 更新
            devServerService.update(request);
        }
        return R.ok();
    }

    // 中文注释：SSE 实时测试；凭据完全从 DB 读取；前端只需传 id（和可选 command）
    @GetMapping(value = "/{id}/test/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter testStream(@PathVariable Long id,
                                 @RequestParam(value = "cmd", required = false) String cmd) {
        // 中文注释：默认 0L = 不超时（也可以设置一个较大超时）
        SseEmitter emitter = new SseEmitter(0L);

        sshExecPool.execute(() -> {
            try {
                DevServer s = devServerService.getById(id);
                if (s == null) {
                    emitter.send(SseEmitter.event().name("error").data("服务器不存在: " + id));
                    emitter.complete();
                    return;
                }
                emitter.send(SseEmitter.event().name("meta").data("开始测试：" + s.getUsername() + "@" + s.getHost()));

                sshExecService.execFromDb(s, cmd, emitter);

                emitter.complete(); // 中文注释：正常结束
            } catch (Exception e) {
                try {
                    emitter.send(SseEmitter.event().name("error").data(e.getClass().getSimpleName() + ": " + (e.getMessage() == null ? "" : e.getMessage())));
                } catch (Exception ignored) {}
                emitter.completeWithError(e);
            }
        });

        return emitter;
    }

}
