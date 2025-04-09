"use client";

import * as React from "react";
import { useEffect, useState, useCallback } from "react";
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IconChevronDown, IconChevronUp } from "@tabler/icons-react";

interface Payment {
  payment_id: number;
  tenancy_id: number;
  payment_date: string;
  amount_paid: number;
  for_month: string;
  invoice_id: number | null;
  tenant_name?: string;
  apartment_number?: string;
  property_name?: string;
}

interface Invoice {
  invoice_id: number;
  tenancy_id: number;
  invoice_number: string;
  month_billed: string;
  tenant_name?: string;
  apartment_number?: string;
}

const columns: ColumnDef<Payment>[] = [
  { accessorKey: "payment_id", header: "Payment ID" },
  { accessorKey: "tenant_name", header: "Tenant Name", cell: ({ row }) => row.original.tenant_name ?? "Unknown" },
  { accessorKey: "apartment_number", header: "Apartment", cell: ({ row }) => row.original.apartment_number ?? "N/A" },
  { accessorKey: "property_name", header: "Property", cell: ({ row }) => row.original.property_name ?? "N/A" },
  { accessorKey: "payment_date", header: "Payment Date", cell: ({ row }) => new Date(row.original.payment_date).toLocaleDateString() },
  { accessorKey: "amount_paid", header: "Amount Paid", cell: ({ row }) => Number(row.original.amount_paid).toFixed(2) },
  { accessorKey: "for_month", header: "For Month", cell: ({ row }) => new Date(row.original.for_month).toLocaleDateString() },
  { accessorKey: "invoice_id", header: "Invoice ID", cell: ({ row }) => row.original.invoice_id ?? "N/A" },
];

