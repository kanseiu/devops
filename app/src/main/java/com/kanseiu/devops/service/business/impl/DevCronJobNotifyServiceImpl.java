package com.kanseiu.devops.service.business.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.kanseiu.devops.mapper.DevCronJobNotifyMapper;
import com.kanseiu.devops.model.entity.DevCronJobNotify;
import com.kanseiu.devops.model.entity.DevNotifyTarget;
import com.kanseiu.devops.service.business.DevCronJobNotifyService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
public class DevCronJobNotifyServiceImpl extends ServiceImpl<DevCronJobNotifyMapper, DevCronJobNotify> implements DevCronJobNotifyService {

    @Override
    public List<DevCronJobNotify> listByJobId(Long jobId) {
        return this.baseMapper.listByJobId(jobId);
    }

    @Override
    public List<DevNotifyTarget> couldSelectNotifyTarget(Long jobId) {
        return this.baseMapper.couldSelectNotifyTarget(jobId);
    }

    @Override
    public void add(DevCronJobNotify request) {
        this.save(request);
    }

    @Override
    public void update(DevCronJobNotify request) {
        this.updateById(request);
    }
}
