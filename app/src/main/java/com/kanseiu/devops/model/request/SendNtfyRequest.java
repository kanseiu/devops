package com.kanseiu.devops.model.request;

import lombok.Data;

import java.io.Serializable;

@Data
public class SendNtfyRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long businessId;

    private String token;

    private String title;

    private String mes;

}
