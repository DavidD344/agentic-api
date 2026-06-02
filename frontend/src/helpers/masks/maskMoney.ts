export const maskMoneyPlaceholder = 'R$ 0,00';

export const maskMoneyChangeValue = (
  number: string,
  isPrexix?: boolean,
): string => {
  if (number.length < 1) {
    return '0';
  }
  const value = number.replace('.', '').replace(',', '').replace(/\D/g, '');

  const numberFormat = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    ...(isPrexix && { style: 'currency' }),
    currency: 'BRL',
  });

  return numberFormat.format(parseFloat(value) / 100);
};

export const maskMoneyStartValue = (number: string): string => {
  return maskMoneyChangeValue(number);
};
export const maskMoneyStartValuePrefix = (number: string): string => {
  return maskMoneyChangeValue(number, true);
};
export const maskMoneyGetValue = (value: string): number => {
  return Number(value.replace(/\D/g, ''));
};
