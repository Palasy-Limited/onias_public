"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
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

interface Invoice {
  invoice_id: number;
  tenancy_id: number;
  invoice_number: string;
  month_billed: string;
  date_billed: string;
  due_date: string;
  status: "Open" | "Closed" | "Overdue";
  balance_brought_forward: number | null;
  rent: number | null;
  water: number | null;
  power: number | null;
  internet: number | null;
  service_charge: number | null;
  deposit: number | null;
  damages: number | null;
  total_amount: number | null;
  amount_paid: number | null;
  balance_due: number | null;
  tenant_name?: string;
  apartment_number?: string;
  property_name?: string;
}

interface Tenancy {
  tenancy_id: number;
  apartment_id: number;
  tenant_id: number;
  start_date: string;
  end_date: string | null;
  rent_amount: number;
  deposit_amount: number;
  internet_plan_id: number | null;
  active: number;
  final_balance: number | null;
  tenant_name?: string;
  apartment_number?: string;
  property_id?: number;
  conservancy_fee?: number;
  water_rate_per_unit?: number;
  internet_price?: number;
}

const columns: ColumnDef<Invoice>[] = [
  { accessorKey: "invoice_number", header: "Invoice Number" },
  { accessorKey: "tenant_name", header: "Tenant Name", cell: ({ row }) => row.original.tenant_name ?? "Unknown" },
  { accessorKey: "apartment_number", header: "Apartment", cell: ({ row }) => row.original.apartment_number ?? "N/A" },
  { accessorKey: "property_name", header: "Property", cell: ({ row }) => row.original.property_name ?? "N/A" },
  { accessorKey: "month_billed", header: "Month Billed", cell: ({ row }) => new Date(row.original.month_billed).toLocaleDateString() },
  { accessorKey: "date_billed", header: "Date Billed", cell: ({ row }) => new Date(row.original.date_billed).toLocaleDateString() },
  { accessorKey: "due_date", header: "Due Date", cell: ({ row }) => new Date(row.original.due_date).toLocaleDateString() },
  { accessorKey: "status", header: "Status" },
  { accessorKey: "balance_brought_forward", header: "Balance B/F", cell: ({ row }) => Number(row.original.balance_brought_forward || 0).toFixed(2) },
  { accessorKey: "rent", header: "Rent", cell: ({ row }) => Number(row.original.rent || 0).toFixed(2) },
  { accessorKey: "water", header: "Water", cell: ({ row }) => Number(row.original.water || 0).toFixed(2) },
  { accessorKey: "power", header: "Power", cell: ({ row }) => Number(row.original.power || 0).toFixed(2) },
  { accessorKey: "internet", header: "Internet", cell: ({ row }) => Number(row.original.internet || 0).toFixed(2) },
  { accessorKey: "service_charge", header: "Service Charge", cell: ({ row }) => Number(row.original.service_charge || 0).toFixed(2) },
  { accessorKey: "deposit", header: "Deposit", cell: ({ row }) => Number(row.original.deposit || 0).toFixed(2) },
  { accessorKey: "damages", header: "Damages", cell: ({ row }) => Number(row.original.damages || 0).toFixed(2) },
  { accessorKey: "total_amount", header: "Total Amount", cell: ({ row }) => Number(row.original.total_amount || 0).toFixed(2) },
  { accessorKey: "amount_paid", header: "Amount Paid", cell: ({ row }) => Number(row.original.amount_paid || 0).toFixed(2) },
  { accessorKey: "balance_due", header: "Balance Due", cell: ({ row }) => Number(row.original.balance_due || 0).toFixed(2) },
];

const filterableColumns = ["invoice_number", "tenant_name", "apartment_number", "property_name", "month_billed", "status"];

