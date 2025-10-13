package com.kanseiu.devops.service.business.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.kanseiu.devops.mapper.DevServerMapper;
import com.kanseiu.devops.model.entity.DevServer;
import com.kanseiu.devops.model.request.DevServerSaveRequest;
import com.kanseiu.devops.service.business.DevServerService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

import java.util.Objects;

@Slf4j
@Service
public class DevServerServiceImpl extends ServiceImpl<DevServerMapper, DevServer> implements DevServerService {

    // 新增服务器信息
    @Override
    public void add(DevServerSaveRequest request) {
        // 检查重复
        checkDuplicate(request);
        DevServer devServer = new DevServer();
        BeanUtils.copyProperties(request, devServer);
        this.save(devServer);
    }

    // 更新服务器信息
    @Override
    public void update(DevServerSaveRequest request) {
        // 检查重复
        checkDuplicate(request);
        DevServer devServer = new DevServer();
        BeanUtils.copyProperties(request, devServer);
        this.updateById(devServer);
    }

    private void checkDuplicate(DevServerSaveRequest request) {
        long count = this.count(new LambdaQueryWrapper<DevServer>()
                .ne(Objects.nonNull(request.getId()), DevServer::getId, request.getId())
                .eq(DevServer::getHost, request.getHost())
                .eq(DevServer::getUsername, request.getUsername())
                .eq(DevServer::getPort, request.getPort()));
        if (count > 0) {
            throw new IllegalArgumentException("存在相同【HOST、USERNAME、PORT】的服务器信息！");
        }
    }

}
