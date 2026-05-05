import { useCallback } from "react";
import {
  Form,
  Input,
  Select,
  useConditional,
  useFieldApi,
  useFormState,
} from "informed";
import { formatPhone, getCountryCode, validatePhone } from "intl-phone";
import { PhoneInput } from "./components/PhoneInput.jsx";
import { ToggleButtonInput } from "./components/ToggleButtonInput.jsx";
import { PHONE_ENABLED_COUNTRIES } from "./phoneCountries.js";
import "./App.css";
import "./components/payload-fields.css";

const formatOptions = [
  { value: "", label: "default" },
  { value: "international", label: "international" },
  { value: "national", label: "national" },
];

const outOfOptions = [
  { value: "", label: "none" },
  ...PHONE_ENABLED_COUNTRIES.map((iso) => ({ value: iso, label: iso })),
];

function getPhonePreviewState(values) {
  const country = values.phone?.country || undefined;
  const number = values.number ?? "";
  const fmt = values.format || undefined;
  const outOf = values.outOf || undefined;
  const isNationalFormat = fmt === "national";
  const plusSymbol = values.plusSymbol !== false;

  const functionOptions = {};
  if (fmt) functionOptions.format = fmt;
  if (outOf) functionOptions.outOf = outOf;
  if (!plusSymbol) functionOptions.plusSymbol = false;

  const phoneInputOptions = {};
  if (isNationalFormat) phoneInputOptions.format = "national";
  if (outOf) phoneInputOptions.outOf = outOf;
  if (!plusSymbol) phoneInputOptions.plusSymbol = false;

  return {
    country,
    number,
    fmt,
    outOf,
    plusSymbol,
    isNationalFormat,
    functionOptions,
    phoneInputOptions,
  };
}

function FormattedInputField() {
  const { values } = useFormState();
  const { country, isNationalFormat, outOf, plusSymbol, phoneInputOptions } =
    getPhonePreviewState(values);
  const hasPhoneInputOptions =
    isNationalFormat || Boolean(outOf) || plusSymbol === false;

  const snippetLines = [
    `<PhoneInput`,
    `  name="phone"`,
    `  label="Formatted Input"`,
    `  defaultCountry="${country || "FR"}"`,
  ];

  if (hasPhoneInputOptions) {
    snippetLines.push(`  options={{`);
    if (phoneInputOptions.format) {
      snippetLines.push(`    format: "${phoneInputOptions.format}",`);
    }
    if (phoneInputOptions.outOf) {
      snippetLines.push(`    outOf: "${phoneInputOptions.outOf}",`);
    }
    if (phoneInputOptions.plusSymbol === false) {
      snippetLines.push(`    plusSymbol: false,`);
    }
    snippetLines.push(`  }}`);
  }

  snippetLines.push(`  validateOn="change"`);
  snippetLines.push(`/>`);

  const phoneInputSnippet = snippetLines.join("\n");

  return (
    <div className="formatted-input-with-code">
      <PhoneInput
        name="phone"
        label="Formatted Input"
        defaultCountry={country || "FR"}
        options={hasPhoneInputOptions ? phoneInputOptions : undefined}
        validateOn="change"
      />
      <pre className="formatted-input-code">{phoneInputSnippet}</pre>
    </div>
  );
}

function UnformattedInputField() {
  const { setValue: setPhoneValue, getValue: getPhoneValue } =
    useFieldApi("phone");
  const { setValue: setNumberValue } = useFieldApi("number");

  const syncNumberFromPhone = useCallback(
    ({ formApi }) => {
      const phone = formApi.getValue("phone") ?? {};
      const phoneNumber = phone.number ?? "";
      const currentNumber = formApi.getValue("number") ?? "";

      if (currentNumber !== phoneNumber) {
        setNumberValue(phoneNumber);
      }
    },
    [setNumberValue],
  );

  useConditional({
    name: "number",
    evaluate: syncNumberFromPhone,
    evaluateWhen: ["phone"],
    native: true,
    evaluateOnMount: false,
  });

  return (
    <div className="number-input-with-help">
      <Input
        name="number"
        label="Number"
        onNativeChange={({ value }) => {
          const nextNumber = value == null ? "" : String(value);
          const currentPhone = getPhoneValue() ?? {};
          if ((currentPhone.number ?? "") !== nextNumber) {
            setPhoneValue({ ...currentPhone, number: nextNumber });
          }
        }}
      />
      <p className="field-helper">
        Enter only the number value, not the country code.
      </p>
    </div>
  );
}

