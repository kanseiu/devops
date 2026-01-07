create table if not exists DEV_CRON_JOB
(
    ID          BIGINT auto_increment
        primary key,
    JOB_NAME    CHARACTER VARYING(128)           not null,
    CRON_EXPR   CHARACTER VARYING(64)            not null,
    SCRIPT_NAME CHARACTER VARYING(128)           not null,
    SERVER_ID   BIGINT,
    ARGS_TEXT   CHARACTER VARYING(512) default NULL,
    TIMEOUT_SEC INTEGER                default 300,
    DISABLED    TINYINT                default 0 not null,
    DESC_TEXT   CHARACTER VARYING(512) default NULL,
    CREATE_TIME TIMESTAMP              default CURRENT_TIMESTAMP,
    UPDATE_TIME TIMESTAMP              default CURRENT_TIMESTAMP,
    JOB_TYPE    CHARACTER VARYING(50),
    DATABASE_ID BIGINT
);

comment on column DEV_CRON_JOB.ID is '主键ID';

comment on column DEV_CRON_JOB.JOB_NAME is '任务名称（唯一）';

comment on column DEV_CRON_JOB.CRON_EXPR is 'Cron 表达式（秒级）';

comment on column DEV_CRON_JOB.SCRIPT_NAME is '脚本名称（dev_script.script_name）';

comment on column DEV_CRON_JOB.SERVER_ID is '目标服务器ID';

comment on column DEV_CRON_JOB.ARGS_TEXT is '附加参数';

comment on column DEV_CRON_JOB.TIMEOUT_SEC is '超时秒';

comment on column DEV_CRON_JOB.DESC_TEXT is '描述';

comment on column DEV_CRON_JOB.JOB_TYPE is '任务类型，SHELL、SQL等';

comment on column DEV_CRON_JOB.DATABASE_ID is '数据库ID';

create unique index if not exists UK_JOB_NAME
    on DEV_CRON_JOB (JOB_NAME);

create table if not exists DEV_CRON_JOB_LOG
(
    ID             BIGINT auto_increment
        primary key,
    JOB_ID         BIGINT                                           not null,
    CONNECT_INFO   CHARACTER VARYING(512)                           not null,
    SCRIPT_NAME    CHARACTER VARYING(128)                           not null,
    SCRIPT_CONTENT CHARACTER VARYING                                not null,
    ARGS_TEXT      CHARACTER VARYING(512) default NULL,
    CREATE_TIME    TIMESTAMP              default CURRENT_TIMESTAMP,
    START_TIME     TIMESTAMP              default CURRENT_TIMESTAMP not null,
    END_TIME       TIMESTAMP,
    DURATION_MS    BIGINT,
    EXIT_CODE      INTEGER,
    STATUS         CHARACTER VARYING(32),
    OUTPUT_TEXT    CHARACTER LARGE OBJECT,
    ERROR_TEXT     CHARACTER LARGE OBJECT
);

comment on column DEV_CRON_JOB_LOG.ID is '主键ID';

comment on column DEV_CRON_JOB_LOG.JOB_ID is '定时任务表ID';

comment on column DEV_CRON_JOB_LOG.SCRIPT_NAME is '脚本名称';

comment on column DEV_CRON_JOB_LOG.SCRIPT_CONTENT is '脚本内容（纯文本）';

comment on column DEV_CRON_JOB_LOG.ARGS_TEXT is '附加参数';

comment on column DEV_CRON_JOB_LOG.START_TIME is '开始时间';

comment on column DEV_CRON_JOB_LOG.END_TIME is '结束时间';

comment on column DEV_CRON_JOB_LOG.DURATION_MS is '耗时(毫秒)';

comment on column DEV_CRON_JOB_LOG.EXIT_CODE is '退出码';

comment on column DEV_CRON_JOB_LOG.STATUS is '状态：SUCCESS / FAIL / TIMEOUT / ERROR';

comment on column DEV_CRON_JOB_LOG.OUTPUT_TEXT is '标准输出（可截断）';

