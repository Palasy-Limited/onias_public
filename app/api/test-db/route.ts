import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';

export async function GET() {
  let conn;
  try {
    conn = await getConnection();
    const [res] = await conn.execute('SELECT NOW() AS current_time');
    return NextResponse.json({ success: true, res });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  } finally {
    if (conn) await conn.end();
  }
}