export function hasMarketingConsent(customer: {
  consentGivenAt: Date | null;
}): boolean {
  return customer.consentGivenAt !== null;
}
