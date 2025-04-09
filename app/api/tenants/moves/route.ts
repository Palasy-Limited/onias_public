import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { RowDataPacket } from 'mysql2/promise';

export async function GET() {
  let conn;
  try {
    const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const currentMonthEnd = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];

    conn = await getConnection();
    const [moveInsRows] = await conn.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM tenancies WHERE start_date >= ? AND start_date <= ?',
      [currentMonthStart, currentMonthEnd]
    );
    const [moveOutsRows] = await conn.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM tenancies WHERE end_date >= ? AND end_date <= ?',
      [currentMonthStart, currentMonthEnd]
    );
    const moveIns = moveInsRows[0].total;
    const moveOuts = moveOutsRows[0].total;
    return NextResponse.json({ moveIns, moveOuts });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  } finally {
    if (conn) await conn.end();
  }
}