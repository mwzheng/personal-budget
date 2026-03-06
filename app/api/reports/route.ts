import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import { loadTransactionsFromCSV } from '@/lib/csvParser';
import { filterTransactions, aggregateTransactions } from '@/lib/aggregations';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const tagsParam = searchParams.get('tags');
    const tags = tagsParam ? tagsParam.split(',').filter(Boolean) : [];
    const search = searchParams.get('search') ?? '';
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const pageSize = Math.min(
      2000,
      Math.max(1, parseInt(searchParams.get('pageSize') ?? '1000', 10)),
    );
    const includeAggregates = searchParams.get('includeAggregates') !== 'false';

    const csvPath = join(process.cwd(), 'sample-data', 'expenses.csv');
    const csvContent = readFileSync(csvPath, 'utf-8');
    const allTransactions = loadTransactionsFromCSV(csvContent);

    const filtered = filterTransactions(allTransactions, {
      startDate,
      endDate,
      tags,
      search,
    });

    const totalCount = filtered.length;
    const start = (page - 1) * pageSize;
    const transactions = filtered.slice(start, start + pageSize);

    const aggregates = includeAggregates
      ? aggregateTransactions(filtered)
      : undefined;

    return NextResponse.json({ transactions, totalCount, aggregates });
  } catch (error) {
    console.error('[/api/reports]', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to load reports' } },
      { status: 500 },
    );
  }
}
