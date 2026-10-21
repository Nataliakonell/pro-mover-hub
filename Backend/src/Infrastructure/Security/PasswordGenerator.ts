import crypto from "crypto";

/**
 * Gera uma senha aleatória segura para novos usuários.
 * Contém letras maiúsculas, minúsculas, números e caractere especial.
 * Exemplo: 'Ab8#kL9@xP'
 */
export function generateRandomPassword(length: number = 10): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnpqrstuvwxyz";
  const digits = "23456789";
  const special = "!@#$%&*";

  const allChars = upper + lower + digits + special;
  
  // Garante ao menos 1 de cada grupo
  const initial = [
    upper[crypto.randomInt(upper.length)],
    lower[crypto.randomInt(lower.length)],
    digits[crypto.randomInt(digits.length)],
    special[crypto.randomInt(special.length)],
  ];

  for (let i = 4; i < length; i++) {
    initial.push(allChars[crypto.randomInt(allChars.length)]);
  }

  // Embaralha usando Fisher-Yates
  for (let i = initial.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [initial[i], initial[j]] = [initial[j], initial[i]];
  }

  return initial.join("");
}
