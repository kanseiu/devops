export default function LabeledTextArea(props: {
    label: string;
    value: string | undefined;
    onChange: (v: string) => void;
    placeholder?: string;
    rows?: number;
}) {
    const { label, value, onChange, placeholder, rows = 6 } = props;

    return (
        <label style={{ display: 'block', minWidth: 0 }}>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>{label}</div>
            <textarea
                value={value ?? ''}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                rows={rows}
                style={{
                    width: '100%',
                    // ★ 同样加这里
                    boxSizing: 'border-box',
                    maxWidth: '100%',

                    padding: '8px 10px',
                    border: '1px solid #dcdfe6',
                    borderRadius: 6,
                    resize: 'vertical',
                }}
            />
        </label>
    );
}