package com.kanseiu.devops.service.business.impl;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.kanseiu.devops.mapper.DevNotifyTargetMapper;
import com.kanseiu.devops.model.entity.DevCronJobNotify;
import com.kanseiu.devops.model.entity.DevNotifyTarget;
import com.kanseiu.devops.service.business.DevCronJobNotifyService;
import com.kanseiu.devops.service.business.DevNotifyTargetService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.util.Objects;

@Slf4j
@Service
public class DevNotifyTargetServiceImpl extends ServiceImpl<DevNotifyTargetMapper, DevNotifyTarget> implements DevNotifyTargetService {

    @Resource
    private DevCronJobNotifyService devCronJobNotifyService;


    @Override
    public void add(DevNotifyTarget request) {
        // 简单参数校验
        request.check();
        // 业务逻辑校验
        if(this.nameExist(request)) {
            throw new IllegalArgumentException("显示名称不能重复");
        }
        if(this.notifyDuplicate(request)) {
            throw new IllegalArgumentException("通知方式 + 通知方式内容不能重复");
        }
        // 保存
        this.save(request);
    }

    @Override
    public void update(DevNotifyTarget request) {
        // 简单参数校验
        request.check();
        // 业务逻辑校验
        if(this.nameExist(request)) {
            throw new IllegalArgumentException("显示名称不能重复");
        }
        if(this.notifyDuplicate(request)) {
            throw new IllegalArgumentException("通知方式 + 通知方式内容不能重复");
        }
        // 更新
        this.updateById(request);
    }

    @Override
    public void delete(Long id) {
        DevNotifyTarget target = this.getById(id);
        if (target == null) {
            throw new IllegalArgumentException("通知对象不存在，id=" + id);
        }
        long usingCount = devCronJobNotifyService.count(Wrappers.<DevCronJobNotify>lambdaQuery()
                .eq(DevCronJobNotify::getDevNotifyTargetId, id));
        if (usingCount > 0) {
            throw new IllegalArgumentException("该通知对象被定时任务使用，无法删除");
        }
        this.removeById(id);
    }

    // 显示名称重复
    private boolean nameExist(DevNotifyTarget request) {
        long count = this.count(Wrappers.<DevNotifyTarget>lambdaQuery()
                .ne(Objects.nonNull(request.getId()), DevNotifyTarget::getId, request.getId())
                .eq(DevNotifyTarget::getName, request.getName())
        );
        return count > 0;
    }

    // 通知方式 + 内容 重复
    private boolean notifyDuplicate(DevNotifyTarget request) {
        long count = this.count(Wrappers.<DevNotifyTarget>lambdaQuery()
                .ne(Objects.nonNull(request.getId()), DevNotifyTarget::getId, request.getId())
                .eq(DevNotifyTarget::getNotifyType, request.getNotifyType())
                .eq(DevNotifyTarget::getNotifyTypeContent, request.getNotifyTypeContent())
        );
        return count > 0;
    }
}
