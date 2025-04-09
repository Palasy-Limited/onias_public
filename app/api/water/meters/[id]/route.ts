import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

// Interface for WaterMeter
interface WaterMeter {
  water_meter_id: number;
  apartment_id: number;
  meter_number: string;
}

// GET: Retrieve a specific water meter by ID
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  let conn;
  try {
    const id = params.id;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ error: 'Valid water_meter_id is required' }, { status: 400 });
    }

    conn = await getConnection();
    const [rows] = await conn.execute<RowDataPacket[]>(
      'SELECT * FROM water_meters WHERE water_meter_id = ?',
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Water meter not found' }, { status: 404 });
    }

    return NextResponse.json(rows[0], { status: 200 });
  } catch (error) {
    console.error('Error fetching water meter:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Error fetching water meter' },
      { status: 500 }
    );
  } finally {
    if (conn) await conn.end();
  }
}

// PUT: Update an existing water meter by ID
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  let conn;
  try {
    const id = params.id;
    const body: Partial<Omit<WaterMeter, 'water_meter_id'>> = await req.json();
    const { apartment_id, meter_number } = body;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ error: 'Valid water_meter_id is required' }, { status: 400 });
    }

    conn = await getConnection();

    // Check if the water meter exists
    const [existing] = await conn.execute<RowDataPacket[]>(
      'SELECT * FROM water_meters WHERE water_meter_id = ?',
      [id]
    );
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Water meter not found' }, { status: 404 });
    }

    // Prepare update fields
    const updates: string[] = [];
    const values: (number | string)[] = [];
    if (apartment_id !== undefined) {
      updates.push('apartment_id = ?');
      values.push(apartment_id);
    }
    if (meter_number !== undefined) {
      if (meter_number.length > 20) {
        return NextResponse.json(
          { error: 'meter_number exceeds 20 characters' },
          { status: 400 }
        );
      }
      updates.push('meter_number = ?');
      values.push(meter_number);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No fields provided to update' },
        { status: 400 }
      );
    }

    values.push(parseInt(id));
    const query = `UPDATE water_meters SET ${updates.join(', ')} WHERE water_meter_id = ?`;
    const [result] = await conn.execute<ResultSetHeader>(query, values);

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Failed to update water meter' }, { status: 500 });
    }

    // Fetch the updated record
    const [updatedRows] = await conn.execute<RowDataPacket[]>(
      'SELECT * FROM water_meters WHERE water_meter_id = ?',
      [id]
    );
    return NextResponse.json(updatedRows[0], { status: 200 });
  } catch (error) {
    console.error('Error updating water meter:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Error updating water meter' },
      { status: 500 }
    );
  } finally {
    if (conn) await conn.end();
  }
}

// DELETE: Delete a water meter by ID
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  let conn;
  try {
    const id = params.id;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ error: 'Valid water_meter_id is required' }, { status: 400 });
    }

    conn = await getConnection();

    // Check if the water meter exists
    const [existing] = await conn.execute<RowDataPacket[]>(
      'SELECT * FROM water_meters WHERE water_meter_id = ?',
      [id]
    );
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Water meter not found' }, { status: 404 });
    }

    const [result] = await conn.execute<ResultSetHeader>(
      'DELETE FROM water_meters WHERE water_meter_id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Failed to delete water meter' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Water meter deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting water meter:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Error deleting water meter' },
      { status: 500 }
    );
  } finally {
    if (conn) await conn.end();
  }
}