package com.kanseiu.devops.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.kanseiu.devops.model.entity.DevCronJobNotify;
import com.kanseiu.devops.model.entity.DevNotifyTarget;
import org.apache.ibatis.annotations.Param;

import java.util.List;

public interface DevCronJobNotifyMapper extends BaseMapper<DevCronJobNotify> {

    List<DevCronJobNotify> listByJobId(@Param("jobId") Long jobId);

    List<DevNotifyTarget> couldSelectNotifyTarget(@Param("jobId") Long jobId);
}