export default function PaymentsTable() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [sorting, setSorting] = useState<SortingState>([{ id: "payment_date", desc: true }]);
  const [filters, setFilters] = useState({
    payment_id: "",
    tenant_name: "",
    apartment_number: "",
    property_name: "",
    payment_date: "",
    for_month: "",
    invoice_id: "",
  });
  const [isFilterCardOpen, setIsFilterCardOpen] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);

  const fetchPayments = useCallback(async () => {
    try {
      const query = new URLSearchParams(filters).toString();
      const res = await fetch(`/api/payments?${query}`);
      if (!res.ok) throw new Error("Failed to fetch payments");
      const data = await res.json();
      setPayments(data);
    } catch (error) {
      console.error("Error fetching payments:", error);
    }
  }, [filters]);

  const fetchInvoices = async () => {
    try {
      const res = await fetch("/api/invoices");
      if (!res.ok) throw new Error("Failed to fetch invoices");
      const invoicesData = await res.json();
      const enrichedInvoices = await Promise.all(
        invoicesData.map(async (invoice: Invoice) => {
          const tenancyRes = await fetch(`/api/tenancies?tenancy_id=${invoice.tenancy_id}`);
          const tenancy = tenancyRes.ok ? (await tenancyRes.json())[0] : null;
          const apartmentRes = await fetch(`/api/apartments?apartment_id=${tenancy?.apartment_id}`);
          const apartment = apartmentRes.ok ? (await apartmentRes.json())[0] : null;
          const tenantRes = await fetch(`/api/tenants?tenant_id=${tenancy?.tenant_id}`);
          const tenant = tenantRes.ok ? (await tenantRes.json())[0] : null;
          return {
            ...invoice,
            tenant_name: tenant?.name,
            apartment_number: apartment?.apartment_number,
          };
        })
      );
      setInvoices(enrichedInvoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchInvoices();
  }, [fetchPayments]);

  const handlePaymentSubmit = async () => {
    if (!selectedInvoice || !paymentAmount) {
      alert("Please select an invoice and enter a payment amount.");
      return;
    }

    const amountPaid = Number(paymentAmount);
    if (isNaN(amountPaid) || amountPaid <= 0) {
      alert("Please enter a valid payment amount.");
      return;
    }

    const paymentData = {
      tenancy_id: selectedInvoice.tenancy_id,
      payment_date: paymentDate,
      amount_paid: amountPaid,
      for_month: new Date(selectedInvoice.month_billed).toISOString().split("T")[0],
      invoice_id: selectedInvoice.invoice_id,
    };

    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentData),
      });
      if (!res.ok) throw new Error("Failed to record payment");
      await fetchPayments();
      setSelectedInvoice(null);
      setPaymentAmount("");
      setPaymentDate(new Date().toISOString().split("T")[0]);
      alert("Payment recorded successfully!");
    } catch (error) {
      console.error("Error recording payment:", error);
      alert("Failed to record payment.");
    }
  };

  const table = useReactTable({
    data: payments,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="w-full p-4 space-y-12">
      <Card className="w-full mx-auto shadow-lg border border-gray-200 rounded-lg">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-800">Record Payment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Invoice</label>
              <Select
                value={selectedInvoice?.invoice_id.toString() || ""}
                onValueChange={(value) => setSelectedInvoice(invoices.find((inv) => inv.invoice_id === Number(value)) || null)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Invoice" />
                </SelectTrigger>
                <SelectContent>
                  {invoices.map((invoice) => (
                    <SelectItem key={invoice.invoice_id} value={invoice.invoice_id.toString()}>
                      {`${invoice.invoice_number} (${invoice.tenant_name ?? "Unknown"} - ${invoice.apartment_number ?? "N/A"})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Payment Amount</label>
              <Input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} placeholder="Enter amount" className="w-full" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Payment Date</label>
              <Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className="w-full" />
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button onClick={handlePaymentSubmit}>Submit Payment</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="w-full mx-auto shadow-lg border border-gray-200 rounded-lg">
        <CardHeader
          className="border-b border-gray-200 flex justify-between items-center cursor-pointer"
          onClick={() => setIsFilterCardOpen(!isFilterCardOpen)}
        >
          <CardTitle className="text-lg font-semibold text-gray-800">Filters</CardTitle>
          {isFilterCardOpen ? <IconChevronUp /> : <IconChevronDown />}
        </CardHeader>
        {isFilterCardOpen && (
          <CardContent className="pt-4">
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Payment ID</label>
                <Input placeholder="Filter by Payment ID" value={filters.payment_id} onChange={(e) => setFilters({ ...filters, payment_id: e.target.value })} className="w-full" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Tenant Name</label>
                <Input placeholder="Filter by Tenant Name" value={filters.tenant_name} onChange={(e) => setFilters({ ...filters, tenant_name: e.target.value })} className="w-full" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Apartment Number</label>
                <Input placeholder="Filter by Apartment" value={filters.apartment_number} onChange={(e) => setFilters({ ...filters, apartment_number: e.target.value })} className="w-full" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Property Name</label>
                <Input placeholder="Filter by Property" value={filters.property_name} onChange={(e) => setFilters({ ...filters, property_name: e.target.value })} className="w-full" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Payment Date</label>
                <Input placeholder="Filter by Payment Date (YYYY-MM-DD)" value={filters.payment_date} onChange={(e) => setFilters({ ...filters, payment_date: e.target.value })} className="w-full" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">For Month</label>
                <Input placeholder="Filter by For Month (YYYY-MM-DD)" value={filters.for_month} onChange={(e) => setFilters({ ...filters, for_month: e.target.value })} className="w-full" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Invoice ID</label>
                <Input placeholder="Filter by Invoice ID" value={filters.invoice_id} onChange={(e) => setFilters({ ...filters, invoice_id: e.target.value })} className="w-full" />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <Button variant="outline" size="sm" onClick={() => setFilters({ payment_id: "", tenant_name: "", apartment_number: "", property_name: "", payment_date: "", for_month: "", invoice_id: "" })}>
                Clear Filters
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      <div className="rounded-md border shadow-lg overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="whitespace-nowrap"
                    onClick={header.column.getToggleSortingHandler()}
                    style={{ cursor: "pointer" }}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {{ asc: " ↑", desc: " ↓" }[header.column.getIsSorted() as string] ?? null}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-gray-50">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="whitespace-nowrap">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">No payments found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}