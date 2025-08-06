exports.validator = async ({ name, phone, password }) => {
  name = name.trim();
  phone = phone.trim();
  
  if (name.length < 2 || name.length > 50) {
    throw new Error("Name must be between 2-50 characters");
  }
  if (!/^[a-zA-Z\u00C0-\u017F\s\-']+$/.test(name)) {
    throw new Error("Name contains invalid characters");
  }

  if (!/^[689]\d{7}$/.test(phone)) {
    throw new Error("Phone must be 8 digits starting with 6, 8 or 9 (Singapore format)");
  }

  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }
  if (!/[A-Z]/.test(password)) {
    throw new Error("Password needs at least 1 uppercase letter");
  }
  if (!/[a-z]/.test(password)) {
    throw new Error("Password needs at least 1 lowercase letter");
  }
  if (!/[0-9]/.test(password)) {
    throw new Error("Password needs at least 1 number");
  }
};