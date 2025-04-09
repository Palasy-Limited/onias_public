import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { RowDataPacket } from 'mysql2/promise';

// Define the TenantMoveHistory type
interface TenantMoveHistory extends RowDataPacket {
  tenancy_id: number;
  tenant_name: string;
  apartment_number: string;
  property_name: string;
  move_in_date: string;
  move_out_date: string | null;
  tenancy_status: 'Active' | 'Inactive';
}

// GET: Fetch a single tenant move history by tenancy_id
export async function GET(req: NextRequest, { params }: any) {
  let conn;
  try {
    conn = await getConnection();
    const [rows] = await conn.execute<TenantMoveHistory[]>(
      'SELECT * FROM tenant_move_history WHERE tenancy_id = ?',
      [params.id]
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Tenancy move history not found' }, { status: 404 });
    }
    return NextResponse.json(rows[0]);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  } finally {
    if (conn) await conn.end();
  }
}