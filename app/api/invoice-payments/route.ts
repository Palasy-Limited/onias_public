import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { RowDataPacket } from 'mysql2/promise';

interface InvoicePayment extends RowDataPacket {
  invoice_payment_id: number;
  invoice_id: number;
  payment_id: number;
  amount_applied: number;
}

export async function POST(req: NextRequest) {
  let conn;
  try {
    const { invoice_id, payment_id, amount_applied } = await req.json();
    if (!invoice_id || !payment_id || !amount_applied) {
      return NextResponse.json({ error: 'Invoice ID, payment ID, and amount applied are required' }, { status: 400 });
    }

    conn = await getConnection();
    const [result] = await conn.execute(
      'INSERT INTO invoice_payments (invoice_id, payment_id, amount_applied) VALUES (?, ?, ?)',
      [invoice_id, payment_id, amount_applied]
    );

    return NextResponse.json(
      { message: 'Invoice payment created', invoice_payment_id: (result as any).insertId },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  } finally {
    if (conn) await conn.end();
  }
}