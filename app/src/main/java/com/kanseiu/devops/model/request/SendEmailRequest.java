package com.kanseiu.devops.model.request;

import com.kanseiu.devops.framework.mail.model.SendMessageRequest;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

@Data
@EqualsAndHashCode(callSuper = true)
@ToString(callSuper = true)
public class SendEmailRequest extends SendMessageRequest {

    private Long businessId;

}
