export const maskCreditsPlaceholder = 'R$ 0,00';

export const maskCreditsChangeValue = (number: string): string => {
  if (number.length <= 1) {
    return '0' + number;
  }
  return number;
};

export const maskCreditsStartValue = (number: string): string => {
  return maskCreditsChangeValue(number);
};
