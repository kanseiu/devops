package com.kanseiu.devops.service.business;

import com.baomidou.mybatisplus.extension.service.IService;
import com.kanseiu.devops.model.entity.DevServer;
import com.kanseiu.devops.model.request.DevServerSaveRequest;

public interface DevServerService extends IService<DevServer> {

    void add(DevServerSaveRequest request);

    void update(DevServerSaveRequest request);
}
