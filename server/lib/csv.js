function cell(value) {
  if (value === null || value === undefined) return '';
  const text = String(value);
  if (/[",\n\r;]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function toCsv(headers, rows) {
  const head = headers.map((header) => cell(header.label ?? header)).join(',');
  const body = rows
    .map((row) =>
      headers
        .map((header) => cell(typeof header.value === 'function' ? header.value(row) : row[header.key]))
        .join(',')
    )
    .join('\r\n');
  return `\uFEFF${head}\r\n${body}`;
}

export function sendCsv(res, filename, csv) {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csv);
}