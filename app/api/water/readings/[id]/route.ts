import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

// GET water reading by ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  let conn;
  try {
    const readingId = params.id;
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
      WHERE wr.reading_id = ?
      `,
      [readingId]
    );

    if (rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Water reading not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: rows[0]
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching water reading:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message || 'Error fetching water reading'
    }, { status: 500 });
  } finally {
    if (conn) await conn.end();
  }
}

// PUT - Update water reading
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  let conn;
  try {
    const readingId = params.id;
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
      UPDATE water_readings 
      SET water_meter_id = ?, reading_date = ?, water_meter_reading = ?
      WHERE reading_id = ?
      `,
      [water_meter_id, reading_date, water_meter_reading, readingId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({
        success: false,
        error: 'Water reading not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        reading_id: Number(readingId),
        water_meter_id,
        reading_date,
        water_meter_reading
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error updating water reading:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message || 'Error updating water reading'
    }, { status: 500 });
  } finally {
    if (conn) await conn.end();
  }
}

// DELETE - Delete water reading
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  let conn;
  try {
    const readingId = params.id;
    conn = await getConnection();
    
    const [result] = await conn.execute<ResultSetHeader>(
      'DELETE FROM water_readings WHERE reading_id = ?',
      [readingId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({
        success: false,
        error: 'Water reading not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Water reading deleted successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('Error deleting water reading:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message || 'Error deleting water reading'
    }, { status: 500 });
  } finally {
    if (conn) await conn.end();
  }
}