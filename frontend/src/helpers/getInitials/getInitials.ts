export function getInitials({ stringNames }: { stringNames: string }): string {
  if (stringNames.trim() === '') {
    return ' ';
  }

  const sanitizedNames = stringNames.replace(/-/g, '').replace(/ {2,}/g, ' ');

  const names: string[] = sanitizedNames.split(' ').filter(Boolean);
  let initials: string = '';
  const numInitials = Math.min(2, names.length);

  for (let i = 0; i < numInitials; i++) {
    if (names[i]) {
      initials += names[i][0];
    }
  }

  return initials.toUpperCase();
}
