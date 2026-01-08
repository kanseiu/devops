package com.kanseiu.devops.service.business.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.kanseiu.devops.constant.JobLogStatus;
import com.kanseiu.devops.framework.mail.service.SendEmail;
import com.kanseiu.devops.mapper.DevCronJobLogMapper;
import com.kanseiu.devops.model.entity.*;
import com.kanseiu.devops.model.response.DevCronJobDailyAggRow;
import com.kanseiu.devops.model.response.DevCronJobDailyJobAggRow;
import com.kanseiu.devops.model.response.DevCronJobDailyJobStat;
import com.kanseiu.devops.model.response.DevCronJobDailyStat;
import com.kanseiu.devops.model.response.DevCronJobLogResp;
import com.kanseiu.devops.service.business.DevCronJobLogService;
import com.kanseiu.devops.service.handler.SendNotifyService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.annotation.Resource;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Slf4j
@Service
public class DevCronJobLogServiceImpl extends ServiceImpl<DevCronJobLogMapper, DevCronJobLog> implements DevCronJobLogService {

    // 中文注释：最大存储长度（按需调整）
    private static final int MAX_TEXT_LEN = 100 * 1024;

    @Resource
    private SendNotifyService sendNotifyService;

    // 获取今日执行失败的定时任务日志
    @Override
    public List<DevCronJobLogResp> getTodayFail() {
        LocalDateTime todayStart = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        LocalDateTime todayEnd = LocalDateTime.of(LocalDate.now(), LocalTime.MAX);
        return this.baseMapper.getFailLogByTime(todayStart, todayEnd);
    }

    @Override
    public List<DevCronJobDailyStat> getLast7DaysStats() {
        LocalDate today = LocalDate.now();
        LocalDate startDate = today.minusDays(6);
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = LocalDateTime.of(today, LocalTime.MAX);

        Map<String, DevCronJobDailyStat> dayMap = new LinkedHashMap<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        for (int i = 0; i < 7; i++) {
            String day = startDate.plusDays(i).format(formatter);
            dayMap.put(day, new DevCronJobDailyStat(day, 0, 0, new ArrayList<>()));
        }

        List<DevCronJobDailyAggRow> dailyRows = this.baseMapper.getDailyAgg(start, end);
        for (DevCronJobDailyAggRow row : dailyRows) {
            if (row.getDayStr() == null) {
                continue;
            }
            String day = row.getDayStr().format(formatter);
            DevCronJobDailyStat stat = dayMap.get(day);
            if (stat == null) {
                continue;
            }
            int count = row.getCnt() == null ? 0 : row.getCnt();
            if ("SUCCESS".equalsIgnoreCase(row.getStatus())) {
                stat.setSuccessCount(stat.getSuccessCount() + count);
            } else {
                stat.setFailCount(stat.getFailCount() + count);
            }
        }

        Map<String, Map<Long, DevCronJobDailyJobStat>> jobMap = new LinkedHashMap<>();
        List<DevCronJobDailyJobAggRow> jobRows = this.baseMapper.getDailyJobAgg(start, end);
        for (DevCronJobDailyJobAggRow row : jobRows) {
            if (row.getDayStr() == null) {
                continue;
            }
            String day = row.getDayStr().format(formatter);
            if (!dayMap.containsKey(day)) {
                continue;
            }
            Map<Long, DevCronJobDailyJobStat> dayJobs = jobMap.computeIfAbsent(day, k -> new LinkedHashMap<>());
            Long jobId = row.getJobId();
            DevCronJobDailyJobStat jobStat = dayJobs.computeIfAbsent(jobId,
                    k -> new DevCronJobDailyJobStat(jobId, row.getJobName(), 0, 0));
            int count = row.getCnt() == null ? 0 : row.getCnt();
            if ("SUCCESS".equalsIgnoreCase(row.getStatus())) {
                jobStat.setSuccessCount(jobStat.getSuccessCount() + count);
            } else {
                jobStat.setFailCount(jobStat.getFailCount() + count);
            }
        }

        for (Map.Entry<String, DevCronJobDailyStat> entry : dayMap.entrySet()) {
            Map<Long, DevCronJobDailyJobStat> dayJobs = jobMap.get(entry.getKey());
            if (dayJobs != null) {
                entry.getValue().setJobs(new ArrayList<>(dayJobs.values()));
            }
        }

        return new ArrayList<>(dayMap.values());
    }

    /** 创建“开始”记录，返回日志ID */
    @Override
    public Long createStartLog(DevCronJob job, String connectInfo, DevScript script, String argsText) {
        DevCronJobLog log = new DevCronJobLog();
        log.setJobId(job.getId());
        log.setConnectInfo(connectInfo);
        log.setScriptName(job.getScriptName());
        log.setScriptContent(Objects.isNull(script) ? "UNKNOWN" : script.getScriptContent());
        log.setArgsText(argsText);
        log.setStartTime(LocalDateTime.now());
        log.setStatus("RUNNING");
        this.save(log);
        return log.getId();
    }


    /** 追加 stdout */
    @Override
    @Transactional
    public void appendOut(Long logId, String line) {
        DevCronJobLog log = this.getById(logId);
        if (log == null) {
            return;
        }
        log.setOutputText(appendBounded(log.getOutputText(), ensureLine(line)));
        log.setScriptContent(null);
        this.updateById(log);
    }

    /** 追加 stderr */
    @Override
    @Transactional
    public void appendErr(Long logId, String line) {
        DevCronJobLog log = this.getById(logId);
        if (log == null) {
            return;
        }
        log.setErrorText(appendBounded(log.getErrorText(), ensureLine(line)));
        log.setScriptContent(null);
        this.updateById(log);
    }

    /** 执行结束，设置 exit/status/end/duration */
    @Override
    public void finish(Long logId, Integer exitCode, JobLogStatus status, LocalDateTime startTime) {
        DevCronJobLog log = this.getById(logId);
        if (log == null) {
            return;
        }
        LocalDateTime end = LocalDateTime.now();
        log.setEndTime(end);
        log.setExitCode(exitCode);
        log.setStatus(status.name());
        if (startTime != null) {
            long dur = Duration.between(startTime, end).toMillis();
            log.setDurationMs(dur < 0 ? null : dur);
        }
        log.setScriptContent(null);
        this.updateById(log);

        // 发送邮件
        sendNotifyService.send(log);
    }

    /** 安全追加文本（带长度上限） */
    private String appendBounded(String base, String add) {
        if (add == null || add.isEmpty()) {
            return base;
        }
        String cur = base == null ? "" : base;
        int remain = MAX_TEXT_LEN - cur.length();
        if (remain <= 0) {
            return cur; // 已满
        }
        if (add.length() <= remain) {
            return cur + add;
        }
        // 截断并追加标记
        return cur + add.substring(0, remain - 15) + "\n...[truncated]";
    }

    private String ensureLine(String s) {
        if (s == null) {
            return "";
        }
        // 统一换行
        return s.endsWith("\n") ? s : (s + "\n");
    }
}
