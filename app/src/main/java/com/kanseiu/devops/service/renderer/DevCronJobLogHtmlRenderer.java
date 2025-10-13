package com.kanseiu.devops.service.renderer;

import com.kanseiu.devops.model.entity.DevCronJobLog;

import java.time.LocalDateTime;

// 中文注释：渲染器——把 DevCronJobLog 渲染成 HTML。注意：不展示脚本内容与附加参数
public class DevCronJobLogHtmlRenderer {

    // 中文注释：将换行做成 <br>，或放到 <pre> 里，此处输出/错误使用 <pre>
    private static String esc(String s) {
        if (s == null) return "";
        // 中文注释：基本 HTML 转义，避免 XSS 或标签破坏
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;");
    }

    // 中文注释：状态配色（与前端保持一致风格）
    private static String statusColor(String st) {
        if (st == null) {
            return "#374151"; // gray-700
        }
        switch (st) {
            case "SUCCESS": return "#047857"; // emerald-700
            case "FAIL":    return "#be123c"; // rose-700
            case "TIMEOUT": return "#b45309"; // amber-700
            case "ERROR":   return "#374151"; // gray-700
            default:        return "#374151";
        }
    }

    // 中文注释：格式化时间
    private static String fmt(LocalDateTime t) {
        if (t == null) {
            return "";
        }
        return t.toString().replace('T', ' ');
    }

    // 中文注释：耗时格式化
    private static String fmtDur(Long ms) {
        if (ms == null) {
            return "";
        }
        if (ms < 1000) {
            return ms + " ms";
        }
        long sec = Math.round(ms / 1000.0);
        if (sec < 60) {
            return sec + " s";
        }
        return (sec / 60) + " m " + (sec % 60) + " s";
    }

    // 中文注释：主体渲染
    public static String renderHtml(DevCronJobLog log) {
        String status = log.getStatus();
        String color = statusColor(status);
        String title = "定时任务执行失败通知"; // 中文注释：可根据状态动态修改标题
        if ("SUCCESS".equalsIgnoreCase(status)) {
            title = "定时任务执行成功（预览）";
        }

        StringBuilder sb = new StringBuilder(4096);
        sb.append("<!doctype html><html><head><meta charset='utf-8'>")
          .append("<meta name='viewport' content='width=device-width, initial-scale=1'>")
          .append("<title>").append(title).append("</title>")
          // 中文注释：简单内联样式，尽量通用、不依赖外部 CSS
          .append("<style>")
          .append("body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,'Noto Sans';")
          .append("background:#f9fafb;color:#111827;margin:0;padding:24px;}")
          .append(".card{max-width:880px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;box-shadow:0 6px 24px rgba(0,0,0,.06);}")
          .append(".hd{padding:18px 20px;border-bottom:1px solid #f3f4f6;display:flex;justify-content:space-between;align-items:center;}")
          .append(".ttl{font-weight:700;font-size:18px;}")
          .append(".badge{display:inline-block;font-size:12px;padding:2px 8px;border-radius:999px;color:#fff;background:")
          .append(color).append(";}")
          .append(".sec{padding:16px 20px;border-bottom:1px solid #f3f4f6;}")
          .append(".sec:last-child{border-bottom:none}")
          .append(".kv{display:grid;grid-template-columns:auto 1fr;gap:8px 16px;font-size:14px;}")
          .append(".k{color:#6b7280;text-align:right;white-space: nowrap;}")
          .append(".v{color:#111827;word-break:break-all;}")
          .append("pre{white-space:pre-wrap;word-break:break-word;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation Mono','Courier New',monospace;")
          .append("font-size:12px;line-height:1.6;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:10px;margin:0;}")
          .append(".hint{font-size:12px;color:#6b7280;margin-top:6px}")
          .append("</style></head><body>")
          .append("<div class='card'>");

        // 中文注释：头部 + 状态徽章
        sb.append("<div class='hd'>")
          .append("<div class='ttl'>").append(title).append("</div>")
          .append("<span class='badge'>").append(esc(status == null ? "UNKNOWN" : status)).append("</span>")
          .append("</div>");

        // 中文注释：基本信息（不含脚本内容、附加参数）
        sb.append("<div class='sec'><div class='kv'>");

        sb.append("<div class='k'>日志ID</div><div class='v'>#").append(log.getId()).append("</div>");
        sb.append("<div class='k'>任务ID</div><div class='v'>").append(log.getJobId()).append("</div>");
        sb.append("<div class='k'>连接信息</div><div class='v'>").append(esc(log.getConnectInfo())).append("</div>");
        sb.append("<div class='k'>任务名称</div><div class='v'>").append(esc(log.getJobName())).append("</div>");
        sb.append("<div class='k'>退出码</div><div class='v'>").append(log.getExitCode() == null ? "" : log.getExitCode()).append("</div>");
        sb.append("<div class='k'>耗时</div><div class='v'>").append(fmtDur(log.getDurationMs())).append("</div>");
        sb.append("<div class='k'>创建时间</div><div class='v'>").append(fmt(log.getCreateTime())).append("</div>");
        sb.append("<div class='k'>开始时间</div><div class='v'>").append(fmt(log.getStartTime())).append("</div>");
        sb.append("<div class='k'>结束时间</div><div class='v'>").append(fmt(log.getEndTime())).append("</div>");

        sb.append("</div></div>");

        // 中文注释：标准输出
        sb.append("<div class='sec'>")
          .append("<div style='font-weight:600;margin-bottom:8px'>标准输出（output）</div>")
          .append("<pre>").append(esc(defaultIfBlank(log.getOutputText(), "(无输出)"))).append("</pre>")
          .append("</div>");

        // 中文注释：错误输出
        sb.append("<div class='sec'>")
          .append("<div style='font-weight:600;margin-bottom:8px'>错误输出（error）</div>")
          .append("<pre>").append(esc(defaultIfBlank(log.getErrorText(), "(无错误输出)"))).append("</pre>")
          .append("</div>");

        // 中文注释：页脚小提示
        sb.append("<div class='sec'>")
          .append("<div class='hint'>本邮件为系统自动生成预览（未包含脚本内容与附加参数）。如有疑问请联系运维。</div>")
          .append("</div>");

        sb.append("</div></body></html>");
        return sb.toString();
    }

    private static String defaultIfBlank(String s, String def) {
        return (s == null || s.isBlank()) ? def : s;
    }
}