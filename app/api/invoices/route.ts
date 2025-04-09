import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

interface Invoice extends RowDataPacket {
  invoice_id: number;
  tenancy_id: number;
  invoice_number: string;
  month_billed: string;
  date_billed: string;
  due_date: string;
  status: 'Open' | 'Closed' | 'Overdue';
  balance_brought_forward: number;
  rent: number;
  water: number;
  power: number;
  internet: number;
  service_charge: number;
  deposit: number;
  damages: number;
  total_amount: number;
  amount_paid: number;
  balance_due: number;
}

// GET: List all invoices
export async function GET(req: NextRequest) {
  let conn;
  try {
    conn = await getConnection();
    const [rows] = await conn.execute<Invoice[]>(
      `
      SELECT 
        invoice_id,
        tenancy_id,
        invoice_number,
        month_billed,
        date_billed,
        due_date,
        status,
        balance_brought_forward,
        rent,
        water,
        power,
        internet,
        service_charge,
        deposit,
        damages,
        total_amount,
        amount_paid,
        balance_due
      FROM invoices
      ORDER BY date_billed DESC
      `
    );
    return NextResponse.json({ success: true, data: rows }, { status: 200 });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Error fetching invoices' },
      { status: 500 }
    );
  } finally {
    if (conn) await conn.end();
  }
}

// POST: Create new invoice
export async function POST(req: NextRequest) {
  let conn;
  try {
    const {
      tenancy_id,
      invoice_number,
      month_billed,
      date_billed,
      due_date,
      status = 'Open', // Default to 'Open' if not provided
      balance_brought_forward = 0,
      rent = 0,
      water = 0,
      power = 0,
      internet = 0,
      service_charge = 0,
      deposit = 0,
      damages = 0,
      total_amount = 0,
      amount_paid = 0,
      balance_due = 0,
    } = await req.json();

    // Basic validation
    if (!tenancy_id || !invoice_number || !month_billed || !date_billed || !due_date) {
      return NextResponse.json(
        { success: false, error: 'Tenancy ID, invoice number, month billed, date billed, and due date are required' },
        { status: 400 }
      );
    }

    conn = await getConnection();
    const [result] = await conn.execute<ResultSetHeader>(
      `
      INSERT INTO invoices (
        tenancy_id,
        invoice_number,
        month_billed,
        date_billed,
        due_date,
        status,
        balance_brought_forward,
        rent,
        water,
        power,
        internet,
        service_charge,
        deposit,
        damages,
        total_amount,
        amount_paid,
        balance_due
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        tenancy_id,
        invoice_number,
        month_billed,
        date_billed,
        due_date,
        status,
        balance_brought_forward,
        rent,
        water,
        power,
        internet,
        service_charge,
        deposit,
        damages,
        total_amount,
        amount_paid,
        balance_due,
      ]
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          invoice_id: result.insertId,
          tenancy_id,
          invoice_number,
          month_billed,
          date_billed,
          due_date,
          status,
          balance_brought_forward,
          rent,
          water,
          power,
          internet,
          service_charge,
          deposit,
          damages,
          total_amount,
          amount_paid,
          balance_due,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Error creating invoice' },
      { status: 500 }
    );
  } finally {
    if (conn) await conn.end();
  }
}

// PATCH: Update an existing invoice
export async function PATCH(req: NextRequest) {
  let conn;
  try {
    const { invoice_id, amount_paid, status } = await req.json();

    if (!invoice_id) {
      return NextResponse.json(
        { success: false, error: "Invoice ID is required" },
        { status: 400 }
      );
    }

    if (amount_paid === undefined && status === undefined) {
      return NextResponse.json(
        { success: false, error: "At least one field (amount_paid, status) must be provided to update" },
        { status: 400 }
      );
    }

    conn = await getConnection();

    const fields: string[] = [];
    const values: any[] = [];
    
    if (amount_paid !== undefined) {
      fields.push("amount_paid = ?");
      values.push(amount_paid);
    }
    if (status !== undefined) {
      fields.push("status = ?");
      values.push(status);
    }

    values.push(invoice_id);

    const query = `
      UPDATE invoices
      SET ${fields.join(", ")}
      WHERE invoice_id = ?
    `;

    const [result] = await conn.execute<ResultSetHeader>(query, values);

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: "Invoice not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Invoice updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating invoice:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  } finally {
    if (conn) await conn.end();
  }
} 