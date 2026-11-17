export function asText(value, max = 2000) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export function asNullableText(value, max = 2000) {
  const text = asText(value, max);
  return text || null;
}

export function asInt(value, fallback = 0) {
  const number = Number(value);
  return Number.isInteger(number) ? number : fallback;
}

export function asBool(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value === 'true' || value === '1' || value === 'on';
  return Boolean(value);
}

export function asArray(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === 'string') {
    return value
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

export function asJson(value, fallback = []) {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (error) {
      return fallback;
    }
  }
  return value ?? fallback;
}

export function slugify(value, fallback = 'item') {
  const slug = asText(value, 120)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || fallback;
}

export function insertSql(table, data) {
  const columns = Object.keys(data);
  const values = columns.map((column) => data[column]);
  const placeholders = columns.map((_, index) => `$${index + 1}`);
  return {
    text: `insert into public.${table} (${columns.join(', ')}) values (${placeholders.join(', ')}) returning *`,
    values,
  };
}

export function updateSql(table, idColumn, id, data) {
  const columns = Object.keys(data);
  if (!columns.length) return null;
  const values = columns.map((column) => data[column]);
  const assignments = columns.map((column, index) => `${column} = $${index + 1}`);
  values.push(id);
  return {
    text: `update public.${table} set ${assignments.join(', ')} where ${idColumn} = $${values.length} returning *`,
    values,
  };
}