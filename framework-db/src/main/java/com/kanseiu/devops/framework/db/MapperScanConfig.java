package com.kanseiu.devops.framework.db;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.context.annotation.Configuration;

@Configuration
@MapperScan(basePackages = "com.kanseiu.devops.mapper")
public class MapperScanConfig {
}
