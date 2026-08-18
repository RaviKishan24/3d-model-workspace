const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

export function validateRegister({ name, email, password, confirmPassword }) {
  const errors = {};

  if (!name || name.trim().length < 2) errors.name = 'Please enter your name';
  if (!email || !EMAIL_RE.test(email.trim())) errors.email = 'Enter a valid email address';
  if (!password || password.length < 8) errors.password = 'Use at least 8 characters';
  if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match';

  return errors;
}

export function validateLogin({ email, password }) {
  const errors = {};
  if (!email || !EMAIL_RE.test(email.trim())) errors.email = 'Enter a valid email address';
  if (!password) errors.password = 'Password is required';
  return errors;
}

/** Merges backend field-level details into the local form error shape. */
export function mergeServerDetails(errors, details = []) {
  const merged = { ...errors };
  details.forEach((d) => {
    const field = String(d.field || '').split('.')[0];
    if (field) merged[field] = d.message;
  });
  return merged;
}
