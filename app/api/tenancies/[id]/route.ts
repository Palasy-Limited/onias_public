import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { RowDataPacket } from 'mysql2/promise';

// Define the Tenancy type
interface Tenancy extends RowDataPacket {
  tenancy_id: number;
  apartment_id: number;
  tenant_id: number;
  start_date: string;
  end_date: string | null;
  rent_amount: number;
  deposit_amount: number;
  internet_plan_id: number | null;
  active: number;
  final_balance: number | null;
}

// GET: Fetch a single tenancy by ID
export async function GET(req: NextRequest, { params }: any) {
  let conn;
  try {
    conn = await getConnection();
    const [rows] = await conn.execute<Tenancy[]>('SELECT * FROM tenancies WHERE tenancy_id = ?', [params.id]);
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Tenancy not found' }, { status: 404 });
    }
    return NextResponse.json(rows[0]);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  } finally {
    if (conn) await conn.end();
  }
}

// PUT: Update a tenancy by ID
export async function PUT(req: NextRequest, { params }: any) {
  let conn;
  try {
    const { apartment_id, tenant_id, start_date, end_date, rent_amount, deposit_amount, internet_plan_id, active, final_balance } = await req.json();
    if (!apartment_id || !tenant_id || !start_date || !rent_amount || !deposit_amount) {
      return NextResponse.json({ error: 'Apartment ID, tenant ID, start date, rent amount, and deposit amount are required' }, { status: 400 });
    }

    conn = await getConnection();
    const [result] = await conn.execute(
      'UPDATE tenancies SET apartment_id = ?, tenant_id = ?, start_date = ?, end_date = ?, rent_amount = ?, deposit_amount = ?, internet_plan_id = ?, active = ?, final_balance = ? WHERE tenancy_id = ?',
      [
        apartment_id,
        tenant_id,
        start_date,
        end_date || null,
        rent_amount,
        deposit_amount,
        internet_plan_id || null,
        active !== undefined ? active : 1,
        final_balance || null,
        params.id,
      ]
    );

    if ((result as any).affectedRows === 0) {
      return NextResponse.json({ error: 'Tenancy not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Tenancy updated' });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  } finally {
    if (conn) await conn.end();
  }
}

// DELETE: Delete a tenancy by ID
export async function DELETE(req: NextRequest, { params }: any) {
  let conn;
  try {
    conn = await getConnection();
    const [result] = await conn.execute('DELETE FROM tenancies WHERE tenancy_id = ?', [params.id]);

    if ((result as any).affectedRows === 0) {
      return NextResponse.json({ error: 'Tenancy not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Tenancy deleted' });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  } finally {
    if (conn) await conn.end();
  }
}