function CountrySelectorField() {
  const { setValue: setPhoneValue, getValue: getPhoneValue } =
    useFieldApi("phone");
  const { setValue: setCountryValue } = useFieldApi("country");

  const syncCountryFromPhone = useCallback(
    ({ formApi }) => {
      const phone = formApi.getValue("phone") ?? {};
      const phoneCountry = phone.country ?? "";
      const currentCountry = formApi.getValue("country") ?? "";

      if (currentCountry !== phoneCountry) {
        setCountryValue(phoneCountry);
      }
    },
    [setCountryValue],
  );

  useConditional({
    name: "country",
    evaluate: syncCountryFromPhone,
    evaluateWhen: ["phone"],
    native: true,
    evaluateOnMount: false,
  });

  return (
    <Select
      name="country"
      label="Country"
      options={PHONE_ENABLED_COUNTRIES.map((iso) => ({
        value: iso,
        label: iso,
      }))}
      onNativeChange={({ value }) => {
        const nextCountry = value == null ? "" : String(value);
        const currentPhone = getPhoneValue() ?? {};
        const currentCountry = currentPhone.country ?? "";

        if (nextCountry && currentCountry !== nextCountry) {
          const dial = getCountryCode(nextCountry);
          setPhoneValue({
            ...currentPhone,
            country: nextCountry,
            code: dial != null && dial !== "" ? Number(dial) : undefined,
          });
        }
      }}
    />
  );
}

function PreviewPanel() {
  const { values } = useFormState();
  const { country, number, functionOptions } = getPhonePreviewState(values);
  const phoneValue = values.phone ?? {};

  let formatted = "";
  let validated = false;
  let runError = "";

  try {
    formatted =
      number === ""
        ? ""
        : formatPhone(
            number,
            country,
            Object.keys(functionOptions).length ? functionOptions : undefined,
          );
    validated = number === "" ? false : validatePhone(number, country);
  } catch (err) {
    runError = err instanceof Error ? err.message : "Unknown error";
  }

  return (
    <div className="preview">
      <h2 className="preview__title">Output</h2>
      <div className="preview__results">
        <h3>formatPhone()</h3>
        <pre>{runError ? `Error: ${runError}` : formatted || "(empty)"}</pre>
      </div>

      <div className="preview__results">
        <h3>validatePhone()</h3>
        <pre>{String(validated)}</pre>
      </div>

      <div className="preview__results">
        <h3>Current options</h3>
        <pre>{JSON.stringify(functionOptions, null, 2)}</pre>
      </div>

      <div className="preview__results">
        <h3>Current phone value</h3>
        <pre>{JSON.stringify(phoneValue, null, 2)}</pre>
      </div>
    </div>
  );
}

