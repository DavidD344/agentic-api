export function removeLetters(rawValue: string): string {
  return rawValue.replace(/[^0-9]/g, '');
}
