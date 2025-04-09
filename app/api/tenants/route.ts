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

// GET: List all tenants
export async function GET() {
  let conn;
  try {
    conn = await getConnection();
    const [rows] = await conn.execute<Tenant[]>('SELECT * FROM tenants');
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  } finally {
    if (conn) await conn.end();
  }
}

// POST: Create a new tenant
export async function POST(req: NextRequest) {
  let conn;
  try {
    const { name, id_passport_number, contact, email, emergency_contact_name, emergency_contact_phone } = await req.json();
    if (!name || !id_passport_number) {
      return NextResponse.json({ error: 'Name and ID/Passport number are required' }, { status: 400 });
    }

    conn = await getConnection();
    const [result] = await conn.execute(
      'INSERT INTO tenants (name, id_passport_number, contact, email, emergency_contact_name, emergency_contact_phone) VALUES (?, ?, ?, ?, ?, ?)',
      [name, id_passport_number, contact || null, email || null, emergency_contact_name || null, emergency_contact_phone || null]
    );

    return NextResponse.json(
      { message: 'Tenant created', tenant_id: (result as any).insertId },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  } finally {
    if (conn) await conn.end();
  }
}