function LibraryOverviewPanel() {
  return (
    <section
      className="panel library-panel"
      aria-label="intl-phone documentation overview"
    >
      <h2 className="panel__title">intl-phone</h2>
      <p>A library that formats and validates phone numbers.</p>

      <h3>formatPhone Example usage</h3>
      <p>See ./src/formatPhone.test.js for more examples.</p>
      <pre className="library-panel__code">{`import { formatPhone } 'intl-phone';`}</pre>

      <p>Basic formatting</p>
      <pre className="library-panel__code">{`formatPhone('2015550123', 'US')
// ==> "(201) 555-0123"

formatPhone('612345678', 'FR')
// ==> "6 12 34 56 78"`}</pre>

      <p>International formatting</p>
      <pre className="library-panel__code">{`formatPhone('612345678', 'FR', {
  format: 'international'
})
// ==> "+33 6 12 34 56 78"

formatPhone('612345678', 'FR', {
  format: 'international',
  plusSymbol: false
})
// ==> "33 6 12 34 56 78"`}</pre>

      <p>National formatting</p>
      <pre className="library-panel__code">{`formatPhone('612345678', 'FR', {
  format: 'national'
})
// ==> "06 12 34 56 78"`}</pre>

      <p>Out-of-country dialing prefixes</p>
      <pre className="library-panel__code">{`formatPhone('612345678', 'FR', {
  outOf: 'US'
})
// ==> "011 33 6 12 34 56 78"

formatPhone('612345678', 'FR', {
  outOf: 'CH'
})
// ==> "00 33 6 12 34 56 78"`}</pre>

      <h3>validatePhone Example usage</h3>
      <p>See ./src/validatePhone.test.js for more examples.</p>
      <pre className="library-panel__code">{`import { validatePhone } 'intl-phone';

validatePhone('1015550123', 'US')
// ==> false`}</pre>

      <h2 className="panel__title panel__title--section">Future Work</h2>
      <p>
        Eventually we should add options that allow user to chose format="E164".
      </p>

      <h2 className="panel__title panel__title--section">Background</h2>
      <h3>Problem Statement</h3>
      <ul>
        <li>input formatting ( making it look correct )</li>
        <li>input validation ( checking that the number is valid )</li>
      </ul>

      <h2 className="panel__title panel__title--section">Standards</h2>
      <p>
        <a
          href="https://en.wikipedia.org/wiki/E.164"
          target="_blank"
          rel="noreferrer"
        >
          E.164
        </a>
      </p>

      <h2 className="panel__title panel__title--section">Terminology</h2>
      <h3>Trunk Prefix</h3>
      <p>
        A trunk prefix is a digit sequence to be dialed before a telephone
        number to initiate a call for selecting an appropriate
        telecommunications circuit.
      </p>
      <p>IDD is a trunk prefix.</p>
      <p>NDD is a trunk prefix.</p>

      <h3>IDD ( International Direct Dialing )</h3>
      <p>Layman's Terms: How do I get out of my country !</p>
      <p>
        Also known as: <code>Exit Prefix</code>,{" "}
        <code>International Dialing Code</code>, and{" "}
        <code>International Call Prefix</code>
      </p>
      <pre className="library-panel__code">{`011 61 7 3333 3333
^^^`}</pre>
      <p>So the USA's IDD is 011.</p>
      <p>
        Note: this can be replaced by <code>+</code> symbol when formatting a
        phone number to match E.164
      </p>
      <pre className="library-panel__code">{`011 61 7 3333 3333 ------> + 61 7 3333 3333`}</pre>

      <h3>Country Code</h3>
      <p>Layman's Terms: How do I get into a country !</p>
      <pre className="library-panel__code">{`011 61 7 3333 3333
    ^^`}</pre>

      <h3>NDD ( National Direct Dialing )</h3>
      <p>Layman's Terms: Extra numbers when dialing within a country</p>
      <p>
        In some countries, local dialing may require a <code>0</code> prefix.
        With E.164 formatting, this <code>0</code> is usually removed.
      </p>
      <pre className="library-panel__code">{`Dial Within Australia: 07 3333 3333
                        ^

Dial Into Australia ( from US ): 011 61 7 3333 3333

                                 ^^^NO 0 in front of 7^^^

E.164 Format: + 61 7 3333 3333`}</pre>

      <h2 className="panel__title panel__title--section">Different formats</h2>
      <p>Why are phone numbers so hard to format?</p>
      <p>
        The following examples are how people type phone numbers in England.
      </p>

      <h3>International</h3>
      <table className="library-panel__table">
        <thead>
          <tr>
            <th>Number</th>
            <th>Formatted</th>
            <th>Type</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1212345678</td>
            <td>+44 121 234 5678</td>
            <td>Birmingham landline</td>
          </tr>
          <tr>
            <td>2012345678</td>
            <td>+44 20 1234 5678</td>
            <td>London landline</td>
          </tr>
          <tr>
            <td>1525123456</td>
            <td>+44 1525 123456</td>
            <td>Leighton Buzzard landline</td>
          </tr>
          <tr>
            <td>1525123456</td>
            <td>+44 1525 123 456</td>
            <td>Leighton Buzzard formatted differently</td>
          </tr>
          <tr>
            <td>7400123456</td>
            <td>+44 7400 123456</td>
            <td>Mobile</td>
          </tr>
          <tr>
            <td>7400123456</td>
            <td>+44 7400 123 456</td>
            <td>Mobile formatted differently</td>
          </tr>
        </tbody>
      </table>

      <h3>Domestic</h3>
      <table className="library-panel__table">
        <thead>
          <tr>
            <th>Number</th>
            <th>Formatted</th>
            <th>Type</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1212345678</td>
            <td>0121 234 5678</td>
            <td>Birmingham landline</td>
          </tr>
          <tr>
            <td>2012345678</td>
            <td>020 1234 5678</td>
            <td>London landline</td>
          </tr>
          <tr>
            <td>1525123456</td>
            <td>01525 123456</td>
            <td>Leighton Buzzard landline</td>
          </tr>
          <tr>
            <td>1525123456</td>
            <td>01525 123 456</td>
            <td>Leighton Buzzard formatted differently</td>
          </tr>
          <tr>
            <td>7400123456</td>
            <td>07400 123456</td>
            <td>Mobile</td>
          </tr>
          <tr>
            <td>7400123456</td>
            <td>07400 123 456</td>
            <td>Mobile formatted differently</td>
          </tr>
        </tbody>
      </table>
      <p>
        Note: This library currently only supports the{" "}
        <code>international</code> ( E.164 ) formats.
      </p>

      <h2 className="panel__title panel__title--section">Storage</h2>
      <p>Given `011 61 07 3333 3333` you can get:</p>
      <pre className="library-panel__code">{`{
  "iddPrefix": "011",
  "countryCode": "61",
  "nddPrefix": "0",
  "areaCode": "7",
  "number": "33333333"
}`}</pre>
      <p>However whats required to be stored is:</p>
      <pre className="library-panel__code">{`{
  "country": "AU",
  "areaCode": "7",
  "number": "33333333"
}`}</pre>
      <p>The rest can be derived from the above. Also acceptable storage:</p>
      <pre className="library-panel__code">{`{
  "country": "AU",
  "countryCode": "61",
  "number": "733333333"
}`}</pre>
      <pre className="library-panel__code">{`{
  "country": "AU",
  "number": "733333333"
}`}</pre>
    </section>
  );
}

