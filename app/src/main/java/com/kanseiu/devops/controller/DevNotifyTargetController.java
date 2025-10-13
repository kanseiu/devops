package com.kanseiu.devops.controller;

import com.kanseiu.devops.model.R;
import com.kanseiu.devops.model.entity.DevNotifyTarget;
import com.kanseiu.devops.service.business.DevNotifyTargetService;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import java.util.List;
import java.util.Objects;

@RestController
@RequestMapping("/api/notifyTarget")
public class DevNotifyTargetController {

    @Resource
    private DevNotifyTargetService devNotifyTargetService;

    // 列表
    @GetMapping("list")
    public R<List<DevNotifyTarget>> list() {
        return R.ok(devNotifyTargetService.list());
    }

    // 保存（新增/更新）
    @PostMapping("save")
    public R<?> save(@RequestBody DevNotifyTarget request) {
        if(Objects.isNull(request.getId())) {
            // 新增
            devNotifyTargetService.add(request);
        } else {
            // 更新
            devNotifyTargetService.update(request);
        }
        return R.ok();
    }
}
