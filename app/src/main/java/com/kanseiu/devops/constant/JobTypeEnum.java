package com.kanseiu.devops.constant;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum JobTypeEnum {

    SHELL("shellScriptExecService"),
    SQL("sqlScriptExecService")
    ;

    public final String execBeanName;

    public static String getExecBeanNameByType(String jobTypeName) {
        for (JobTypeEnum j : values()) {
            if(j.name().equals(jobTypeName)) {
                return j.execBeanName;
            }
        }
        throw new IllegalArgumentException("未找到 jobTypeName = [" + jobTypeName + "] 的执行器");
    }
}
