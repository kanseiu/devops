// 中文注释：统一响应泛型类型
export interface ApiResp<T> {
    code: number;   // 中文注释：业务码，200 表示成功
    msg: string;    // 中文注释：业务消息
    data: T | null; // 中文注释：数据可能为 null
}