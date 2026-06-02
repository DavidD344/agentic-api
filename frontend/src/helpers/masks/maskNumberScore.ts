import { removeLetters } from './removeLetters';

export const maskNumberScorePlaceholder = '0';

export const maskNumberScoreChangeValue = (rawValue: string): string => {
  const sanitizedValue = removeLetters(rawValue);
  if (sanitizedValue.length >= 3) {
    return sanitizedValue[2];
  }
  if (sanitizedValue.length >= 2) {
    if (sanitizedValue !== '10') {
      return sanitizedValue[1];
    }
  }
  return sanitizedValue;
};
export const maskNumberScoreStartValue = (rawValue: string): string => {
  const sanitizedValue = removeLetters(rawValue);
  return sanitizedValue;
};

export const maskNumberScoreGetValue = (rawValue: string): number => {
  const sanitizedValue = removeLetters(rawValue);
  return Number(sanitizedValue);
};