comment on column DEV_CRON_JOB_LOG.ERROR_TEXT is '错误输出（可截断）';

create table if not exists DEV_CRON_JOB_NOTIFY
(
    ID                   BIGINT auto_increment
        primary key,
    DEV_CRON_JOB_ID      BIGINT                                          not null,
    DEV_NOTIFY_TARGET_ID BIGINT                                          not null,
    NOTIFY_ON_STATUS     CHARACTER VARYING(64) default 'FAIL,TIMEOUT,ERROR',
    DISABLED             TINYINT               default 0,
    CREATE_TIME          TIMESTAMP             default CURRENT_TIMESTAMP not null,
    UPDATE_TIME          TIMESTAMP             default CURRENT_TIMESTAMP not null,
    unique (DEV_CRON_JOB_ID, DEV_NOTIFY_TARGET_ID)
);

comment on column DEV_CRON_JOB_NOTIFY.ID is '主键ID';

comment on column DEV_CRON_JOB_NOTIFY.DEV_CRON_JOB_ID is '关联定时任务ID';

comment on column DEV_CRON_JOB_NOTIFY.DEV_NOTIFY_TARGET_ID is '关联通知目标ID';

comment on column DEV_CRON_JOB_NOTIFY.NOTIFY_ON_STATUS is '触发状态集合，逗号分隔';

comment on column DEV_CRON_JOB_NOTIFY.DISABLED is '0启用 1禁用';

create index if not exists IDX_JOB_NOTIFY__JOB
    on DEV_CRON_JOB_NOTIFY (DEV_CRON_JOB_ID);

create index if not exists IDX_JOB_NOTIFY__TARGET
    on DEV_CRON_JOB_NOTIFY (DEV_NOTIFY_TARGET_ID);

create table if not exists DEV_CRON_JOB_NOTIFY_LOG
(
    ID                      BIGINT auto_increment
        primary key,
    DEV_CRON_JOB_NOTIFY_ID  BIGINT                              not null,
    DEV_CRON_JOB_LOG_ID     BIGINT                              not null,
    USERNAME                CHARACTER VARYING(128)              not null,
    NOTIFY_TYPE             CHARACTER VARYING(32)               not null,
    NOTIFY_TYPE_CONTENT     CHARACTER VARYING(255)              not null,
    DEV_CRON_JOB_NAME       CHARACTER VARYING(128)              not null,
    DEV_CRON_JOB_LOG_STATUS CHARACTER VARYING(32),
    STATUS                  CHARACTER VARYING(32),
    MES                     CHARACTER LARGE OBJECT,
    CREATE_TIME             TIMESTAMP default CURRENT_TIMESTAMP not null,
    UPDATE_TIME             TIMESTAMP default CURRENT_TIMESTAMP not null
);

comment on column DEV_CRON_JOB_NOTIFY_LOG.ID is '主键ID';

comment on column DEV_CRON_JOB_NOTIFY_LOG.DEV_CRON_JOB_NOTIFY_ID is '定时任务执行通知配置表ID';

comment on column DEV_CRON_JOB_NOTIFY_LOG.DEV_CRON_JOB_LOG_ID is '定时任务执行日志ID';

comment on column DEV_CRON_JOB_NOTIFY_LOG.USERNAME is '用户名称（可与系统用户映射）';

comment on column DEV_CRON_JOB_NOTIFY_LOG.NOTIFY_TYPE is '通知方式：PHONE/EMAIL/WEBHOOK等';

comment on column DEV_CRON_JOB_NOTIFY_LOG.NOTIFY_TYPE_CONTENT is '通知地址/号码/URL等';

comment on column DEV_CRON_JOB_NOTIFY_LOG.DEV_CRON_JOB_NAME is '定时任务名称';

comment on column DEV_CRON_JOB_NOTIFY_LOG.DEV_CRON_JOB_LOG_STATUS is '定时任务执行状态：SUCCESS / FAIL / TIMEOUT / ERROR';

