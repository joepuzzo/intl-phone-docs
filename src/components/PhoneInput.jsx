import { useMemo, useRef, useCallback, useLayoutEffect } from "react";
import { useField, useFormApi, utils } from "informed";
import {
  phoneFormatter,
  getSupportedCountries,
  getExample,
  getPatterns,
  getFormats,
  getCountryCode,
  getCountryFromNumber,
} from "intl-phone";
import { PHONE_ENABLED_COUNTRIES } from "../phoneCountries.js";
import "./PhoneInput.css";

const intlSupported = getSupportedCountries();

// Second param reserved for parity with Tesla (future options).
function fixValue(value, _options = {}, fullValue) {
  void _options;
  let v = `${value}`;

  if (v.includes("+")) {
    const country = getCountryFromNumber(v.replace(/\s/g, ""));

    let code = null;
    if (country) {
      code = getCountryCode(country);
      v = v.replace(`+${code}`, "");
    }

    if (country && code) {
      return {
        country,
        code: code != null ? Number(code) : undefined,
        number: v,
      };
    }
  }

  if (
    (fullValue?.country === "US" || fullValue?.country === "CA") &&
    v.startsWith("1")
  ) {
    return {
      ...fullValue,
      number: v.slice(1),
    };
  }

  return {
    number: v,
  };
}

function parsePhone(value, country, options = {}, props) {
  const formatData = getFormats(country);

  let v =
    value != null && value !== ""
      ? String(value).replace(/\D/g, "")
      : undefined;

  const nationalFormat =
    (props.formatNational && props.formatNational.includes(country)) ||
    options.format === "national";

  if (
    nationalFormat &&
    v &&
    formatData.nddPrefix &&
    v.slice(0, formatData.nddPrefix.length) === formatData.nddPrefix
  ) {
    v = v.slice(formatData.nddPrefix.length, v.length);
  }

  return v;
}

