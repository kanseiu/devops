-- 服务器信息表（支持用户名+密码 或 私钥）
CREATE TABLE IF NOT EXISTS dev_server (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,           -- 主键
    name VARCHAR(100) NOT NULL,                     -- 显示名（便于识别）
    host VARCHAR(255) NOT NULL,                     -- 主机名或IP
    port INT NOT NULL DEFAULT 22,                   -- SSH端口
    username VARCHAR(100) NOT NULL,                 -- 登录用户名（建议非root）
    auth_type VARCHAR(20) NOT NULL,                 -- 鉴权类型：password / privateKey
    password_enc VARCHAR(2048),                     -- 加密后的密码（演示可明文，生产建议加密）
    private_key_enc CLOB,                           -- 加密后的私钥内容或路径引用
    passphrase_enc VARCHAR(2048),                   -- 私钥口令（如有）
    command_allow_list CLOB,                        -- 命令白名单（正则，多行）
    labels VARCHAR(255),                            -- 标签（逗号分隔，便于分组）
    disabled TINYINT NOT NULL DEFAULT 0,            -- 是否禁用
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- 更新时间
    default_test_cmd VARCHAR(255)                    -- 默认测试命令
);
-- 避免同一主机同一用户重复录入
CREATE UNIQUE INDEX IF NOT EXISTS uk_host_user_port ON dev_server(host, username, port);

-- 脚本存储表
CREATE TABLE IF NOT EXISTS dev_script (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    script_name     VARCHAR(128) NOT NULL COMMENT '脚本名称，业务内唯一',
    script_content  MEDIUMTEXT   NOT NULL COMMENT '脚本内容（纯文本）',
    work_dir        VARCHAR(255) DEFAULT NULL COMMENT '建议工作目录',
    disabled        TINYINT NOT NULL DEFAULT 0,            -- 是否禁用
    desc_text       TEXT         DEFAULT NULL COMMENT '描述',
    create_time     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    script_type     VARCHAR(50)   DEFAULT 'SHELL' COMMENT '脚本类型，SHELL、SQL等'
);
CREATE UNIQUE INDEX IF NOT EXISTS uk_script_name ON dev_script(script_name);

-- 定时任务表
CREATE TABLE IF NOT EXISTS dev_cron_job (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    job_name        VARCHAR(128) NOT NULL COMMENT '任务名称（唯一）',
    cron_expr       VARCHAR(64)  NOT NULL COMMENT 'Cron 表达式（秒级）',
    script_name     VARCHAR(128) NOT NULL COMMENT '脚本名称（dev_script.script_name）',
    server_id       BIGINT       DEFAULT NULL COMMENT '目标服务器ID',
    args_text       VARCHAR(512) DEFAULT NULL COMMENT '附加参数',
    timeout_sec     INT          DEFAULT 300 COMMENT '超时秒',
    disabled        TINYINT NOT NULL DEFAULT 0,            -- 是否禁用
    desc_text       VARCHAR(512) DEFAULT NULL COMMENT '描述',
    create_time     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    update_time     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    job_type        VARCHAR(50)   DEFAULT 'SHELL' COMMENT '任务类型，SHELL、SQL等',
    database_id     BIGINT       DEFAULT NULL COMMENT '目标数据库ID'
);
CREATE UNIQUE INDEX IF NOT EXISTS uk_job_name ON dev_cron_job(job_name);

-- 定时任务执行日志
CREATE TABLE IF NOT EXISTS dev_cron_job_log (
    id                  BIGINT PRIMARY KEY AUTO_INCREMENT                   COMMENT '主键ID',
    job_id              BIGINT       NOT NULL                               COMMENT '定时任务表ID',
    connect_info        VARCHAR(512) NOT NULL                               COMMENT '服务器IP或JDBC',
    script_name         VARCHAR(128) NOT NULL                               COMMENT '脚本名称',
    script_content      MEDIUMTEXT   NOT NULL                               COMMENT '脚本内容（纯文本）',
    args_text           VARCHAR(512)            DEFAULT NULL                COMMENT '附加参数',
    create_time         TIMESTAMP               DEFAULT CURRENT_TIMESTAMP,
    start_time          TIMESTAMP    NOT NULL   DEFAULT CURRENT_TIMESTAMP   COMMENT '开始时间',
    end_time            TIMESTAMP                                           COMMENT '结束时间',
    duration_ms         BIGINT                                              COMMENT '耗时(毫秒)',
    exit_code           INT                                                 COMMENT '退出码',
    status              VARCHAR(32)                                         COMMENT '状态：SUCCESS / FAIL / TIMEOUT / ERROR',
    output_text         CLOB                                                COMMENT '标准输出（可截断）',
    error_text          CLOB                                                COMMENT '错误输出（可截断）'
);

