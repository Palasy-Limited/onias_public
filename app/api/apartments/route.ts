import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { RowDataPacket } from 'mysql2/promise';

// Define the Apartment type
interface Apartment extends RowDataPacket {
  apartment_id: number;
  property_id: number;
  apartment_number: string;
  apartment_type: 'studio' | 'one_bedroom' | 'two_bedroom' | 'three_bedroom';
  switch_name: string;
  port_number: number;
}

// GET: List all apartments
export async function GET() {
  let conn;
  try {
    conn = await getConnection();
    const [rows] = await conn.execute<Apartment[]>('SELECT * FROM apartments');
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  } finally {
    if (conn) await conn.end();
  }
}

// POST: Create a new apartment
export async function POST(req: NextRequest) {
  let conn;
  try {
    const { property_id, apartment_number, apartment_type, switch_name, port_number } = await req.json();
    if (!property_id || !apartment_number) {
      return NextResponse.json({ error: 'Property ID and apartment number are required' }, { status: 400 });
    }

    // Validate apartment_type
    const validTypes = ['studio', 'one_bedroom', 'two_bedroom', 'three_bedroom'];
    if (apartment_type && !validTypes.includes(apartment_type)) {
      return NextResponse.json({ error: 'Invalid apartment type' }, { status: 400 });
    }

    conn = await getConnection();
    const [result] = await conn.execute(
      'INSERT INTO apartments (property_id, apartment_number, apartment_type, switch_name, port_number) VALUES (?, ?, ?, ?, ?)',
      [property_id, apartment_number, apartment_type || null, switch_name || null, port_number || null]
    );

    return NextResponse.json(
      { message: 'Apartment created', apartment_id: (result as any).insertId },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  } finally {
    if (conn) await conn.end();
  }
}