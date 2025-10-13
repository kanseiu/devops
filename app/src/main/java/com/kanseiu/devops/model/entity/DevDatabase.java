package com.kanseiu.devops.model.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("dev_database")
public class DevDatabase extends BaseEntity {

    @TableId(type = IdType.AUTO)
    private Long id;

    // 数据库名称
    private String name;

    // 数据库类型（Mysql、Oceanbase、H2等）
    private String dbType;

    private String jdbcUrl;

    private String username;

    private String passwordEnc;

    private Boolean disabled;

    private String descText;

    private String testSql;
}