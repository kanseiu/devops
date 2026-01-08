package com.kanseiu.devops.model.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DevCronJobDailyJobAggRow {

    private LocalDate dayStr;

    private Long jobId;

    private String jobName;

    private String status;

    private Integer cnt;
}
