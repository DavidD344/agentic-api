export const masCpfPlaceholder = '000.000.000-00';
export const cpfMaskMaxSize = masCpfPlaceholder.length;
export const cpfMaxSize = 11;

export const maskCpf = (value: string): string => {
  let newValue = value;
  newValue = value.replace(/\D/g, '');
  newValue = newValue.replace(/(\d{3})(\d)/, '$1.$2');
  newValue = newValue.replace(/(\d{3})(\d)/, '$1.$2');
  newValue = newValue.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  return newValue;
};

export const removeCpfMask = (value: string): string => {
  return value.replace(/\D/g, '');
};
