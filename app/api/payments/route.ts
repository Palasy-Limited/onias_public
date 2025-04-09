import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { RowDataPacket } from 'mysql2/promise';

interface Payment extends RowDataPacket {
  payment_id: number;
  tenancy_id: number;
  payment_date: string;
  amount_paid: number;
  for_month: string;
  invoice_id: number | null;
  tenant_name?: string;
  apartment_number?: string;
  property_name?: string;
}

export async function GET(req: NextRequest) {
  let conn;
  try {
    const { searchParams } = new URL(req.url);
    const paymentId = searchParams.get('payment_id') || '';
    const tenantName = searchParams.get('tenant_name') || '';
    const apartmentNumber = searchParams.get('apartment_number') || '';
    const propertyName = searchParams.get('property_name') || '';
    const paymentDate = searchParams.get('payment_date') || '';
    const forMonth = searchParams.get('for_month') || '';
    const invoiceId = searchParams.get('invoice_id') || '';

    conn = await getConnection();

    const query = `
      SELECT 
        p.payment_id,
        p.tenancy_id,
        p.payment_date,
        p.amount_paid,
        p.for_month,
        p.invoice_id,
        t.name AS tenant_name,
        a.apartment_number,
        pr.name AS property_name
      FROM payments p
      LEFT JOIN tenancies te ON p.tenancy_id = te.tenancy_id
      LEFT JOIN apartments a ON te.apartment_id = a.apartment_id
      LEFT JOIN tenants t ON te.tenant_id = t.tenant_id
      LEFT JOIN properties pr ON a.property_id = pr.property_id
      WHERE 
        (? = '' OR CAST(p.payment_id AS CHAR) LIKE ?)
        AND (? = '' OR t.name LIKE ?)
        AND (? = '' OR a.apartment_number LIKE ?)
        AND (? = '' OR pr.name LIKE ?)
        AND (? = '' OR p.payment_date LIKE ?)
        AND (? = '' OR p.for_month LIKE ?)
        AND (? = '' OR CAST(p.invoice_id AS CHAR) LIKE ?)
      ORDER BY p.payment_date DESC
    `;

    const [rows] = await conn.execute<Payment[]>(query, [
      paymentId, `%${paymentId}%`,
      tenantName, `%${tenantName}%`,
      apartmentNumber, `%${apartmentNumber}%`,
      propertyName, `%${propertyName}%`,
      paymentDate, `%${paymentDate}%`,
      forMonth, `%${forMonth}%`,
      invoiceId, `%${invoiceId}%`,
    ]);

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  } finally {
    if (conn) await conn.end();
  }
}

export async function POST(req: NextRequest) {
  let conn;
  try {
    const { tenancy_id, payment_date, amount_paid, for_month, invoice_id } = await req.json();
    if (!tenancy_id || !payment_date || !amount_paid) {
      return NextResponse.json({ error: 'Tenancy ID, payment date, and amount paid are required' }, { status: 400 });
    }

    conn = await getConnection();
    const [result] = await conn.execute(
      'INSERT INTO payments (tenancy_id, payment_date, amount_paid, for_month, invoice_id) VALUES (?, ?, ?, ?, ?)',
      [tenancy_id, payment_date, amount_paid, for_month || null, invoice_id || null]
    );

    return NextResponse.json(
      { message: 'Payment created', payment_id: (result as any).insertId },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in /api/payments POST:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  } finally {
    if (conn) await conn.end();
  }
}