comment on column DEV_CRON_JOB_NOTIFY_LOG.STATUS is '通知日志状态，RUNNING / SUCCESS / FAIL';

comment on column DEV_CRON_JOB_NOTIFY_LOG.MES is '通知发送后的消息，主要指报错';

create unique index if not exists UK_NOTIFY_ID_JOB_LOG_ID
    on DEV_CRON_JOB_NOTIFY_LOG (DEV_CRON_JOB_NOTIFY_ID, DEV_CRON_JOB_LOG_ID);

create table if not exists DEV_DATABASE
(
    ID           BIGINT auto_increment
        primary key,
    NAME         CHARACTER VARYING(128)                           not null,
    DB_TYPE      CHARACTER VARYING(32)                            not null,
    JDBC_URL     CHARACTER VARYING(512)                           not null,
    USERNAME     CHARACTER VARYING(128) default NULL,
    PASSWORD_ENC CHARACTER VARYING(512) default NULL,
    DISABLED     TINYINT                default 0,
    DESC_TEXT    CHARACTER VARYING      default NULL,
    CREATE_TIME  TIMESTAMP              default CURRENT_TIMESTAMP not null,
    UPDATE_TIME  TIMESTAMP              default CURRENT_TIMESTAMP not null,
    TEST_SQL     CHARACTER VARYING(512)
);

comment on column DEV_DATABASE.ID is '主键ID';

comment on column DEV_DATABASE.NAME is '显示名';

comment on column DEV_DATABASE.DB_TYPE is '数据库类型: mysql/oceanbase/h2等';

comment on column DEV_DATABASE.JDBC_URL is 'JDBC连接串';

comment on column DEV_DATABASE.USERNAME is '用户名';

comment on column DEV_DATABASE.PASSWORD_ENC is '密码（加密存储）';

comment on column DEV_DATABASE.DISABLED is '是否禁用';

comment on column DEV_DATABASE.DESC_TEXT is '描述';

create table if not exists DEV_NOTIFY_TARGET
(
    ID                  BIGINT auto_increment
        primary key,
    NAME                CHARACTER VARYING(128)                           not null,
    USERNAME            CHARACTER VARYING(128)                           not null,
    NOTIFY_TYPE         CHARACTER VARYING(32)                            not null,
    NOTIFY_TYPE_CONTENT CHARACTER VARYING(255)                           not null,
    DISABLED            TINYINT                default 0,
    VERIFIED            TINYINT                default 0,
    DESC_TEXT           CHARACTER VARYING(255) default NULL,
    CREATE_TIME         TIMESTAMP              default CURRENT_TIMESTAMP not null,
    UPDATE_TIME         TIMESTAMP              default CURRENT_TIMESTAMP not null,
    unique (NOTIFY_TYPE, NOTIFY_TYPE_CONTENT)
);

comment on column DEV_NOTIFY_TARGET.ID is '主键ID';

comment on column DEV_NOTIFY_TARGET.NAME is '显示名称';

comment on column DEV_NOTIFY_TARGET.USERNAME is '用户名称（可与系统用户映射）';

comment on column DEV_NOTIFY_TARGET.NOTIFY_TYPE is '通知方式：PHONE/EMAIL/WEBHOOK等';

comment on column DEV_NOTIFY_TARGET.NOTIFY_TYPE_CONTENT is '通知地址/号码/URL等';

comment on column DEV_NOTIFY_TARGET.DISABLED is '是否禁用：0启用，1禁用';

comment on column DEV_NOTIFY_TARGET.VERIFIED is '是否已校验：0未校验，1已校验';

comment on column DEV_NOTIFY_TARGET.DESC_TEXT is '备注';

create index if not exists IDX_NOTIFY_TARGET_DISABLED
    on DEV_NOTIFY_TARGET (DISABLED);

create index if not exists IDX_NOTIFY_TARGET_TYPE
    on DEV_NOTIFY_TARGET (NOTIFY_TYPE);

