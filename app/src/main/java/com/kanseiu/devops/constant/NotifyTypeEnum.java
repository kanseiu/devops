package com.kanseiu.devops.constant;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum NotifyTypeEnum {

    // 手机号
    PHONE,

    // 邮箱
    EMAIL
    ;

    public static NotifyTypeEnum getByName(String name) {
        for (NotifyTypeEnum value : values()) {
            if(value.name().equals(name)) {
                return value;
            }
        }
        return null;
    }
}
