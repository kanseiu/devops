package com.kanseiu.devops.service.business.impl;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.kanseiu.devops.mapper.DevScriptMapper;
import com.kanseiu.devops.model.entity.DevCronJob;
import com.kanseiu.devops.model.entity.DevScript;
import com.kanseiu.devops.model.request.DevScriptSaveRequest;
import com.kanseiu.devops.service.business.DevCronJobService;
import com.kanseiu.devops.service.business.DevScriptService;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;

@Service
public class DevScriptServiceImpl extends ServiceImpl<DevScriptMapper, DevScript> implements DevScriptService {

    @Resource
    private DevCronJobService devCronJobService;

    @Override
    public void add(DevScriptSaveRequest request) {

        DevScript devScript = new DevScript();
        BeanUtils.copyProperties(request, devScript);

        this.save(devScript);
    }

    @Override
    public void update(DevScriptSaveRequest request) {
        DevScript devScript = new DevScript();
        BeanUtils.copyProperties(request, devScript);

        this.updateById(devScript);
    }

    @Override
    public DevScript getByName(String scriptName) {
        return this.getOne(Wrappers.<DevScript>lambdaQuery().eq(DevScript::getScriptName, scriptName));
    }

    @Override
    public void delete(Long id) {
        DevScript script = this.getById(id);
        if (script == null) {
            throw new IllegalArgumentException("脚本不存在，id=" + id);
        }
        long usingCount = devCronJobService.count(Wrappers.<DevCronJob>lambdaQuery()
                .eq(DevCronJob::getScriptName, script.getScriptName()));
        if (usingCount > 0) {
            throw new IllegalArgumentException("该脚本被定时任务使用，无法删除");
        }
        this.removeById(id);
    }
}
