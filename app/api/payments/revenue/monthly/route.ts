import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { RowDataPacket } from 'mysql2/promise';

export async function GET(request: Request) {
  let conn;
  try {
    // Extract the 'months' query parameter from the request URL
    const { searchParams } = new URL(request.url);
    const months = parseInt(searchParams.get('months') || '12', 10);

    // Validate the 'months' parameter
    if (isNaN(months) || months < 1) {
      return NextResponse.json({ error: 'Invalid number of months' }, { status: 400 });
    }

    // Cap the number of months to a reasonable limit (e.g., 60 months = 5 years)
    const maxMonths = 60;
    const monthsToFetch = Math.min(months, maxMonths);

    conn = await getConnection();
    const [rows] = await conn.execute<RowDataPacket[]>(
      `SELECT year, month, total_payments
       FROM monthly_payments
       WHERE (year * 12 + month) >= (YEAR(CURDATE()) * 12 + MONTH(CURDATE()) - ?)
       ORDER BY year ASC, month ASC
       LIMIT ${monthsToFetch}`, // Directly insert monthsToFetch into the query
      [monthsToFetch] // Only one parameter for the WHERE clause
    );

    // Map the rows to the requested format: [{ year, month, value }, ...]
    const monthlyRevenue = rows.map(row => ({
      year: row.year,
      month: row.month,
      value: Number(row.total_payments), // Convert decimal to number and rename to 'value'
    }));

    return NextResponse.json(monthlyRevenue);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  } finally {
    if (conn) await conn.end();
  }
}