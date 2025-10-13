export default function LabeledInput(props: {
    label: string;
    type?: string;
    value: any;
    onChange: (v: any) => void;
    placeholder?: string;
    autoComplete?: string;
}) {
    const { label, type = 'text', value, onChange, placeholder, autoComplete, disabled } = props;

    return (
        <label style={{ display: 'block', minWidth: 0 }}>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>{label}</div>
            <input
                type={type}
                value={value ?? ''}
                onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
                placeholder={placeholder}
                autoComplete={autoComplete}
                disabled={disabled}
                style={{
                    width: '100%',
                    // ★ 关键，防止 Grid 下溢出
                    boxSizing: 'border-box',
                    maxWidth: '100%',

                    padding: '8px 10px',
                    border: '1px solid #dcdfe6',
                    borderRadius: 6,
                    background: disabled ? '#f5f5f5' : '#fff',
                    color: disabled ? '#999' : 'inherit',
                }}
            />
        </label>
    );
}