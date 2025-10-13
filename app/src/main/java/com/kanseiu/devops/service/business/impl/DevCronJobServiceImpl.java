package com.kanseiu.devops.service.business.impl;

import cn.hutool.core.date.DatePattern;
import cn.hutool.core.date.DateUtil;
import cn.hutool.core.util.StrUtil;
import cn.hutool.cron.CronUtil;
import cn.hutool.cron.Scheduler;
import cn.hutool.cron.pattern.CronPattern;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.kanseiu.devops.constant.JobStatusEnum;
import com.kanseiu.devops.constant.ProjectConstant;
import com.kanseiu.devops.cron.CronRegistrar;
import com.kanseiu.devops.mapper.DevCronJobMapper;
import com.kanseiu.devops.model.entity.DevCronJob;
import com.kanseiu.devops.service.business.DevCronJobService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.annotation.Resource;
import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
public class DevCronJobServiceImpl extends ServiceImpl<DevCronJobMapper, DevCronJob> implements DevCronJobService {

    @Resource
    private CronRegistrar cronRegistrar;

    // 获取所有定时任务（按更新时间倒序）
    @Override
    public List<DevCronJob> listAll() {
        // 获取任务列表
        List<DevCronJob> jobList = this.list(Wrappers.<DevCronJob>lambdaQuery().orderByAsc(DevCronJob::getId));
        // 获取调度器与已注册任务表
        Scheduler scheduler = CronUtil.getScheduler();
        // 获取已经注册到调度器中的任务ID
        List<String> registeredIdList = scheduler != null && scheduler.getTaskTable() != null ? scheduler.getTaskTable().getIds() : Collections.emptyList();
        // 判断调度器是否已启动
        boolean schedulerStarted = (scheduler != null) && scheduler.isStarted();
        // 设置JOB的状态
        jobList.forEach(j -> {
            boolean registered = registeredIdList.contains(CronRegistrar.taskIdOf(j.getId()));
            j.setStatus(JobStatusEnum.get(j.getDisabled(), registered, schedulerStarted).name());
            CronPattern cronPattern = new CronPattern(j.getCronExpr());
            Calendar calendar = cronPattern.nextMatchAfter(DateUtil.calendar());
            j.setNextRunTime(DateUtil.format(calendar.getTime(), DatePattern.NORM_DATETIME_PATTERN));
        });
        // 返回
        return jobList;
    }

    // 新增任务
    @Override
    public Long add(DevCronJob req) {
        // 简单数据校验
        req.check();
        // 检查任务名称重复
        this.checkJobNameDuplicate(req);
        // 保存
        this.save(req);
        // 注册任务
        this.registerJob(req);
        // 返回ID
        return req.getId();
    }

    // 更新任务
    @Override
    public Long update(DevCronJob req) {
        // 获取存在的任务
        DevCronJob exist = Optional.ofNullable(this.getById(req.getId())).orElseThrow(() -> new IllegalArgumentException("任务不存在，id=" + req.getId()));
        // 简单数据校验
        req.check();
        // 检查任务名称重复
        this.checkJobNameDuplicate(req);
        // 设置可更新的字段
        exist.setCronExpr(req.getCronExpr());
        exist.setArgsText(req.getArgsText());
        exist.setTimeoutSec(req.getTimeoutSec());
        exist.setDisabled(req.getDisabled());
        exist.setDescText(StrUtil.trimToNull(req.getDescText()));
        // 更新
        this.updateById(exist);
        // 注册任务
        this.registerJob(exist);
        // 返回ID
        return exist.getId();
    }

    // 获取定时任务名称
    @Override
    public String getJobName(Long id) {
        if(Objects.isNull(id)) {
            return ProjectConstant.UNKNOWN;
        } else {
            DevCronJob devCronJob = this.getById(id);
            return Objects.isNull(devCronJob) ? ProjectConstant.UNKNOWN : devCronJob.getJobName();
        }
    }

    // 暂停任务
    @Override
    @Transactional(rollbackFor = Exception.class)
    public void pause(Long id) {
        // 查询任务
        DevCronJob job = Optional.ofNullable(this.getById(id)).orElseThrow(() -> new IllegalArgumentException("任务不存在，id=" + id));
        // 更新任务为禁用
        job.setDisabled(true);
        this.updateById(job);
        // 取消注册任务
        cronRegistrar.unregister(id);
    }

    // 恢复任务
    @Override
    @Transactional(rollbackFor = Exception.class)
    public void resume(Long id) {
        // 查询任务
        DevCronJob job = Optional.ofNullable(this.getById(id)).orElseThrow(() -> new IllegalArgumentException("任务不存在，id=" + id));
        // 更新任务为启用
        job.setDisabled(false);
        this.updateById(job);
        // 注册任务
        cronRegistrar.register(job);
    }

    // 重载数据库中的定时任务
    @Override
    public void reloadAll() {
        // 清空调度器中的所有任务
        CronUtil.getScheduler().clear();
        // 获取数据库中的全部任务
        List<DevCronJob> jobs = this.list(null);
        // 注册任务
        for (DevCronJob job : jobs) {
            if (Boolean.FALSE.equals(job.getDisabled())) {
                try {
                    log.info("正在注册定时任务[{}]", job.getJobName());
                    cronRegistrar.register(job);
                } catch (Exception e) {
                    log.error("定时任务[{}]注册失败！", job.getJobName(), e);
                }
            } else {
                log.info("定时任务[{}]已经被禁用，不注册！", job.getJobName());
            }
        }
    }

    // 注册任务
    private void registerJob(DevCronJob req) {
        if (Boolean.FALSE.equals(req.getDisabled())) {
            cronRegistrar.register(req);
        } else {
            cronRegistrar.unregister(req.getId());
        }
    }

    // 检查任务名称重复
    private void checkJobNameDuplicate(DevCronJob req) {
        if (this.count(Wrappers.<DevCronJob>lambdaQuery().eq(DevCronJob::getJobName, req.getJobName()).ne(Objects.nonNull(req.getId()), DevCronJob::getId, req.getId())) > 0) {
            throw new IllegalArgumentException("任务名称已存在：" + req.getJobName());
        }
    }
}