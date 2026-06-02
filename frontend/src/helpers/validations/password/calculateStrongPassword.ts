import {
  regexPasswordLowerCase,
  regexPasswordNumber,
  regexPasswordSpecialCharacter,
  regexPasswordUpperCase
} from "./regexPassword";

export function calculateStrongPassword(
  password: string | undefined
): 0 | 1 | 2 | 3 | 4 | undefined {
  if (password === undefined) {
    return 0;
  }
  if (password.length === 0) {
    return undefined;
  }
  let level = 0;
  // level++;
  // if (!regexPasswordLength.test(password)) {
    //  return 0;
  // }

  if (password.length > 5) {
    level++
  }
  if (regexPasswordLowerCase.test(password) || regexPasswordUpperCase.test(password)) {
    level++;
  }
  // if (regexPasswordUpperCase.test(password)) {
  //   level++;
  // }
  if (regexPasswordNumber.test(password)) {
    level++;
  }
  if (regexPasswordSpecialCharacter.test(password)) {
    level++;
  }
  // if (regexPasswordCompleteStrong.test(password)) {
  //   level++;
  // }

  const validValues: Array<0 | 1 | 2 | 3 | 4> = [0, 1, 2, 3, 4];
  if (validValues.includes(level as 0 | 1 | 2 | 3 | 4)) {
    return level as 0 | 1 | 2 | 3 | 4;
  } else {
    return undefined;
  }
}