export default function App() {
  return (
    <Form
      initialValues={{
        format: "international",
        outOf: "",
        plusSymbol: true,
        country: "FR",
        number: "612345678",
        phone: {
          country: "FR",
          number: "612345678",
        },
      }}
      keepStateIfRelevant
    >
      <div className="page">
        <header className="header">
          <h1>Intl-Phone</h1>
          <p className="lede">
            Read docs, configure formatting options, and inspect live function
            output.
          </p>
          <div className="header-links" aria-label="Project links">
            <a
              className="header-link"
              href="https://github.com/joepuzzo/intl-phone"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
            <a
              className="header-link"
              href="https://www.npmjs.com/package/intl-phone"
              target="_blank"
              rel="noreferrer"
            >
              npm
            </a>
          </div>
        </header>

        <div className="layout">
          <LibraryOverviewPanel />
          <section
            className="panel payload-fields"
            aria-label="Phone input configuration panel"
          >
            <h2 className="panel__title">Configuration</h2>
            <div className="config-grid">
              <CountrySelectorField />
              <UnformattedInputField />
              <Select
                name="format"
                label="Format option"
                options={formatOptions}
              />
              <Select
                name="outOf"
                label="Out of country"
                options={outOfOptions}
              />
            </div>
            <ToggleButtonInput
              name="plusSymbol"
              label="plusSymbol"
              initialValue={true}
            />
            <FormattedInputField />
          </section>
          <section
            className="panel panel--preview"
            aria-label="Phone formatting output panel"
          >
            <PreviewPanel />
          </section>
        </div>
      </div>
    </Form>
  );
}
