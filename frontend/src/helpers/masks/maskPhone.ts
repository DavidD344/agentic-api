import { removeLetters } from './removeLetters';

export const maskPhoneUtilMaxSize = 12;
export const maskPhonePlaceholder = '(00) 00000-0000';
export const maskPhoneFixPlaceholder = '(00) 0000-0000';

export const maskPhoneTotalMaxSize = maskPhonePlaceholder.length;
export const maskPhoneTotalMinSize = maskPhoneFixPlaceholder.length;

function formatWithLetters(rawValue: string): string {
  let newValue = rawValue;
  newValue = rawValue.replace(/\D/g, '');
  newValue = newValue.replace(/(\d{0})(\d)/, '$1($2');
  newValue = newValue.replace(/(\d{2})(\d)/, '$1) $2');

  if (newValue.length === 13) {
    newValue = newValue.replace(/(\d{4})(\d)/, '$1-$2');
  } else {
    newValue = newValue.replace(/(\d{5})(\d)/, '$1-$2');
  }

  return newValue;
}
export const maskPhoneChangeValue = (rawValue: string): string => {
  return formatWithLetters(rawValue);
};

export const maskPhoneStartValue = (rawValue: string): string => {
  return formatWithLetters(rawValue.slice(3));
};

export const maskPhoneStartValueWithoutPrefix = (rawValue: string): string => {
  let sanitizedValue = removeLetters(rawValue.slice(3));
  while (sanitizedValue.length < 3) {
    sanitizedValue = '0' + sanitizedValue;
  }
  sanitizedValue = formatWithLetters(sanitizedValue);
  return sanitizedValue;
};
export const maskPhoneStartValueWithoutPrefixNoHasMoreSymbol = (
  rawValue: string,
): string => {
  let sanitizedValue = removeLetters(rawValue.slice(2));
  while (sanitizedValue.length < 3) {
    sanitizedValue = '0' + sanitizedValue;
  }
  sanitizedValue = formatWithLetters(sanitizedValue);
  return sanitizedValue;
};
export const maskPhoneStartValueAssaasFormat = (rawValue: string): string => {
  return formatWithLetters(rawValue);
};
export const maskPhoneGetValue = (rawValue: string): string => {
  const sanitizedValue = removeLetters(rawValue);
  return sanitizedValue;
};
