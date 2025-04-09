//api/water/usage/monthly/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { RowDataPacket } from 'mysql2/promise';

export async function GET() {
  let conn;
  try {
    // Establish a database connection
    conn = await getConnection();

    // Query the water_usage view to calculate monthly water consumption
    const [rows] = await conn.execute<RowDataPacket[]>(
      `
      SELECT 
        DATE_FORMAT(wu.end_date, '%Y-%m') AS month,
        COALESCE(SUM(wu.water_consumption), 0) AS total_consumption
      FROM 
        water_usage wu
      WHERE 
        wu.end_date >= DATE_SUB(CURDATE(), INTERVAL 24 MONTH)
      GROUP BY 
        DATE_FORMAT(wu.end_date, '%Y-%m')
      ORDER BY 
        month ASC
      `
    );

    // Format the response as an array of objects with month and total consumption
    const monthlyUsage = rows.map(row => ({
      month: row.month, // e.g., "2025-03"
      totalConsumption: Number(row.total_consumption) // Convert to number for consistency
    }));

    // Return a structured success response
    return NextResponse.json({
      success: true,
      data: monthlyUsage
    }, { status: 200 });

  } catch (error) {
    // Log the error for debugging (in production, use a proper logging system)
    console.error('Error fetching monthly water consumption:', error);

    // Return a structured error response
    return NextResponse.json({
      success: false,
      error: (error as Error).message || 'An error occurred while fetching water consumption data'
    }, { status: 500 });

  } finally {
    // Ensure the connection is closed
    if (conn) await conn.end();
  }
}