package com.kanseiu.devops.model.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 脚本表实体类
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("dev_script")
public class DevScript extends BaseEntity {

    /** 主键ID */
    @TableId(type = IdType.AUTO)
    private Long id;

    /** 脚本名称，业务内唯一 */
    private String scriptName;

    /** 脚本内容（纯文本） */
    private String scriptContent;

    /** 建议工作目录 */
    private String workDir;

    /** 是否启用 */
    private Boolean disabled = false;

    /** 描述 */
    private String descText;

    // 脚本类型，SHELL、SQL等
    private String scriptType;
}