export default function InvoicesTable() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [tenancies, setTenancies] = useState<Tenancy[]>([]);
  const [sorting, setSorting] = useState<SortingState>([{ id: "date_billed", desc: true }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [isFilterCardOpen, setIsFilterCardOpen] = useState(true);
  const [selectedTenancy, setSelectedTenancy] = useState<Tenancy | null>(null);
  const [monthBilled, setMonthBilled] = useState(new Date().toISOString().split("T")[0].slice(0, 7));

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [invoicesRes, tenanciesRes] = await Promise.all([fetch("/api/invoices"), fetch("/api/tenancies")]);
      if (!invoicesRes.ok) {
        const text = await invoicesRes.text();
        throw new Error(`Failed to fetch invoices: ${text}`);
      }
      if (!tenanciesRes.ok) {
        const text = await tenanciesRes.text();
        throw new Error(`Failed to fetch tenancies: ${text}`);
      }

      const invoicesData = await invoicesRes.json();
      const tenanciesData = await tenanciesRes.json();

      console.log("Raw invoicesData:", invoicesData);
      console.log("Raw tenanciesData:", tenanciesData);

      const invoicesArray = Array.isArray(invoicesData) ? invoicesData : invoicesData.data || [];
      if (!Array.isArray(invoicesArray)) {
        console.error("invoicesData is not an array:", invoicesArray);
        setInvoices([]);
      } else {
        const enrichedInvoices = await Promise.all(
          invoicesArray.map(async (invoice: Invoice) => {
            const tenancy = tenanciesData.find((t: Tenancy) => t.tenancy_id === invoice.tenancy_id);
            if (!tenancy) return { ...invoice };

            const apartmentRes = await fetch(`/api/apartments?apartment_id=${tenancy.apartment_id}`);
            const apartment = apartmentRes.ok ? (await apartmentRes.json())[0] : null;
            const tenantRes = await fetch(`/api/tenants?tenant_id=${tenancy.tenant_id}`);
            const tenant = tenantRes.ok ? (await tenantRes.json())[0] : null;
            return {
              ...invoice,
              tenant_name: tenant?.name,
              apartment_number: apartment?.apartment_number,
            };
          })
        );
        setInvoices(enrichedInvoices);
      }

      const enrichedTenancies = await Promise.all(
        tenanciesData.map(async (tenancy: Tenancy) => {
          const apartmentRes = await fetch(`/api/apartments?apartment_id=${tenancy.apartment_id}`);
          const apartment = apartmentRes.ok ? (await apartmentRes.json())[0] : null;
          const tenantRes = await fetch(`/api/tenants?tenant_id=${tenancy.tenant_id}`);
          const tenant = tenantRes.ok ? (await tenantRes.json())[0] : null;
          const propertyRes = apartment?.property_id ? await fetch(`/api/properties?property_id=${apartment.property_id}`) : null;
          const property = propertyRes && propertyRes.ok ? (await propertyRes.json())[0] : null;
          const internetRes = tenancy.internet_plan_id ? await fetch(`/api/internet_plans?plan_id=${tenancy.internet_plan_id}`) : null;
          const internetPlan = internetRes && internetRes.ok ? (await internetRes.json())[0] : null;

          return {
            ...tenancy,
            tenant_name: tenant?.name,
            apartment_number: apartment?.apartment_number,
            property_id: apartment?.property_id,
            conservancy_fee: property?.conservancy_fee,
            water_rate_per_unit: property?.water_rate_per_unit,
            internet_price: internetPlan?.price,
          };
        })
      );

      setTenancies(enrichedTenancies);
    } catch (error) {
      console.error("Error fetching data:", error);
      setInvoices([]);
      setTenancies([]);
    }
  };

  const handleCreateInvoice = async () => {
    if (!selectedTenancy || !monthBilled) {
      alert("Please select a tenancy and specify the month billed.");
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    const dueDate = new Date(monthBilled);
    dueDate.setMonth(dueDate.getMonth() + 1);
    const dueDateFormatted = dueDate.toISOString().split("T")[0];

    const invoiceData = {
      tenancy_id: selectedTenancy.tenancy_id,
      invoice_number: `INV${Date.now()}`,
      month_billed: `${monthBilled}-01`,
      date_billed: today,
      due_date: dueDateFormatted,
      status: "Open",
      balance_brought_forward: selectedTenancy.final_balance || 0,
      rent: selectedTenancy.rent_amount || 0,
      water: selectedTenancy.water_rate_per_unit || 0,
      power: 0,
      internet: selectedTenancy.internet_price || 0,
      service_charge: selectedTenancy.conservancy_fee || 0,
      deposit: 0,
      damages: 0,
      total_amount: (
        (selectedTenancy.final_balance || 0) +
        (selectedTenancy.rent_amount || 0) +
        (selectedTenancy.water_rate_per_unit || 0) +
        0 +
        (selectedTenancy.internet_price || 0) +
        (selectedTenancy.conservancy_fee || 0) +
        0 +
        0
      ).toFixed(2),
      amount_paid: 0,
      balance_due: (
        (selectedTenancy.final_balance || 0) +
        (selectedTenancy.rent_amount || 0) +
        (selectedTenancy.water_rate_per_unit || 0) +
        0 +
        (selectedTenancy.internet_price || 0) +
        (selectedTenancy.conservancy_fee || 0) +
        0 +
        0
      ).toFixed(2),
    };

    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invoiceData),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to create invoice: ${text}`);
      }
      const newInvoice = await res.json();
      setInvoices((prev) => [...prev, { ...invoiceData, invoice_id: newInvoice.invoice_id, tenant_name: selectedTenancy.tenant_name, apartment_number: selectedTenancy.apartment_number }]);
      setSelectedTenancy(null);
      setMonthBilled(new Date().toISOString().split("T")[0].slice(0, 7));
      alert("Invoice created successfully!");
    } catch (error) {
      console.error("Error creating invoice:", error);
      alert("Failed to create invoice.");
    }
  };

  const table = useReactTable({
    data: invoices,
    columns,
    state: { sorting, columnFilters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="w-full p-4 space-y-12">
      <Card className="w-full mx-auto shadow-lg border border-gray-200 rounded-lg">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-800">Create Invoice</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Tenancy</label>
              <Select
                value={selectedTenancy?.tenancy_id.toString() || ""}
                onValueChange={(value) => setSelectedTenancy(tenancies.find((t) => t.tenancy_id === Number(value)) || null)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Tenancy" />
                </SelectTrigger>
                <SelectContent>
                  {tenancies.length > 0 ? (
                    tenancies.map((tenancy) => (
                      <SelectItem key={tenancy.tenancy_id} value={tenancy.tenancy_id.toString()}>
                        {`${tenancy.tenant_name ?? "Unknown"} - ${tenancy.apartment_number ?? "N/A"}`}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>No tenancies available</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Month Billed</label>
              <Input type="month" value={monthBilled} onChange={(e) => setMonthBilled(e.target.value)} className="w-full" />
            </div>
          </div>
          {selectedTenancy && (
            <div className="mt-4 space-y-2">
              <div className="grid gap-2 sm:grid-cols-2">
                <div><label className="text-sm font-medium">Balance B/F</label><Input value={Number(selectedTenancy.final_balance || 0).toFixed(2)} readOnly className="bg-gray-100" /></div>
                <div><label className="text-sm font-medium">Rent</label><Input value={Number(selectedTenancy.rent_amount || 0).toFixed(2)} readOnly className="bg-gray-100" /></div>
                <div><label className="text-sm font-medium">Water</label><Input value={Number(selectedTenancy.water_rate_per_unit || 0).toFixed(2)} readOnly className="bg-gray-100" /></div>
                <div><label className="text-sm font-medium">Power</label><Input value="0.00" readOnly className="bg-gray-100" /></div>
                <div><label className="text-sm font-medium">Internet</label><Input value={Number(selectedTenancy.internet_price || 0).toFixed(2)} readOnly className="bg-gray-100" /></div>
                <div><label className="text-sm font-medium">Service Charge</label><Input value={Number(selectedTenancy.conservancy_fee || 0).toFixed(2)} readOnly className="bg-gray-100" /></div>
                <div><label className="text-sm font-medium">Deposit</label><Input value="0.00" readOnly className="bg-gray-100" /></div>
                <div><label className="text-sm font-medium">Damages</label><Input value="0.00" readOnly className="bg-gray-100" /></div>
                <div><label className="text-sm font-medium">Total Amount</label><Input value={((selectedTenancy.final_balance || 0) + (selectedTenancy.rent_amount || 0) + (selectedTenancy.water_rate_per_unit || 0) + 0 + (selectedTenancy.internet_price || 0) + (selectedTenancy.conservancy_fee || 0) + 0 + 0).toFixed(2)} readOnly className="bg-gray-100" /></div>
              </div>
            </div>
          )}
          <div className="flex justify-end mt-4">
            <Button onClick={handleCreateInvoice}>Create Invoice</Button>
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
              {table.getAllColumns().filter((col) => filterableColumns.includes(col.id)).map((column) => (
                <div key={column.id} className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">{column.id.replace("_", " ").toUpperCase()}</label>
                  {column.id === "status" ? (
                    <Select value={(column.getFilterValue() as string) || "all"} onValueChange={(val) => column.setFilterValue(val === "all" ? "" : val)}>
                      <SelectTrigger><SelectValue placeholder="Select Status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="Open">Open</SelectItem>
                        <SelectItem value="Closed">Closed</SelectItem>
                        <SelectItem value="Overdue">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      placeholder={`Filter by ${column.id.replace("_", " ")}`}
                      value={(column.getFilterValue() as string) ?? ""}
                      onChange={(e) => column.setFilterValue(e.target.value)}
                      className="w-full"
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-4">
              <Button variant="outline" size="sm" onClick={() => table.getAllColumns().forEach((col) => col.setFilterValue(""))}>
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
                <TableCell colSpan={columns.length} className="h-24 text-center">No invoices found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}