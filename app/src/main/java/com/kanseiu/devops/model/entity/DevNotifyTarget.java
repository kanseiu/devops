package com.kanseiu.devops.model.entity;

import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.annotation.*;
import com.kanseiu.devops.constant.NotifyTypeEnum;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.Objects;

/**
 * 通知对象表实体类
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("dev_notify_target")
public class DevNotifyTarget extends BaseEntity {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 显示名称 */
    private String name;

    /** 用户名称（可与系统用户映射） */
    private String username;

    /** 通知方式，PHONE、EMAIL等 */
    private String notifyType;

    /** 通知方式内容，如手机号、邮箱地址，对应上方 */
    private String notifyTypeContent;

    /** 是否禁用，0启用，1禁用 */
    private Boolean disabled = false;

    // 是否已校验：0未校验，1已校验
    private Boolean verified = false;

    // 备注
    private String descText;

    public void check() {
        if(StrUtil.isBlank(name)) {
            throw new IllegalArgumentException("显示名称不能为空");
        }
        if(StrUtil.isBlank(username)) {
            throw new IllegalArgumentException("用户名称不能为空");
        }
        if(StrUtil.isBlank(notifyType)) {
            throw new IllegalArgumentException("通知方式不能为空");
        } else {
            if(Objects.isNull(NotifyTypeEnum.getByName(notifyType))) {
                throw new IllegalArgumentException("通知方式不正确");
            }
        }
        if(StrUtil.isBlank(notifyTypeContent)) {
            throw new IllegalArgumentException("通知方式内容不能为空");
        }
    }
}