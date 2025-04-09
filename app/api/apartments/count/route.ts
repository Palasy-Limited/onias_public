import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { RowDataPacket } from 'mysql2/promise';

export async function GET() {
  let conn;
  try {
    conn = await getConnection();
    const [rows] = await conn.execute<RowDataPacket[]>('SELECT COUNT(*) as total FROM apartments');
    const total = rows[0].total;
    return NextResponse.json({ total });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  } finally {
    if (conn) await conn.end();
  }
}