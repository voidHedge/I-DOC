export function passwordValidator(password) {
  if (!password) return "Поле не может быть пустым";
  if (password.length < 6)
    return "Пароль слишком короткий, минимум: 6 символов";
  if (password.length > 40)
    return "Пароль слишком длинный, максимум: 40 символов";
  if (/[^A-Za-z0-9]/.test(password))
    return "Поддерживаются только цифры и латинские символы";
  return "";
}
