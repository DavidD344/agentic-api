export const regexPasswordComplete =
  /^(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{6,30}$/;
export const regexPasswordCompleteStrong =
  /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{12,30}$/;
export const regexPasswordUpperCase = /(?=.*?[A-Z])/;
export const regexPasswordLowerCase = /(?=.*?[a-z])/;
export const regexPasswordNumber = /(?=.*?[0-9])/;
export const regexPasswordSpecialCharacter = /(?=.*?[#?!@$%^*-])/;
export const regexPasswordLength = /.{6,30}/;
