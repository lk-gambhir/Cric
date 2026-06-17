
export function sanitizeName(name, maxLength = 15) {
  if (!name || typeof name !== 'string') return 'Player';
  
  // Strip anything that looks like an HTML tag
  const stripped = name.replace(/<[^>]*>?/gm, '');
  
  // Trim and slice to max length
  return stripped.trim().substring(0, Math.min(stripped.trim().length, maxLength)) || 'Player';
}

export function validateRoomCode(code) {
  if (!code || typeof code !== 'string') return false;
  return /^[A-Z0-9]{6}$/.test(code);
}

export function validateRun(run) {
  if (typeof run !== 'number') return false;
  return Number.isInteger(run) && run >= 1 && run <= 6;
}
