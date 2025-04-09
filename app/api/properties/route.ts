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

// GET: List all properties
export async function GET() {
  let conn;
  try {
    conn = await getConnection();
    const [rows] = await conn.execute<Property[]>('SELECT * FROM properties');
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  } finally {
    if (conn) await conn.end();
  }
}

// POST: Create a new property
export async function POST(req: NextRequest) {
  let conn;
  try {
    const { name, address, description, conservancy_fee } = await req.json();
    if (!name || !address) {
      return NextResponse.json({ error: 'Name and address are required' }, { status: 400 });
    }

    conn = await getConnection();
    const [result] = await conn.execute(
      'INSERT INTO properties (name, address, description, conservancy_fee) VALUES (?, ?, ?, ?)',
      [name, address, description || null, conservancy_fee || null]
    );

    return NextResponse.json(
      { message: 'Property created', property_id: (result as any).insertId },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  } finally {
    if (conn) await conn.end();
  }
}