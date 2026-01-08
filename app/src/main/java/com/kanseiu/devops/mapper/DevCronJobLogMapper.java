package com.kanseiu.devops.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.kanseiu.devops.model.entity.DevCronJobLog;
import com.kanseiu.devops.model.response.DevCronJobLogResp;
import com.kanseiu.devops.model.response.DevCronJobDailyAggRow;
import com.kanseiu.devops.model.response.DevCronJobDailyJobAggRow;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface DevCronJobLogMapper extends BaseMapper<DevCronJobLog> {

    List<DevCronJobLogResp> getFailLogByTime(@Param("start") LocalDateTime start,
                                             @Param("end") LocalDateTime end);

    List<DevCronJobDailyAggRow> getDailyAgg(@Param("start") LocalDateTime start,
                                           @Param("end") LocalDateTime end);

    List<DevCronJobDailyJobAggRow> getDailyJobAgg(@Param("start") LocalDateTime start,
                                                 @Param("end") LocalDateTime end);

}
