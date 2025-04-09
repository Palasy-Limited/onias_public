/* eslint-disable @typescript-eslint/no-explicit-any */
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

// GET: Fetch a single apartment by ID
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(req: NextRequest, { params }: any) {
  let conn;
  try {
    conn = await getConnection();
    const [rows] = await conn.execute<Apartment[]>('SELECT * FROM apartments WHERE apartment_id = ?', [
      params.id,
    ]);
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Apartment not found' }, { status: 404 });
    }
    return NextResponse.json(rows[0]);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  } finally {
    if (conn) await conn.end();
  }
}

// PUT: Update an apartment by ID
export async function PUT(req: NextRequest, { params }: any) {
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
      'UPDATE apartments SET property_id = ?, apartment_number = ?, apartment_type = ?, switch_name = ?, port_number = ? WHERE apartment_id = ?',
      [property_id, apartment_number, apartment_type || null, switch_name || null, port_number || null, params.id]
    );

    if ((result as any).affectedRows === 0) {
      return NextResponse.json({ error: 'Apartment not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Apartment updated' });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  } finally {
    if (conn) await conn.end();
  }
}

// DELETE: Delete an apartment by ID
export async function DELETE(req: NextRequest, { params }: any) {
  let conn;
  try {
    conn = await getConnection();
    const [result] = await conn.execute('DELETE FROM apartments WHERE apartment_id = ?', [params.id]);

    if ((result as any).affectedRows === 0) {
      return NextResponse.json({ error: 'Apartment not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Apartment deleted' });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  } finally {
    if (conn) await conn.end();
  }
}