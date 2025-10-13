package com.kanseiu.devops.framework.mail.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeMessage;

@Slf4j
@Service
public class MailService {

    @Resource
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String from;

    // 发送文本邮件
    public void sendText(String to, String subject, String content) throws Exception {
        this.sendEmail(to, subject, content, false);
    }

    /** 发送邮件（无附件） */
    public void sendEmail(String to, String subject, String content, boolean html) throws Exception {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        helper.setFrom(new InternetAddress(from, "DEVOPS", "UTF-8"));
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(content, html);
        mailSender.send(message);

        log.info("SendEmail ok -> {}", to);
    }

}
