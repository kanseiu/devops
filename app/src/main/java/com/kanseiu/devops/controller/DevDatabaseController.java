package com.kanseiu.devops.controller;

import com.kanseiu.devops.model.R;
import com.kanseiu.devops.model.entity.DevDatabase;
import com.kanseiu.devops.service.business.DevDatabaseService;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import javax.annotation.Resource;
import java.util.List;

@RestController
@RequestMapping("/api/databases")
public class DevDatabaseController {

    @Resource
    private DevDatabaseService devDatabaseService;

    @GetMapping("list")
    public R<List<DevDatabase>> list() {
        return R.ok(devDatabaseService.list());
    }

    @PostMapping("save")
    public R<?> save(@RequestBody DevDatabase req) {
        if (req.getId() == null) {
            devDatabaseService.add(req);
        } else {
            devDatabaseService.update(req);
        }
        return R.ok();
    }

    // 测试连接
    @GetMapping("{id}/test")
    public SseEmitter test(@PathVariable Long id) {
        return devDatabaseService.testConnection(id);
    }
}