create table if not exists DEV_SCRIPT
(
    ID             BIGINT auto_increment
        primary key,
    SCRIPT_NAME    CHARACTER VARYING(128)                           not null,
    SCRIPT_CONTENT CHARACTER VARYING                                not null,
    WORK_DIR       CHARACTER VARYING(255) default NULL,
    DISABLED       TINYINT                default 0                 not null,
    DESC_TEXT      CHARACTER VARYING      default NULL,
    CREATE_TIME    TIMESTAMP              default CURRENT_TIMESTAMP not null,
    UPDATE_TIME    TIMESTAMP              default CURRENT_TIMESTAMP not null,
    SCRIPT_TYPE    CHARACTER VARYING(50)  default 'SHELL'
);

comment on column DEV_SCRIPT.ID is '主键ID';

comment on column DEV_SCRIPT.SCRIPT_NAME is '脚本名称，业务内唯一';

comment on column DEV_SCRIPT.SCRIPT_CONTENT is '脚本内容（纯文本）';

comment on column DEV_SCRIPT.WORK_DIR is '建议工作目录';

comment on column DEV_SCRIPT.DESC_TEXT is '描述';

comment on column DEV_SCRIPT.CREATE_TIME is '创建时间';

comment on column DEV_SCRIPT.UPDATE_TIME is '更新时间';

comment on column DEV_SCRIPT.SCRIPT_TYPE is '脚本类型(SHELL、SQL等)';

create unique index if not exists UK_SCRIPT_NAME
    on DEV_SCRIPT (SCRIPT_NAME);

create table if not exists DEV_SERVER
(
    ID                 BIGINT auto_increment
        primary key,
    NAME               CHARACTER VARYING(100) not null,
    HOST               CHARACTER VARYING(255) not null,
    PORT               INTEGER   default 22   not null,
    USERNAME           CHARACTER VARYING(100) not null,
    AUTH_TYPE          CHARACTER VARYING(20)  not null,
    PASSWORD_ENC       CHARACTER VARYING(2048),
    PRIVATE_KEY_ENC    CHARACTER LARGE OBJECT,
    PASSPHRASE_ENC     CHARACTER VARYING(2048),
    COMMAND_ALLOW_LIST CHARACTER LARGE OBJECT,
    LABELS             CHARACTER VARYING(255),
    DISABLED           TINYINT   default 0    not null,
    CREATE_TIME        TIMESTAMP default CURRENT_TIMESTAMP,
    UPDATE_TIME        TIMESTAMP default CURRENT_TIMESTAMP,
    DEFAULT_TEST_CMD   CHARACTER VARYING(255)
);

create unique index if not exists UK_HOST_USER_PORT
    on DEV_SERVER (HOST, USERNAME, PORT);

-- Spring Session JDBC tables
create table if not exists SPRING_SESSION
(
    PRIMARY_ID             CHAR(36) not null,
    SESSION_ID             CHAR(36) not null,
    CREATION_TIME          BIGINT   not null,
    LAST_ACCESS_TIME       BIGINT   not null,
    MAX_INACTIVE_INTERVAL  INTEGER  not null,
    EXPIRY_TIME            BIGINT   not null,
    PRINCIPAL_NAME         VARCHAR(100),
    primary key (PRIMARY_ID)
);

create unique index if not exists SPRING_SESSION_IX1 on SPRING_SESSION (SESSION_ID);
create index if not exists SPRING_SESSION_IX2 on SPRING_SESSION (EXPIRY_TIME);
create index if not exists SPRING_SESSION_IX3 on SPRING_SESSION (PRINCIPAL_NAME);

create table if not exists SPRING_SESSION_ATTRIBUTES
(
    SESSION_PRIMARY_ID   CHAR(36)     not null,
    ATTRIBUTE_NAME       VARCHAR(200) not null,
    ATTRIBUTE_BYTES      BLOB         not null,
    primary key (SESSION_PRIMARY_ID, ATTRIBUTE_NAME),
    foreign key (SESSION_PRIMARY_ID) references SPRING_SESSION(PRIMARY_ID) on delete cascade
);
