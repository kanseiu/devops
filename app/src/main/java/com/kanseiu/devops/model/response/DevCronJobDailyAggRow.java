package com.kanseiu.devops.model.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DevCronJobDailyAggRow {

    private LocalDate dayStr;

    private String status;

    private Integer cnt;
}
