import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { RowDataPacket } from 'mysql2/promise';

interface Invoice extends RowDataPacket {
  invoice_id: number;
  tenancy_id: number;
  invoice_number: string;
  month_billed: string;
  date_billed: string;
  due_date: string;
  status: 'Open' | 'Closed' | 'Overdue';
  balance_brought_forward: number;
  rent: number;
  water: number;
  power: number;
  internet: number;
  service_charge: number;
  deposit: number;
  damages: number;
  total_amount: number;
  amount_paid: number;
  balance_due: number;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  let conn;
  try {
    conn = await getConnection();
    const [rows] = await conn.execute<Invoice[]>(
      `
      SELECT 
        invoice_id,
        tenancy_id,
        invoice_number,
        month_billed,
        date_billed,
        due_date,
        status,
        balance_brought_forward,
        rent,
        water,
        power,
        internet,
        service_charge,
        deposit,
        damages,
        total_amount,
        amount_paid,
        balance_due
      FROM invoices 
      WHERE invoice_id = ?
      `,
      [params.id]
    );
    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: rows[0] }, { status: 200 });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Error fetching invoice' },
      { status: 500 }
    );
  } finally {
    if (conn) await conn.end();
  }
}