/** Anbieterangaben für Impressum und Datenschutz (Marc Langebeck, Kiel). */
export const LEGAL_PROVIDER = {
  name: "Marc Langebeck",
  street: "Moltkestr. 41",
  postalCode: "24105",
  city: "Kiel",
  country: "Deutschland",
} as const;

export const LEGAL_PHONE_DISPLAY = "+49 (0) 176 - 6 31 29 242";
export const LEGAL_PHONE_TEL = "+4917663129242";

export const LEGAL_DATA_PROTECTION_OFFICER = "Marc Langebeck";

export const HOSTING = {
  operator: "Marc Langebeck",
  provider: "netcup GmbH (netcup.de)",
  location: "Deutschland",
} as const;

export function formatLegalAddress(): string {
  const { street, postalCode, city, country } = LEGAL_PROVIDER;
  return `${street}, ${postalCode} ${city}, ${country}`;
}
