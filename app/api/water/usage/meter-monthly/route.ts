import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { RowDataPacket } from 'mysql2/promise';

// Interface for WaterUsage from the view
interface WaterUsage {
  water_meter_id: number;
  end_date: string; // ISO date string (e.g., "2024-03-28")
  start_date: string; // ISO date string (e.g., "2024-02-28")
  water_consumption: number; // decimal(11,2) mapped to number
}

// GET: Retrieve monthly water usage for all meters
export async function GET(req: NextRequest) {
  let conn;
  try {
    conn = await getConnection();

    // Fetch all records from the water_usage view
    const [rows] = await conn.execute<RowDataPacket[]>(
      'SELECT water_meter_id, start_date, end_date, water_consumption FROM water_usage ORDER BY water_meter_id, end_date DESC'
    );

    // Transform data into { [water_meter_id]: { [YYYY-MM]: consumption } }
    const usageData: { [key: number]: { [month: string]: number } } = {};

    rows.forEach((row: WaterUsage) => {
      const meterId = row.water_meter_id;
      // Use end_date to determine the month (28th to 28th period)
      const date = new Date(row.end_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

      if (!usageData[meterId]) {
        usageData[meterId] = {};
      }
      usageData[meterId][monthKey] = Number(row.water_consumption); // Convert decimal to number
    });

    return NextResponse.json({ data: usageData }, { status: 200 });
  } catch (error) {
    console.error('Error fetching water usage:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Error fetching water usage' },
      { status: 500 }
    );
  } finally {
    if (conn) await conn.end();
  }
}