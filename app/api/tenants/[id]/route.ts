import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { RowDataPacket } from 'mysql2/promise';

// Define the Tenant type
interface Tenant extends RowDataPacket {
  tenant_id: number;
  name: string;
  id_passport_number: string;
  contact: string;
  email: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
}

// GET: Fetch a single tenant by ID
export async function GET(req: NextRequest, { params }: any) {
  let conn;
  try {
    conn = await getConnection();
    const [rows] = await conn.execute<Tenant[]>('SELECT * FROM tenants WHERE tenant_id = ?', [params.id]);
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }
    return NextResponse.json(rows[0]);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  } finally {
    if (conn) await conn.end();
  }
}

// PUT: Update a tenant by ID
export async function PUT(req: NextRequest, { params }: any) {
  let conn;
  try {
    const { name, id_passport_number, contact, email, emergency_contact_name, emergency_contact_phone } = await req.json();
    if (!name || !id_passport_number) {
      return NextResponse.json({ error: 'Name and ID/Passport number are required' }, { status: 400 });
    }

    conn = await getConnection();
    const [result] = await conn.execute(
      'UPDATE tenants SET name = ?, id_passport_number = ?, contact = ?, email = ?, emergency_contact_name = ?, emergency_contact_phone = ? WHERE tenant_id = ?',
      [name, id_passport_number, contact || null, email || null, emergency_contact_name || null, emergency_contact_phone || null, params.id]
    );

    if ((result as any).affectedRows === 0) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Tenant updated' });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  } finally {
    if (conn) await conn.end();
  }
}

// DELETE: Delete a tenant by ID
export async function DELETE(req: NextRequest, { params }: any) {
  let conn;
  try {
    conn = await getConnection();
    const [result] = await conn.execute('DELETE FROM tenants WHERE tenant_id = ?', [params.id]);

    if ((result as any).affectedRows === 0) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Tenant deleted' });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  } finally {
    if (conn) await conn.end();
  }
}