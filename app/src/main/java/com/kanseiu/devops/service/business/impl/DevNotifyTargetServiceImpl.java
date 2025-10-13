package com.kanseiu.devops.service.business.impl;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.kanseiu.devops.mapper.DevNotifyTargetMapper;
import com.kanseiu.devops.model.entity.DevNotifyTarget;
import com.kanseiu.devops.service.business.DevNotifyTargetService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Objects;

@Slf4j
@Service
public class DevNotifyTargetServiceImpl extends ServiceImpl<DevNotifyTargetMapper, DevNotifyTarget> implements DevNotifyTargetService {


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
