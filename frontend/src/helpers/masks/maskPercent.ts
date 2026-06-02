import { removeLetters } from './removeLetters';

export const maskPercentPlaceholder = '0';

export const maskPercentChangeValue = (rawValue: string): string => {
  let sanitizedValue = removeLetters(rawValue);
  if (sanitizedValue.length >= 1) {
    if (sanitizedValue.charAt(0) === '0') {
      sanitizedValue = sanitizedValue.substring(1);
    }
  }
  if (sanitizedValue.length >= 3 && sanitizedValue !== '100') {
    sanitizedValue = sanitizedValue.substring(1);
  }
  return sanitizedValue;
};
export const maskPercentStartValue = (rawValue: string): string => {
  const sanitizedValue = removeLetters(rawValue);
  return sanitizedValue;
};

export const maskPercentGetValue = (rawValue: string): number => {
  let sanitizedValue = removeLetters(rawValue);
  while (sanitizedValue.length >= 2 && sanitizedValue.charAt(0) === '0') {
    sanitizedValue = sanitizedValue.substring(1);
  }
  return Number(sanitizedValue);
};
