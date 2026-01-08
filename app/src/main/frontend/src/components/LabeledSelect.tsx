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
            <div className="ui-label">{label}</div>
            <select
                className="ui-field"
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
