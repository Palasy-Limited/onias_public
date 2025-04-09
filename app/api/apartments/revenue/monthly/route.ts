import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { RowDataPacket } from 'mysql2/promise';

export async function GET() {
  let conn;
  try {
    conn = await getConnection();
    const [rows] = await conn.execute<RowDataPacket[]>(
      `SELECT DATE_FORMAT(payment_date, '%Y-%m') as month, SUM(amount_paid) as total
       FROM payments
       WHERE payment_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
       GROUP BY month
       ORDER BY month ASC`
    );
    const monthlyRevenue = rows.map(row => row.total);
    return NextResponse.json(monthlyRevenue);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  } finally {
    if (conn) await conn.end();
  }
}