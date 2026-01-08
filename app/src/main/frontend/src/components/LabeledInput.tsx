export default function LabeledInput(props: {
    label: string;
    type?: string;
    value: any;
    onChange: (v: any) => void;
    placeholder?: string;
    autoComplete?: string;
    name?: string;
    disabled?: boolean;
}) {
    const { label, type = 'text', value, onChange, placeholder, autoComplete, name, disabled } = props;

    return (
        <label className="block min-w-0">
            <div className="ui-label">{label}</div>
            <input
                type={type}
                name={name}
                value={value ?? ''}
                onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
                placeholder={placeholder}
                autoComplete={autoComplete}
                disabled={disabled}
                className="ui-field"
            />
        </label>
    );
}