-- 数据库信息表
CREATE TABLE IF NOT EXISTS dev_database (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    name            VARCHAR(128) NOT NULL COMMENT '显示名',
    db_type         VARCHAR(32)  NOT NULL COMMENT '数据库类型: mysql/oceanbase/h2等',
    jdbc_url        VARCHAR(512) NOT NULL COMMENT 'JDBC连接串',
    username        VARCHAR(128) DEFAULT NULL COMMENT '用户名',
    password_enc    VARCHAR(512) DEFAULT NULL COMMENT '密码（加密存储）',
    disabled        TINYINT(1)   DEFAULT 0 COMMENT '是否禁用',
    desc_text       TEXT         DEFAULT NULL COMMENT '描述',
    create_time     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    test_sql        VARCHAR(512)    DEFAULT NULL COMMENT '测试连接SQL'
);

-- 通知对象表
CREATE TABLE IF NOT EXISTS dev_notify_target (
    id                   BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    name                 VARCHAR(128) NOT NULL COMMENT '显示名称',
    username             VARCHAR(128) NOT NULL COMMENT '用户名称（可与系统用户映射）',
    notify_type          VARCHAR(32)  NOT NULL COMMENT '通知方式：PHONE/EMAIL/WEBHOOK等',
    notify_type_content  VARCHAR(255) NOT NULL COMMENT '通知地址/号码/URL等',
    disabled             TINYINT(1)   DEFAULT 0 COMMENT '是否禁用：0启用，1禁用',
    verified             TINYINT(1)   DEFAULT 0 COMMENT '是否已校验：0未校验，1已校验',
    desc_text            VARCHAR(255) DEFAULT NULL COMMENT '备注',
    create_time          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE (notify_type, notify_type_content)
);
CREATE INDEX IF NOT EXISTS idx_notify_target_type ON dev_notify_target (notify_type);
CREATE INDEX IF NOT EXISTS idx_notify_target_disabled ON dev_notify_target (disabled);

-- 定时任务执行通知配置表
CREATE TABLE IF NOT EXISTS dev_cron_job_notify (
    id                      BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    dev_cron_job_id         BIGINT NOT NULL COMMENT '关联定时任务ID',
    dev_notify_target_id    BIGINT NOT NULL COMMENT '关联通知目标ID',
    notify_on_status        VARCHAR(64) DEFAULT 'FAIL,TIMEOUT,ERROR' COMMENT '触发状态集合，逗号分隔',
    disabled                TINYINT(1) DEFAULT 0 COMMENT '0启用 1禁用',
    create_time             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE (dev_cron_job_id, dev_notify_target_id)
);
CREATE INDEX IF NOT EXISTS idx_job_notify__job ON dev_cron_job_notify(dev_cron_job_id);
CREATE INDEX IF NOT EXISTS idx_job_notify__target ON dev_cron_job_notify(dev_notify_target_id);

-- 定时任务执行通知日志表
CREATE TABLE IF NOT EXISTS dev_cron_job_notify_log (
    id                              BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    dev_cron_job_notify_id          BIGINT NOT NULL COMMENT '定时任务执行通知配置表ID',
    dev_cron_job_log_id             BIGINT NOT NULL COMMENT '定时任务执行日志ID',
    username                        VARCHAR(128) NOT NULL COMMENT '用户名称（可与系统用户映射）',
    notify_type                     VARCHAR(32)  NOT NULL COMMENT '通知方式：PHONE/EMAIL/WEBHOOK等',
    notify_type_content             VARCHAR(255) NOT NULL COMMENT '通知地址/号码/URL等',
    dev_cron_job_name               VARCHAR(128) NOT NULL COMMENT '定时任务名称',
    dev_cron_job_log_status         VARCHAR(32)  COMMENT '定时任务执行状态：SUCCESS / FAIL / TIMEOUT / ERROR',
    status                          VARCHAR(32)  COMMENT '通知日志状态，RUNNING / SUCCESS / FAIL',
    mes                             CLOB         COMMENT '通知发送后的消息，主要指报错',
    create_time                     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time                     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS uk_notify_id_job_log_id ON dev_cron_job_notify_log(dev_cron_job_notify_id, dev_cron_job_log_id);