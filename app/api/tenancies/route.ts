import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { RowDataPacket } from 'mysql2/promise';

// Define the Tenancy type
interface Tenancy extends RowDataPacket {
  tenancy_id: number;
  apartment_id: number;
  tenant_id: number;
  start_date: string; // MySQL DATE returns as string in 'YYYY-MM-DD'
  end_date: string | null;
  rent_amount: number;
  deposit_amount: number;
  internet_plan_id: number | null;
  active: number; // TINYINT(1) returns as 0 or 1
  final_balance: number | null;
}

// GET: List all tenancies
export async function GET() {
  let conn;
  try {
    conn = await getConnection();
    const [rows] = await conn.execute<Tenancy[]>('SELECT * FROM tenancies');
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  } finally {
    if (conn) await conn.end();
  }
}

// POST: Create a new tenancy
export async function POST(req: NextRequest) {
  let conn;
  try {
    const { apartment_id, tenant_id, start_date, end_date, rent_amount, deposit_amount, internet_plan_id, active, final_balance } = await req.json();
    if (!apartment_id || !tenant_id || !start_date || !rent_amount || !deposit_amount) {
      return NextResponse.json({ error: 'Apartment ID, tenant ID, start date, rent amount, and deposit amount are required' }, { status: 400 });
    }

    conn = await getConnection();
    const [result] = await conn.execute(
      'INSERT INTO tenancies (apartment_id, tenant_id, start_date, end_date, rent_amount, deposit_amount, internet_plan_id, active, final_balance) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        apartment_id,
        tenant_id,
        start_date,
        end_date || null,
        rent_amount,
        deposit_amount,
        internet_plan_id || null,
        active !== undefined ? active : 1, // Default to active (1) if not specified
        final_balance || null,
      ]
    );

    return NextResponse.json(
      { message: 'Tenancy created', tenancy_id: (result as any).insertId },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  } finally {
    if (conn) await conn.end();
  }
}