export default function LabeledTextArea(props: {
    label: string;
    value: string | undefined;
    onChange: (v: string) => void;
    placeholder?: string;
    rows?: number;
}) {
    const { label, value, onChange, placeholder, rows = 6 } = props;

    return (
        <label className="block min-w-0">
            <div className="ui-label">{label}</div>
            <textarea
                value={value ?? ''}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                rows={rows}
                className="ui-field resize-y"
            />
        </label>
    );
}
