package com.kanseiu.devops.model.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DevCronJobDailyJobStat {

    private Long jobId;

    private String jobName;

    private int successCount;

    private int failCount;
}
