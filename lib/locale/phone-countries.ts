export interface PhoneCountry {
  code: string;
  name: string;
  dial: string;
}

/**
 * Add one block per active country. When enabling a country, also add its
 * corresponding SVG treatment in PhoneFlag.
 * Example: { code: "mx", name: "México", dial: "+52" }
 */
export const PHONE_COUNTRIES: PhoneCountry[] = [
  { code: "cl", name: "Chile", dial: "+56" },
];

export const DEFAULT_PHONE_COUNTRY = PHONE_COUNTRIES[0];
