/**
 * Currency formatting utilities
 * 
 * Provides consistent currency formatting across the application
 */

type Currency = 'USD' | 'EUR' | 'EGP';

const CURRENCY_FORMATS: Record<Currency, Intl.NumberFormat> = {
  USD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
  EUR: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }),
  EGP: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EGP' }),
};

export function formatCurrency(amount: number, currency: Currency): string {
  const formatter = CURRENCY_FORMATS[currency] || CURRENCY_FORMATS.USD;
  return formatter.format(amount);
}

export function formatCurrencyCompact(amount: number, currency: Currency): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    notation: 'compact',
    compactDisplay: 'short',
  });
  return formatter.format(amount);
}
