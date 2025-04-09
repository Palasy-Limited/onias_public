import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { RowDataPacket } from 'mysql2/promise';

// Define the Property type
interface Property extends RowDataPacket {
  property_id: number;
  name: string;
  address: string;
  description: string;
  conservancy_fee: number;
}

// GET: Fetch a single property by ID
export async function GET(req: NextRequest, { params }: any) {
  let conn;
  try {
    conn = await getConnection();
    const [rows] = await conn.execute<Property[]>('SELECT * FROM properties WHERE property_id = ?', [
      params.id,
    ]);
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }
    return NextResponse.json(rows[0]);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  } finally {
    if (conn) await conn.end();
  }
}

// PUT: Update a property by ID
export async function PUT(req: NextRequest, { params }: any) {
  let conn;
  try {
    const { name, address, description, conservancy_fee } = await req.json();
    if (!name || !address) {
      return NextResponse.json({ error: 'Name and address are required' }, { status: 400 });
    }

    conn = await getConnection();
    const [result] = await conn.execute(
      'UPDATE properties SET name = ?, address = ?, description = ?, conservancy_fee = ? WHERE property_id = ?',
      [name, address, description || null, conservancy_fee || null, params.id]
    );

    if ((result as any).affectedRows === 0) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Property updated' });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  } finally {
    if (conn) await conn.end();
  }
}

// DELETE: Delete a property by ID
export async function DELETE(req: NextRequest, { params }: any) {
  let conn;
  try {
    conn = await getConnection();
    const [result] = await conn.execute('DELETE FROM properties WHERE property_id = ?', [params.id]);

    if ((result as any).affectedRows === 0) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Property deleted' });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  } finally {
    if (conn) await conn.end();
  }
}