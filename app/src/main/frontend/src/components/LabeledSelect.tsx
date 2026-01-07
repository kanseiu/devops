interface Option {
    value: string | number;
    label: string;
}

interface Props {
    label: string;                    // 显示的标题
    value: string | number;           // 当前值
    onChange: (v: string) => void;    // 改变时触发
    options: Option[];                // 下拉选项
    disabled?: boolean;               // 是否禁用（编辑时常用）
    placeholder?: string;             // 占位符（可选）
}

export default function LabeledSelect({
                                          label,
                                          value,
                                          onChange,
                                          options,
                                          disabled = false,
                                          placeholder
                                      }: Props) {
    return (
        <label className="block min-w-0">
            <div className="text-sm text-slate-500 mb-1">{label}</div>
            <select
                className={`w-full px-3 py-2 border rounded-lg text-sm
                    ${disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white text-slate-900'}
                    border-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500/50`}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
            >
                {placeholder && <option value="">{placeholder}</option>}
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
        </label>
    );
}
