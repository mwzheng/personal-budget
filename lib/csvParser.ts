import Papa from 'papaparse';
import { Transaction, CategoryType } from './types';

interface RawCSVRow {
  Name: string;
  Amount: string;
  Category: string;
  Date: string;
  Notes: string;
  'Payment Method': string;
  Tags: string;
}

function parseAmount(amountStr: string): number {
  return parseFloat(amountStr.replace(/[$,]/g, '')) || 0;
}

function parseDate(dateStr: string): string {
  const parts = dateStr.trim().split('/');
  if (parts.length !== 3) return dateStr;
  const [month, day, year] = parts;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function parseTags(tagString: string): string[] {
  if (!tagString?.trim()) return [];
  return tagString
    .split(',')
    .map((tag) => {
      const trimmed = tag.trim();
      // Strip Notion URL portion: "TagName (https://...)" → "TagName"
      const idx = trimmed.indexOf(' (');
      return idx !== -1 ? trimmed.substring(0, idx).trim() : trimmed;
    })
    .filter(Boolean);
}

function normalizeCategory(raw: string): CategoryType {
  const v = raw?.trim();
  if (v === 'Need' || v === 'Saving') return v;
  return 'Want';
}

export function loadTransactionsFromCSV(csvContent: string): Transaction[] {
  // Strip BOM if present
  const content = csvContent.replace(/^\uFEFF/, '');

  const result = Papa.parse<RawCSVRow>(content, {
    header: true,
    skipEmptyLines: true,
  });

  return result.data
    .filter((row) => row.Name && row.Amount)
    .map((row, index): Transaction => ({
      id: `t-${index}`,
      name: row.Name.trim(),
      amount: parseAmount(row.Amount),
      category: normalizeCategory(row.Category),
      date: parseDate(row.Date),
      notes: row.Notes?.trim() || '',
      paymentMethod: row['Payment Method']?.trim() || '',
      tags: parseTags(row.Tags),
    }))
    .filter((t) => t.amount > 0 && t.date.length === 10);
}
