import { useField } from "informed";
import "./MultiOptionInput.css";

export function MultiOptionInput(props) {
  const { fieldState, fieldApi, render, userProps } = useField({
    ...props,
    id: props.id ?? props.name,
    initialValue: Array.isArray(props.initialValue) ? props.initialValue : [],
  });

  const { error, showError } = fieldState;
  const { setValue, setTouched } = fieldApi;
  const { label, id, className, options = [] } = userProps;

  const current = Array.isArray(fieldState.value) ? fieldState.value : [];
  const selected = new Set(current);

  const labelId = id ? `${id}-label` : `${props.name}-label`;
  const groupClassName = ["multi-option-input__group", className]
    .filter(Boolean)
    .join(" ");

  return render(
    <div className="multi-option-input">
      {label ? (
        <span className="multi-option-input__label" id={labelId}>
          {label}
        </span>
      ) : null}
      <div
        className={groupClassName}
        role="group"
        aria-labelledby={label ? labelId : undefined}
        aria-invalid={showError}
        aria-describedby={showError ? `${props.name}-error` : undefined}
      >
        {options.map((option) => {
          const isSelected = selected.has(option.value);
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={isSelected}
              className={`multi-option-input__option${isSelected ? " multi-option-input__option--selected" : ""}`}
              onClick={(e) => {
                const next = isSelected
                  ? current.filter((v) => v !== option.value)
                  : [...current, option.value];
                setValue(next, e);
                setTouched(true, e);
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      {showError ? (
        <p id={`${props.name}-error`} className="multi-option-input__error" role="alert">
          {error}
        </p>
      ) : null}
    </div>,
  );
}
