import { format } from 'date-fns';

/**
 * Convert array of objects to CSV string and trigger download
 */
export function exportToCSV(
  data: Record<string, any>[],
  reportType: string,
  columns?: { key: string; label: string }[]
) {
  if (!data || data.length === 0) return;

  const cols = columns || Object.keys(data[0]).map(key => ({ key, label: key }));
  const header = cols.map(c => `"${c.label}"`).join(',');
  const rows = data.map(row =>
    cols.map(c => {
      const val = row[c.key];
      if (val === null || val === undefined) return '""';
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(',')
  );

  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `elevate-report-${reportType}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Trigger browser print for PDF export
 */
export function exportToPDF() {
  window.print();
}

/**
 * Export a single chart's data as CSV
 */
export function exportChartData(
  data: Record<string, any>[],
  chartName: string,
  columns?: { key: string; label: string }[]
) {
  const slug = chartName.toLowerCase().replace(/\s+/g, '-');
  exportToCSV(data, slug, columns);
}
