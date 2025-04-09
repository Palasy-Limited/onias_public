import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

// GET all water readings
export async function GET(request: NextRequest) {
  let conn;
  try {
    conn = await getConnection();
    
    const [rows] = await conn.execute<RowDataPacket[]>(
      `
      SELECT 
        wr.reading_id,
        wr.water_meter_id,
        wr.reading_date,
        wr.water_meter_reading,
        wm.meter_number,
        a.apartment_number
      FROM water_readings wr
      JOIN water_meters wm ON wr.water_meter_id = wm.water_meter_id
      JOIN apartments a ON wm.apartment_id = a.apartment_id
      ORDER BY wr.reading_date DESC
      `
    );

    return NextResponse.json({
      success: true,
      data: rows
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching water readings:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message || 'Error fetching water readings'
    }, { status: 500 });
  } finally {
    if (conn) await conn.end();
  }
}

// POST - Create new water reading
export async function POST(request: NextRequest) {
  let conn;
  try {
    const body = await request.json();
    const { water_meter_id, reading_date, water_meter_reading } = body;

    // Basic validation
    if (!water_meter_id || !reading_date || water_meter_reading === undefined) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 });
    }

    conn = await getConnection();
    
    const [result] = await conn.execute<ResultSetHeader>(
      `
      INSERT INTO water_readings (water_meter_id, reading_date, water_meter_reading)
      VALUES (?, ?, ?)
      `,
      [water_meter_id, reading_date, water_meter_reading]
    );

    return NextResponse.json({
      success: true,
      data: {
        reading_id: result.insertId,
        water_meter_id,
        reading_date,
        water_meter_reading
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating water reading:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message || 'Error creating water reading'
    }, { status: 500 });
  } finally {
    if (conn) await conn.end();
  }
}