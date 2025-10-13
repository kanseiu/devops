package com.kanseiu.devops.service.business.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.kanseiu.devops.mapper.DevDatabaseMapper;
import com.kanseiu.devops.model.entity.DevDatabase;
import com.kanseiu.devops.service.business.DevDatabaseService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import javax.annotation.Resource;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.Properties;

@Slf4j
@Service
public class DevDatabaseServiceImpl extends ServiceImpl<DevDatabaseMapper, DevDatabase> implements DevDatabaseService {

    @Resource
    private ThreadPoolTaskExecutor dbExecPool;


    @Override
    public void add(DevDatabase database) {
        database.setDisabled(false);
        this.save(database);
    }

    @Override
    public void update(DevDatabase database) {
        this.updateById(database);
    }



    // 测试数据库连接
    @Override
    public SseEmitter testConnection(Long id) {
        SseEmitter emitter = new SseEmitter(30000L); // 30 秒超时
        dbExecPool.submit(() -> {
            try {
                DevDatabase db = getById(id);
                emitter.send(SseEmitter.event().name("meta").data("测试连接 " + db.getJdbcUrl()));

                Properties props = new Properties();
                props.setProperty("user", db.getUsername());
                props.setProperty("password", db.getPasswordEnc());

                try (Connection conn = DriverManager.getConnection(db.getJdbcUrl(), props)) {
                    emitter.send(SseEmitter.event().name("stdout").data("连接成功"));

                    // 如果配置了 test_sql，就执行
                    if (db.getTestSql() != null && !db.getTestSql().isBlank()) {
                        emitter.send(SseEmitter.event().name("meta").data("执行测试 SQL: " + db.getTestSql()));
                        try (Statement stmt = conn.createStatement()) {
                            boolean hasResult = stmt.execute(db.getTestSql());
                            if (hasResult) {
                                try (ResultSet rs = stmt.getResultSet()) {
                                    int colCount = rs.getMetaData().getColumnCount();
                                    int rowCount = 0;
                                    while (rs.next() && rowCount < 5) { // 最多展示 5 行
                                        StringBuilder row = new StringBuilder();
                                        for (int i = 1; i <= colCount; i++) {
                                            if (i > 1) {
                                                row.append(" | ");
                                            }
                                            row.append(rs.getMetaData().getColumnLabel(i)).append("=")
                                                    .append(rs.getString(i));
                                        }
                                        emitter.send(SseEmitter.event().name("stdout").data(row.toString()));
                                        rowCount++;
                                    }
                                    if (rowCount == 0) {
                                        emitter.send(SseEmitter.event().name("stdout").data("(查询结果为空)"));
                                    }
                                }
                            } else {
                                int updateCount = stmt.getUpdateCount();
                                emitter.send(SseEmitter.event().name("stdout").data("执行成功，更新行数: " + updateCount));
                            }
                        }
                    }

                    emitter.send(SseEmitter.event().name("end").data("0"));
                }
            } catch (Exception e) {
                try {
                    emitter.send(SseEmitter.event().name("error").data(e.getMessage()));
                    emitter.send(SseEmitter.event().name("end").data("-1"));
                } catch (Exception ignore) {}
            } finally {
                emitter.complete();
            }
        });
        return emitter;
    }
}
