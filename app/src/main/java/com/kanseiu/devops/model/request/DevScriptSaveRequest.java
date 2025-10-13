package com.kanseiu.devops.model.request;

import lombok.Data;

import java.io.Serializable;

@Data
public class DevScriptSaveRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long id;

    /** 脚本名称，业务内唯一 */
    private String scriptName;

    /** 脚本内容（纯文本） */
    private String scriptContent;

    /** 建议工作目录 */
    private String workDir;

    /** 是否启用 */
    private Boolean disabled;

    /** 描述 */
    private String descText;

    // 脚本类型，SQL、SHELL等
    private String scriptType;
}
