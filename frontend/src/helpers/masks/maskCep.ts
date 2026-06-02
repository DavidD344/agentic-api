import { removeLetters } from './removeLetters';

export const maskCepUtilMaxSize = 8;
export const maskCepPlaceholder = '00000-000';
export const maskCepTotalMaxSize = maskCepPlaceholder.length;

function formatWithLetters(rawValue: string): string {
  let newValue = rawValue;
  newValue = rawValue.replace(/\D/g, '');
  newValue = newValue.replace(/(\d{5})(\d)/, '$1-$2');
  return newValue;
}
export const maskCepChangeValue = (rawValue: string): string => {
  return formatWithLetters(rawValue);
};

export const maskCepStartValue = (rawValue: string): string => {
  return maskCepChangeValue(rawValue);
};

export const maskCepGetValue = (rawValue: string): string => {
  const sanitizedValue = removeLetters(rawValue);
  return sanitizedValue;
};
