import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { RowDataPacket } from 'mysql2/promise';

export async function GET() {
  let conn;
  try {
    // Calculate dates for current month
    const currentDate = new Date();
    const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      .toISOString()
      .split('T')[0];
    const currentMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
      .toISOString()
      .split('T')[0];

    // Calculate dates for previous month
    const previousMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
      .toISOString()
      .split('T')[0];
    const previousMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0)
      .toISOString()
      .split('T')[0];

    // Establish database connection
    conn = await getConnection();

    // Query current month's consumption
    const [currentRows] = await conn.execute<RowDataPacket[]>(
      `
      SELECT 
        COALESCE(SUM(wu.water_consumption), 0) AS total_consumption
      FROM 
        water_usage wu
      WHERE 
        wu.end_date >= ? AND wu.end_date <= ?
      `,
      [currentMonthStart, currentMonthEnd]
    );

    let total = Number(currentRows[0].total_consumption) || 0;
    let responseMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    let responseStartDate = currentMonthStart;
    let responseEndDate = currentMonthEnd;

    // If current month's consumption is 0, get previous month's consumption
    if (total === 0) {
      const [previousRows] = await conn.execute<RowDataPacket[]>(
        `
        SELECT 
          COALESCE(SUM(wu.water_consumption), 0) AS total_consumption
        FROM 
          water_usage wu
        WHERE 
          wu.end_date >= ? AND wu.end_date <= ?
        `,
        [previousMonthStart, previousMonthEnd]
      );

      total = Number(previousRows[0].total_consumption) || 0;
      responseMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth()).padStart(2, '0')}`;
      responseStartDate = previousMonthStart;
      responseEndDate = previousMonthEnd;
    }

    // Return structured success response
    return NextResponse.json({
      success: true,
      data: {
        totalConsumption: total,
        month: responseMonth,
        startDate: responseStartDate,
        endDate: responseEndDate
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching water consumption:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message || 'An error occurred while fetching water consumption data'
    }, { status: 500 });

  } finally {
    if (conn) await conn.end();
  }
}