package com.kanseiu.devops.service.handler;

import com.kanseiu.devops.model.entity.DevCronJob;
import com.kanseiu.devops.service.callback.LiveExecCallback;

public interface DevScriptExecService {

    void execute(DevCronJob job, LiveExecCallback cb);

}