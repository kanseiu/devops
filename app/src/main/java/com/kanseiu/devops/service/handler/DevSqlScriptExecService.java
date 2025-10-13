package com.kanseiu.devops.service.handler;

import cn.hutool.core.util.StrUtil;
import com.kanseiu.devops.model.entity.DevCronJob;
import com.kanseiu.devops.model.entity.DevDatabase;
import com.kanseiu.devops.model.entity.DevScript;
import com.kanseiu.devops.service.callback.LiveExecCallback;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.Objects;
import java.util.Properties;

// 执行SQL脚本
@Slf4j
@Service("sqlScriptExecService")
public class DevSqlScriptExecService implements DevScriptExecService {

    @Resource
    private ThreadPoolTaskExecutor dbExecPool;

    @Resource
    private DevCommonScriptExecService devCommonScriptExecService;


    @Override
    public void execute(DevCronJob job, LiveExecCallback cb) {
        log.info("[执行脚本]scriptName = {}, databaseId = {}, timeoutSec = {}, args = {}", job.getScriptName(), job.getDatabaseId(), job.getTimeoutSec(), job.getArgsText());

        // 获取数据库
        DevDatabase db = devCommonScriptExecService.getDbBeforeExec(job, cb);
        if(db == null) {return;}

        // 获取脚本
        DevScript script = devCommonScriptExecService.getScriptBeforeExec(job, db.getJdbcUrl(), cb);
        if (script == null) {return;}

        // 获取 DbLoggingCallback
        if(Objects.isNull(cb)) {
            cb = devCommonScriptExecService.getDbLoggingCallback(job, script, db.getJdbcUrl());
        }

        // 执行
        this.execute(job, cb, db, script);
    }

    private void execute(DevCronJob job, LiveExecCallback cb, DevDatabase db, DevScript script) {
        dbExecPool.submit(() -> {

            try {
                cb.onStdout("测试连接 " + db.getJdbcUrl());

                Properties props = new Properties();
                props.setProperty("user", db.getUsername());
                props.setProperty("password", db.getPasswordEnc());

                try (Connection conn = DriverManager.getConnection(db.getJdbcUrl(), props)) {
                    cb.onStdout("连接成功");
                    if(StrUtil.isNotBlank(script.getScriptContent())) {
                        cb.onStdout("开始执行SQL: " + script.getScriptContent());
                        try (Statement stmt = conn.createStatement();
                             ResultSet rs = stmt.executeQuery(script.getScriptContent())) {

                            if (rs.next()) {
                                Object value = rs.getObject(1); // 拿第一列返回值
                                String resultStr = String.valueOf(value).toLowerCase();

                                cb.onStdout("执行结果: " + resultStr);

                                // 判断结果合法性
                                if ("true".equals(resultStr) || "1".equals(resultStr)) {
                                    cb.onStdout("校验成功，结果为真");
                                } else if ("false".equals(resultStr) || "0".equals(resultStr)) {
                                    cb.onStderr("SQL 执行失败，结果为假 (false/0)");
                                    cb.onEnd(-1);
                                    return;
                                } else {
                                    cb.onStderr("SQL 执行失败，结果不合法: " + resultStr);
                                    cb.onEnd(-1);
                                    return;
                                }
                            } else {
                                cb.onStderr("SQL 执行失败，没有返回结果");
                                cb.onEnd(-1);
                                return;
                            }
                        }
                    } else {
                        cb.onStderr("没有SQL脚本可以执行");
                        cb.onEnd(-1);
                        return;
                    }
                }
            } catch (Exception e) {
                cb.onError(e);
                return;
            }

            cb.onEnd(0);
        });
    }
}
