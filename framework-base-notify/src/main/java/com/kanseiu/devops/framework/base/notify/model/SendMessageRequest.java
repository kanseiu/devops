package com.kanseiu.devops.framework.base.notify.model;

import lombok.Data;

import java.io.Serializable;

@Data
public class SendMessageRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long businessId;

}
