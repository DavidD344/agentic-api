import { removeLetters } from './removeLetters';

export const maskCnpjUtilMaxSize = 14;
export const maskCnpjTotalMaxSize = 18;
export const maskCnpjPlaceholder = '00.000.000/0000-00';

function formatWithLetters(rawValue: string): string {
  let newValue = rawValue.replace(/\D/g, '');
  newValue = newValue.replace(/(\d{2})(\d)/, '$1.$2');
  newValue = newValue.replace(/(\d{3})(\d)/, '$1.$2');
  newValue = newValue.replace(/(\d{3})(\d)/, '$1/$2');
  newValue = newValue.replace(/(\d{4})(\d)/, '$1-$2');

  return newValue;
}
export const maskCnpjChangeValue = (rawValue: string): string => {
  return formatWithLetters(rawValue);
};

export const maskCnpjStartValue = (rawValue: string): string => {
  return formatWithLetters(rawValue);
};

export const maskCnpjGetValue = (rawValue: string): string => {
  const sanitizedValue = removeLetters(rawValue);
  return sanitizedValue;
};
