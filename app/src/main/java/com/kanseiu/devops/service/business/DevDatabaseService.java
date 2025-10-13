package com.kanseiu.devops.service.business;

import com.baomidou.mybatisplus.extension.service.IService;
import com.kanseiu.devops.model.entity.DevDatabase;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

public interface DevDatabaseService extends IService<DevDatabase> {

    void add(DevDatabase database);

    void update(DevDatabase database);

    SseEmitter testConnection(Long id);
}
