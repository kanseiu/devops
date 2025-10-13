package com.kanseiu.devops.service.business.impl;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.kanseiu.devops.mapper.DevScriptMapper;
import com.kanseiu.devops.model.entity.DevScript;
import com.kanseiu.devops.model.request.DevScriptSaveRequest;
import com.kanseiu.devops.service.business.DevScriptService;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

@Service
public class DevScriptServiceImpl extends ServiceImpl<DevScriptMapper, DevScript> implements DevScriptService {

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
}
