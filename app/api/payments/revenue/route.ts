import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { RowDataPacket } from 'mysql2/promise';

export async function GET(req: NextRequest) {
  let conn;
  try {
    const url = new URL(req.url);
    const startDate = url.searchParams.get('startDate') || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const endDate = url.searchParams.get('endDate') || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];

    conn = await getConnection();
    const [rows] = await conn.execute<RowDataPacket[]>(
      'SELECT SUM(amount_paid) as total FROM payments WHERE payment_date >= ? AND payment_date <= ?',
      [startDate, endDate]
    );
    const total = rows[0].total || 0;
    return NextResponse.json({ total });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  } finally {
    if (conn) await conn.end();
  }
}