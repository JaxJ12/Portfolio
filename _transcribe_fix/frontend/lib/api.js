const base = process.env.NEXT_PUBLIC_API_BASE_URL || '';

export function apiUrl(path) {
  const normalizedBase = base.replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}
