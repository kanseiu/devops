package com.kanseiu.devops.service.business;

import com.baomidou.mybatisplus.extension.service.IService;
import com.kanseiu.devops.model.entity.DevNotifyTarget;

public interface DevNotifyTargetService extends IService<DevNotifyTarget> {

    void add(DevNotifyTarget request);

    void update(DevNotifyTarget request);

}
