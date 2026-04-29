import { useField } from "informed";
import "./ToggleButtonInput.css";

export function ToggleButtonInput(props) {
  const { fieldState, fieldApi, render, userProps } = useField({
    ...props,
    id: props.id ?? props.name,
    initialValue:
      typeof props.initialValue === "boolean" ? props.initialValue : false,
  });

  const { value, error, showError } = fieldState;
  const { setValue, setTouched, setFocused } = fieldApi;
  const { id, label, className } = userProps;

  const inputId = id ?? props.name;
  const pressed = value === true;
  const rootClass = ["toggle-button-input", className].filter(Boolean).join(" ");

  return render(
    <div className={rootClass}>
      {label ? (
        <label className="toggle-button-input__label" htmlFor={inputId}>
          {label}
        </label>
      ) : null}
      <button
        id={inputId}
        type="button"
        className={`toggle-button-input__button${pressed ? " toggle-button-input__button--active" : ""}`}
        onClick={(e) => {
          setValue(!pressed, e);
        }}
        onBlur={(e) => {
          setTouched(true, e);
          setFocused(false, e);
        }}
        onFocus={(e) => {
          setFocused(true, e);
        }}
        aria-pressed={pressed}
        aria-label={label ?? "Transparent"}
        aria-invalid={showError}
        aria-describedby={showError ? `${props.name}-error` : undefined}
      />
      {showError && error ? (
        <p id={`${props.name}-error`} className="toggle-button-input__error" role="alert">
          {error}
        </p>
      ) : null}
    </div>,
  );
}
