package com.kanseiu.devops.service.business;

import com.baomidou.mybatisplus.extension.service.IService;
import com.kanseiu.devops.model.entity.DevScript;
import com.kanseiu.devops.model.request.DevScriptSaveRequest;

public interface DevScriptService extends IService<DevScript> {

    void add(DevScriptSaveRequest request);

    void update(DevScriptSaveRequest request);

    DevScript getByName(String scriptName);

}
