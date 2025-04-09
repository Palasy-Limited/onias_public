import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

// Interface for WaterMeter
interface WaterMeter {
  water_meter_id: number;
  apartment_id: number;
  meter_number: string;
}

// GET: Retrieve all water meters
export async function GET() {
  let conn;
  try {
    conn = await getConnection();
    const [rows] = await conn.execute<RowDataPacket[]>(
      'SELECT * FROM water_meters ORDER BY water_meter_id ASC'
    );
    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    console.error('Error fetching water meters:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Error fetching water meters' },
      { status: 500 }
    );
  } finally {
    if (conn) await conn.end();
  }
}

// POST: Create a new water meter
export async function POST(req: NextRequest) {
  let conn;
  try {
    const body: Omit<WaterMeter, 'water_meter_id'> = await req.json();
    const { apartment_id, meter_number } = body;

    // Validate input
    if (!apartment_id || !meter_number) {
      return NextResponse.json(
        { error: 'apartment_id and meter_number are required' },
        { status: 400 }
      );
    }
    if (typeof apartment_id !== 'number' || typeof meter_number !== 'string') {
      return NextResponse.json(
        { error: 'Invalid data types for apartment_id or meter_number' },
        { status: 400 }
      );
    }
    if (meter_number.length > 20) {
      return NextResponse.json(
        { error: 'meter_number exceeds 20 characters' },
        { status: 400 }
      );
    }

    conn = await getConnection();
    const [result] = await conn.execute<ResultSetHeader>(
      'INSERT INTO water_meters (apartment_id, meter_number) VALUES (?, ?)',
      [apartment_id, meter_number]
    );

    const newWaterMeter: WaterMeter = {
      water_meter_id: result.insertId,
      apartment_id,
      meter_number,
    };

    return NextResponse.json(newWaterMeter, { status: 201 });
  } catch (error) {
    console.error('Error creating water meter:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Error creating water meter' },
      { status: 500 }
    );
  } finally {
    if (conn) await conn.end();
  }
}