import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { ResultSetHeader } from 'mysql2/promise';

// POST - Create multiple water readings in bulk
export async function POST(request: NextRequest) {
  let conn;
  try {
    const body = await request.json();

    // Validate that the body is an array and not empty
    if (!Array.isArray(body) || body.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Request body must be a non-empty array of water readings'
      }, { status: 400 });
    }

    // Validate each reading object
    for (const reading of body) {
      const { water_meter_id, reading_date, water_meter_reading } = reading;
      if (!water_meter_id || !reading_date || water_meter_reading === undefined) {
        return NextResponse.json({
          success: false,
          error: 'Each reading must include water_meter_id, reading_date, and water_meter_reading'
        }, { status: 400 });
      }
    }

    conn = await getConnection();

    // Start a transaction
    await conn.beginTransaction();

    // Prepare values for bulk insert
    const values = body.map(reading => [
      reading.water_meter_id,
      reading.reading_date,
      reading.water_meter_reading
    ]);

    // Perform bulk insert
    const [result] = await conn.query<ResultSetHeader>(
      `
      INSERT INTO water_readings (water_meter_id, reading_date, water_meter_reading)
      VALUES ?
      `,
      [values]
    );

    // Commit the transaction
    await conn.commit();

    // Construct response with inserted readings
    const insertedReadings = body.map((reading, index) => ({
      reading_id: result.insertId + index, // Auto-increment IDs start from insertId
      water_meter_id: reading.water_meter_id,
      reading_date: reading.reading_date,
      water_meter_reading: reading.water_meter_reading
    }));

    return NextResponse.json({
      success: true,
      data: insertedReadings
    }, { status: 201 });

  } catch (error) {
    // Rollback transaction on error
    if (conn) await conn.rollback();

    console.error('Error creating bulk water readings:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message || 'Error creating bulk water readings'
    }, { status: 500 });
  } finally {
    if (conn) await conn.end();
  }
}