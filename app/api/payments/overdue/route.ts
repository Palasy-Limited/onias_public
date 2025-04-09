import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { RowDataPacket } from 'mysql2/promise';

export async function GET() {
  let conn;
  try {
    const currentMonth = new Date().toISOString().slice(0, 7); // e.g., '2023-10'

    conn = await getConnection();
    const [rows] = await conn.execute<RowDataPacket[]>(
      `SELECT COUNT(DISTINCT t.tenancy_id) as total
       FROM tenancies t
       LEFT JOIN payments p ON t.tenancy_id = p.tenancy_id AND DATE_FORMAT(p.for_month, '%Y-%m') = ?
       WHERE t.active = 1 AND p.payment_id IS NULL`,
      [currentMonth]
    );
    const total = rows[0].total;
    return NextResponse.json({ total });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  } finally {
    if (conn) await conn.end();
  }
}