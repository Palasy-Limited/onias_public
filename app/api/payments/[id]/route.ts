import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { RowDataPacket } from 'mysql2/promise';

interface Payment extends RowDataPacket {
  payment_id: number;
  tenancy_id: number;
  payment_type_id: number;
  payment_date: string;
  amount_paid: number;
  for_month: string;
  invoice_id: number;
}



export async function GET(req: NextRequest, { params }: { params: any }) {
  let conn;
  try {
    conn = await getConnection();
    const [rows] = await conn.execute<Payment[]>('SELECT * FROM payments WHERE payment_id = ?', [params.id]);
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }
    return NextResponse.json(rows[0]);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  } finally {
    if (conn) await conn.end();
  }
}