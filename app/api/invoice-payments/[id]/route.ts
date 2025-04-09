import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { RowDataPacket } from 'mysql2/promise';

interface InvoicePayment extends RowDataPacket {
  invoice_payment_id: number;
  invoice_id: number;
  payment_id: number;
  amount_applied: number;
}

export async function GET(req: NextRequest, { params }: { params: any }) {
  let conn;
  try {
    conn = await getConnection();
    const [rows] = await conn.execute<InvoicePayment[]>('SELECT * FROM invoice_payments WHERE invoice_payment_id = ?', [params.id]);
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Invoice payment not found' }, { status: 404 });
    }
    return NextResponse.json(rows[0]);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  } finally {
    if (conn) await conn.end();
  }
}