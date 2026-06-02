import { removeLetters } from './removeLetters';

export const maskNumberPlaceholder = '0';

export const maskNumberChangeValue = (rawValue: string): string => {
  let sanitizedValue = removeLetters(rawValue);
  if (sanitizedValue.length >= 1) {
    if (sanitizedValue.charAt(0) === '0') {
      sanitizedValue = sanitizedValue.substring(1);
    }
  }
  if (sanitizedValue.length >= 14 && sanitizedValue !== '100') {
    sanitizedValue = sanitizedValue.substring(1);
  }
  return sanitizedValue;
};
export const maskNumberStartValue = (rawValue: string): string => {
  const sanitizedValue = removeLetters(rawValue);
  return sanitizedValue;
};

export const maskNumberGetValue = (rawValue: string): number => {
  let sanitizedValue = removeLetters(rawValue);
  while (sanitizedValue.length >= 2 && sanitizedValue.charAt(0) === '0') {
    sanitizedValue = sanitizedValue.substring(1);
  }
  return Number(sanitizedValue);
};
