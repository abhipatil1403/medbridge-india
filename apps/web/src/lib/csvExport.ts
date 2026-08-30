export function downloadCsv(filename: string, data: any[]) {
  if (data.length === 0) return;

  // Extract headers
  const headers = Array.from(new Set(data.flatMap(Object.keys)));

  // Map data to CSV rows
  const csvRows = data.map(row => {
    return headers.map(header => {
      let cell = row[header] === null || row[header] === undefined ? '' : row[header];
      if (typeof cell === 'object') {
        try {
          cell = JSON.stringify(cell);
        } catch (e) {
          cell = String(cell);
        }
      } else {
        cell = String(cell);
      }
      // Escape quotes
      cell = cell.replace(/"/g, '""');
      // Wrap in quotes
      return `"${cell}"`;
    }).join(',');
  });

  // Add header row
  const headerRow = headers.map(h => `"${h}"`).join(',');
  csvRows.unshift(headerRow);

  // Join all rows
  const csvContent = csvRows.join('\n');

  // Trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
