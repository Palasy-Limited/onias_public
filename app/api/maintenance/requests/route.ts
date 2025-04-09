import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { RowDataPacket } from 'mysql2/promise';

export async function GET() {
  let conn;
  try {
    conn = await getConnection();
    const [rows] = await conn.execute<RowDataPacket[]>(
      'SELECT status, COUNT(*) as count FROM maintenance GROUP BY status'
    );
    const requests = {
      pending: 0,
      inProgress: 0,
      completed: 0,
      cancelled: 0,
    };
    rows.forEach(row => {
      switch (row.status) {
        case 'Pending':
          requests.pending = row.count;
          break;
        case 'In Progress':
          requests.inProgress = row.count;
          break;
        case 'Completed':
          requests.completed = row.count;
          break;
        case 'Cancelled':
          requests.cancelled = row.count;
          break;
      }
    });
    return NextResponse.json(requests);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  } finally {
    if (conn) await conn.end();
  }
}