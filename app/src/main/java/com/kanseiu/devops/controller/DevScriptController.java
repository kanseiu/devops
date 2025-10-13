package com.kanseiu.devops.controller;

import com.kanseiu.devops.model.R;
import com.kanseiu.devops.model.entity.DevScript;
import com.kanseiu.devops.model.request.DevScriptSaveRequest;
import com.kanseiu.devops.service.business.DevScriptService;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import java.util.List;
import java.util.Objects;

@RestController
@RequestMapping("/api/devScript")
public class DevScriptController {

    @Resource
    private DevScriptService devScriptService;

    @GetMapping("list")
    public R<List<DevScript>> list() {
        return R.ok(devScriptService.list());
    }

    // 保存（新增/更新）
    @PostMapping("save")
    public R<?> save(@RequestBody DevScriptSaveRequest request) {
        if(Objects.isNull(request.getId())) {
            // 新增
            devScriptService.add(request);
        } else {
            // 更新
            devScriptService.update(request);
        }
        return R.ok();
    }

}
