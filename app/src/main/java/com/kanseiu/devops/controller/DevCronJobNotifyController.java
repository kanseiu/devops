package com.kanseiu.devops.controller;


import com.kanseiu.devops.model.R;
import com.kanseiu.devops.model.entity.DevCronJobNotify;
import com.kanseiu.devops.model.entity.DevNotifyTarget;
import com.kanseiu.devops.service.business.DevCronJobNotifyService;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import java.util.List;
import java.util.Objects;

@RestController
@RequestMapping("/api/cronJobNotify")
public class DevCronJobNotifyController {

    @Resource
    private DevCronJobNotifyService devCronJobNotifyService;

    // jobId对应的已经配置的通知对象列表
    @GetMapping("/listByJobId/{jobId}")
    public R<List<DevCronJobNotify>> listByJobId(@PathVariable("jobId") Long jobId) {
        return R.ok(devCronJobNotifyService.listByJobId(jobId));
    }

    // 获取可以选择的通知对象列表
    @GetMapping("/couldSelectNotifyTarget/{jobId}")
    public R<List<DevNotifyTarget>> couldSelectNotifyTarget(@PathVariable("jobId") Long jobId) {
        return R.ok(devCronJobNotifyService.couldSelectNotifyTarget(jobId));
    }

    // 保存（新增/更新）
    @PostMapping("save")
    public R<?> save(@RequestBody DevCronJobNotify request) {
        if(Objects.isNull(request.getId())) {
            // 新增
            devCronJobNotifyService.add(request);
        } else {
            // 更新
            devCronJobNotifyService.update(request);
        }
        return R.ok();
    }


}
