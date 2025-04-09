import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { RowDataPacket } from 'mysql2/promise';

// Define the TenantMoveHistory type
interface TenantMoveHistory extends RowDataPacket {
  tenancy_id: number;
  tenant_name: string;
  apartment_number: string;
  property_name: string;
  move_in_date: string; // MySQL DATE as 'YYYY-MM-DD'
  move_out_date: string | null;
  tenancy_status: 'Active' | 'Inactive';
}

// GET: List all tenant move histories
export async function GET() {
  let conn;
  try {
    conn = await getConnection();
    const [rows] = await conn.execute<TenantMoveHistory[]>('SELECT * FROM tenant_move_history');
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  } finally {
    if (conn) await conn.end();
  }
}