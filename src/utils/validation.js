export function validateMobile(mobile) {
  return /^[0-9]{10,15}$/.test(mobile);
}

export function validateOTP(otp) {
  return /^[0-9]{4,6}$/.test(otp);
}

export function validateAdTitle(title) {
  return title.trim().length >= 3;
}
