package com.kanseiu.devops.model.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DevCronJobDailyStat {

    private String day;

    private int successCount;

    private int failCount;

    private List<DevCronJobDailyJobStat> jobs;
}
