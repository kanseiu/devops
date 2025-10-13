# 运维工具（自用）

## 前后端一体，启动1个jar包即可

## 技术架构

    Java11 + SpringBoot2.6.3 + MybatisPlus + h2 + React + Node18

## 启动方式

    前端：在 app/src/main/frontend 打开终端，第一次启动前，执行 npm install，后续执行 npm run watch

    后端：Springboot启动

## 访问

    前后端启动后，浏览器打开：http://localhost:8080

    默认账号密码：admin/admin@123

    可在 SecurityConfig 中修改默认密码

## 打包

    mvn clean package 打成 jar 包，随便找个自己能用的服务器部署即可