export function PhoneInput(props) {
  const formApi = useFormApi();
  const numberRef = useRef(null);
  const getValueRef = useRef(() => ({}));

  const {
    name,
    label,
    id,
    className,
    defaultCountry = "US",
    defaultValue: defaultValueProp,
    initialValue: initialValueProp,
    options,
    formatNational,
    defaultPlaceholder = "mobile",
    enabledCountries: userEnabledCountries,
    showPatternInErrorMessage,
    generateValidationMessage,
    errorMessage,
    validate: userValidate,
    required,
    disabled,
    readOnly,
  } = props;

  const enabledCountriesList = userEnabledCountries ?? PHONE_ENABLED_COUNTRIES;

  useMemo(() => {
    const supported = new Set(intlSupported);
    enabledCountriesList.forEach((c) => {
      if (!supported.has(c)) {
        throw new Error(
          `Country with code ${c} is not currently supported by this phone input :(`,
        );
      }
    });
  }, [enabledCountriesList]);

  const validate = useCallback(
    (value, values) => {
      if (value) {
        if (!getPatterns(value.country)) {
          if (generateValidationMessage) {
            return generateValidationMessage({ ...value });
          }
          return "Unknown country.";
        }

        const pattern = `^(${getPatterns(value.country).national})$`;

        if (value.number != null && !new RegExp(pattern).test(value.number)) {
          if (showPatternInErrorMessage) {
            return `Number must match ${pattern}`;
          }
          if (generateValidationMessage) {
            return generateValidationMessage({ ...value });
          }
          if (errorMessage) {
            return errorMessage;
          }
          return "Please enter a valid phone number.";
        }
      }

      if (required) {
        if (value?.number == null) {
          return typeof required === "string"
            ? required
            : "Please enter a phone number";
        }
      }

      if (userValidate) {
        return userValidate(value, values);
      }
      return undefined;
    },
    [
      required,
      userValidate,
      showPatternInErrorMessage,
      generateValidationMessage,
      errorMessage,
    ],
  );

  const initVal = useMemo(() => {
    const iv = initialValueProp ?? formApi.getInitialValue(name);
    if (iv) {
      const dial = getCountryCode(iv.country);
      const v = {
        ...iv,
        code:
          iv.code ?? (dial != null && dial !== "" ? Number(dial) : undefined),
      };

      if (v.number != null) {
        return {
          ...v,
          ...fixValue(v.number, options ?? {}, v),
        };
      }

      return v;
    }
    return undefined;
  }, [initialValueProp, name, options, formApi]);

  const defaultVal = useMemo(() => {
    const base =
      defaultValueProp ??
      (() => {
        const dial = getCountryCode(defaultCountry);
        return {
          country: defaultCountry,
          code: dial != null && dial !== "" ? Number(dial) : undefined,
        };
      })();

    if (base && base.code == null && base.country) {
      const dial = getCountryCode(base.country);
      return {
        ...base,
        code: dial != null && dial !== "" ? Number(dial) : undefined,
      };
    }
    return base;
  }, [defaultValueProp, defaultCountry]);

  const { fieldState, fieldApi, render, ref, userProps } = useField({
    ...props,
    name,
    id: id ?? name,
    label,
    initialValue: initVal,
    defaultValue: defaultVal,
    validate,
    inputRef: numberRef,
    inputRefs: {
      number: numberRef,
    },
    formatter: {
      number: (n, full) => {
        const country = full ? full?.country : getValueRef.current()?.country;

        const opts = { ...(options ?? {}) };

        const nationalFormat =
          formatNational && formatNational.includes(country);
        if (nationalFormat) {
          opts.format = "national";
        }

        return phoneFormatter(
          parsePhone(n, country, options ?? {}, props),
          country,
          opts,
        );
      },
    },
    parser: {
      number: (n) =>
        parsePhone(
          n,
          getValueRef.current()?.country ?? defaultCountry,
          options ?? {},
          props,
        ),
    },
    formatterDependencies: [options?.format],
    maintainCursor: true,
    disabled,
  });

  useLayoutEffect(() => {
    getValueRef.current = fieldApi.getValue;
  }, [fieldApi]);

  const {
    label: labelFromProps,
    feedback: _fb,
    helper: _hp,
    caption: _cp,
    tooltip: _tp,
    placeholder: userPlaceholder,
    defaultPlaceholder: dpFromUser = "mobile",
    enabledCountries: _ec,
    showPatternInErrorMessage: _s1,
    generateValidationMessage: _g1,
    errorMessage: _e1,
    validate: _v1,
    className: _c1,
    ...inputProps
  } = userProps;

  const { showError, error, value, maskedValue } = fieldState;
  const { setValue, setTouched, getValue } = fieldApi;

  const v = value || {};

  const phoneExample = v.country
    ? getExample(v.country, defaultPlaceholder ?? dpFromUser)
    : "";
  const exampleNumber = phoneExample;

  let placeholder = userPlaceholder;

  if (!placeholder && exampleNumber !== "") {
    placeholder = utils.informedFormat(
      exampleNumber,
      phoneFormatter(exampleNumber, v.country),
    ).value;
  } else if (!placeholder) {
    placeholder = "";
  }

  const onCountryChange = (iso, event) => {
    const newVal = { ...getValue() };
    const formatData = getFormats(iso);
    const dial = getCountryCode(iso);
    newVal.country = iso;
    newVal.code = dial != null && dial !== "" ? Number(dial) : undefined;

    const nationalFormat =
      options?.format === "national" ||
      (formatNational && formatNational.includes(iso));

    if (nationalFormat) {
      newVal.nddPrefix = formatData.nddPrefix || "";
    }
    setValue(newVal, event);
    if (typeof props.onNativeChange === "function") {
      props.onNativeChange({
        value: newVal.number ?? "",
        country: newVal.country,
        fullValue: newVal,
        event,
      });
    }
  };

  const numberChange = (e) => {
    const newVal = {
      ...getValue(),
      ...fixValue(e.target.value, options ?? {}, getValue()),
    };
    setValue(newVal, e, "number");
    if (typeof props.onNativeChange === "function") {
      props.onNativeChange({
        value: newVal.number ?? "",
        country: newVal.country,
        fullValue: newVal,
        event: e,
      });
    }
  };

  const countryOptions = useMemo(() => {
    return [...enabledCountriesList].sort((a, b) => {
      const ca = getCountryCode(a) ?? "";
      const cb = getCountryCode(b) ?? "";
      const na = Number.parseInt(ca, 10);
      const nb = Number.parseInt(cb, 10);
      if (na !== nb && !Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
      return a.localeCompare(b);
    });
  }, [enabledCountriesList]);

  const currentCountry =
    v.country && enabledCountriesList.includes(v.country)
      ? v.country
      : defaultCountry;

  const groupClass = ["phone-input", className].filter(Boolean).join(" ");

  const inputId = id ?? name;
  const labelText = label ?? labelFromProps;

  return render(
    <div className={groupClass}>
      {labelText ? (
        <label className="phone-input__label" htmlFor={inputId}>
          {labelText}
        </label>
      ) : null}
      <div
        className={`phone-input__control${showError ? " phone-input__control--error" : ""}`}
      >
        <select
          className="phone-input__leading"
          aria-label="Country calling code"
          value={currentCountry}
          disabled={disabled}
          onChange={(e) => onCountryChange(e.target.value, e)}
          onBlur={(e) => setTouched(true, e)}
        >
          {countryOptions.map((iso) => {
            const code = getCountryCode(iso);
            if (code == null) return null;
            return (
              <option key={iso} value={iso}>
                +{code} {iso}
              </option>
            );
          })}
        </select>
        <input
          {...inputProps}
          ref={ref}
          id={inputId}
          className="phone-input__field"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          value={maskedValue?.number || ""}
          onChange={numberChange}
          onBlur={() => {
            setTouched(true);
          }}
          onFocus={(e) => fieldApi.setFocused(true, e)}
          aria-invalid={showError}
          aria-required={Boolean(required)}
          aria-describedby={showError ? `${name}-error` : undefined}
        />
      </div>
      {showError ? (
        <p id={`${name}-error`} className="phone-input__error" role="alert">
          {error}
        </p>
      ) : null}
    </div>,
  );
}
