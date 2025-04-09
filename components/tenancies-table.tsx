"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconDotsVertical } from "@tabler/icons-react";

// Define interfaces for data structures
interface Tenant {
  tenant_id: number;
  name: string;
  id_passport_number: string | null;
}

interface Apartment {
  apartment_id: number;
  property_id: number;
  apartment_number: string;
}

interface Property {
  property_id: number;
  name: string;
}

interface Tenancy {
  tenancy_id: number;
  apartment_id: number;
  tenant_id: number;
  start_date: string;
  end_date: string | null;
  rent_amount: string;
  deposit_amount: string | null;
  internet_plan_id: number;
  active: number;
  final_balance: string;
  tenant_name?: string;
  apartment_number?: string;
  property_name?: string;
}

// Define a custom meta interface to type the table's meta object
interface CustomTableMeta {
  handleEdit: (tenancy: Tenancy) => void;
  handleDelete: (id: number, tenantName: string | undefined) => void;
}

// Define table columns with filtering and actions
const columns: ColumnDef<Tenancy>[] = [
  {
    accessorKey: "tenant_name",
    header: () => <span>Tenant</span>,
    cell: ({ row }) => <div>{row.original.tenant_name}</div>,
    filterFn: "includesString",
  },
  {
    accessorKey: "apartment_number",
    header: () => <span>Apartment</span>,
    cell: ({ row }) => <div>{row.original.apartment_number}</div>,
    filterFn: "includesString",
  },
  {
    accessorKey: "property_name",
    header: () => <span>Property</span>,
    cell: ({ row }) => <div>{row.original.property_name}</div>,
    filterFn: "includesString",
  },
  {
    accessorKey: "start_date",
    header: () => <span>Start Date</span>,
    cell: ({ row }) => (
      <div>{new Date(row.original.start_date).toLocaleDateString()}</div>
    ),
    filterFn: "includesString",
  },
  {
    accessorKey: "end_date",
    header: () => <span>End Date</span>,
    cell: ({ row }) => (
      <div>
        {row.original.end_date
          ? new Date(row.original.end_date).toLocaleDateString()
          : "-"}
      </div>
    ),
    filterFn: "includesString",
  },
  {
    accessorKey: "rent_amount",
    header: () => <span>Rent Amount</span>,
    cell: ({ row }) => <div>{row.original.rent_amount}</div>,
    filterFn: "includesString",
  },
  {
    accessorKey: "deposit_amount",
    header: () => <span>Deposit Amount</span>,
    cell: ({ row }) => <div>{row.original.deposit_amount || "-"}</div>,
    filterFn: "includesString",
  },
  {
    accessorKey: "active",
    header: () => <span>Tenancy Status</span>,
    cell: ({ row }) => (
      <div
        className={
          row.original.active ? "font-bold text-green-600" : "font-bold text-red-600"
        }
      >
        {row.original.active ? "Active" : "Inactive"}
      </div>
    ),
    filterFn: "equalsString",
  },
  {
    id: "months_active",
    header: () => <span>Months Active</span>,
    cell: ({ row }) => {
      const start = new Date(row.original.start_date);
      const end = row.original.end_date
        ? new Date(row.original.end_date)
        : new Date();
      const months = Math.floor(
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30)
      );
      return <div>{months}</div>;
    },
  },
  {
    id: "actions",
    header: () => <span>Actions</span>,
    cell: ({ row, table }) => {
      const meta = table.options.meta as CustomTableMeta;
      return (
        <div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <IconDotsVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => meta.handleEdit(row.original)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600"
                onClick={() =>
                  meta.handleDelete(row.original.tenancy_id, row.original.tenant_name)
                }
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];

// Main component definition
export default function TenanciesTable() {
  // State declarations with TypeScript types
  const [tenancies, setTenancies] = useState<Tenancy[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [form, setForm] = useState({
    apartment_id: "",
    tenant_id: "",
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
    rent_amount: "",
    deposit_amount: "",
    internet_plan_id: "1",
    active: "1",
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingDetails, setEditingDetails] = useState<{
    tenant_name: string;
    property_name: string;
    apartment_number: string;
  } | null>(null);
  const [tenantFilter, setTenantFilter] = useState("");
  const [apartmentFilter, setApartmentFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([
    { id: "start_date", desc: true },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 25,
  });

  // Fetch all data on component mount
  useEffect(() => {
    fetchAllData();
  }, []);

  // Function to fetch all required data from API
  const fetchAllData = async () => {
    const [tenanciesRes, tenantsRes, apartmentsRes, propertiesRes] = await Promise.all([
      fetch("/api/tenancies"),
      fetch("/api/tenants"),
      fetch("/api/apartments"),
      fetch("/api/properties"),
    ]);
    const tenanciesData = await tenanciesRes.json();
    const tenantsData = await tenantsRes.json();
    const apartmentsData = await apartmentsRes.json();
    const propertiesData = await propertiesRes.json();

    const transformedTenancies = (Array.isArray(tenanciesData) ? tenanciesData : [tenanciesData]).map((tenancy: any) => {
      const tenant = tenantsData.find((t: Tenant) => t.tenant_id === tenancy.tenant_id);
      const apartment = apartmentsData.find((a: Apartment) => a.apartment_id === tenancy.apartment_id);
      const property = propertiesData.find((p: Property) => p.property_id === apartment?.property_id);
      return {
        tenancy_id: tenancy.tenancy_id,
        apartment_id: tenancy.apartment_id,
        tenant_id: tenancy.tenant_id,
        start_date: tenancy.start_date,
        end_date: tenancy.end_date,
        rent_amount: tenancy.rent_amount,
        deposit_amount: tenancy.deposit_amount,
        internet_plan_id: tenancy.internet_plan_id,
        active: tenancy.active,
        final_balance: tenancy.final_balance,
        tenant_name: tenant?.name || "Unknown",
        apartment_number: apartment?.apartment_number || "Unknown",
        property_name: property?.name || "Unknown",
      };
    });
    setTenancies(transformedTenancies);
    setTenants(Array.isArray(tenantsData) ? tenantsData : [tenantsData]);
    setApartments(Array.isArray(apartmentsData) ? apartmentsData : [apartmentsData]);
    setProperties(Array.isArray(propertiesData) ? propertiesData : [propertiesData]);
  };

  // Handle form submission for adding or updating tenancies
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingId ? "PUT" : "POST";
    const url = editingId ? `/api/tenancies/${editingId}` : "/api/tenancies";
    const payload = {
      ...form,
      apartment_id: parseInt(form.apartment_id),
      tenant_id: parseInt(form.tenant_id),
      internet_plan_id: parseInt(form.internet_plan_id),
      active: parseInt(form.active),
    };
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    resetForm();
    fetchAllData();
  };

  // Populate form with tenancy data for editing
  const handleEdit = (tenancy: Tenancy) => {
    setForm({
      apartment_id: tenancy.apartment_id.toString(),
      tenant_id: tenancy.tenant_id.toString(),
      start_date: tenancy.start_date.split("T")[0],
      end_date: tenancy.end_date ? tenancy.end_date.split("T")[0] : "",
      rent_amount: tenancy.rent_amount,
      deposit_amount: tenancy.deposit_amount || "",
      internet_plan_id: tenancy.internet_plan_id.toString(),
      active: tenancy.active.toString(),
    });
    setEditingId(tenancy.tenancy_id);
    setEditingDetails({
      tenant_name: tenancy.tenant_name || "Unknown",
      property_name: tenancy.property_name || "Unknown",
      apartment_number: tenancy.apartment_number || "Unknown",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Delete a tenancy with confirmation
  const handleDelete = async (id: number, tenantName: string | undefined) => {
    if (window.confirm(`Are you sure you want to delete tenancy for ${tenantName || "Unknown"}?`)) {
      await fetch(`/api/tenancies/${id}`, { method: "DELETE" });
      fetchAllData();
    }
  };

  // Reset form to initial state
  const resetForm = () => {
    setForm({
      apartment_id: "",
      tenant_id: "",
      start_date: new Date().toISOString().split("T")[0],
      end_date: "",
      rent_amount: "",
      deposit_amount: "",
      internet_plan_id: "1",
      active: "1",
    });
    setTenantFilter("");
    setApartmentFilter("");
    setEditingId(null);
    setEditingDetails(null);
  };

  // Filter tenants and apartments based on search inputs
  const filteredTenants = tenants.filter((tenant) =>
    `${tenant.name} - ${tenant.id_passport_number || "No ID"}`
      .toLowerCase()
      .includes(tenantFilter.toLowerCase())
  );

  const filteredApartments = apartments.filter((apartment) => {
    const property = properties.find((p) => p.property_id === apartment.property_id);
    const optionText = `${property?.name || "Unknown"} - ${apartment.apartment_number}`;
    return optionText.toLowerCase().includes(apartmentFilter.toLowerCase());
  });

  // Initialize the table with react-table
  const table = useReactTable({
    data: tenancies,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    meta: {
      handleEdit,
      handleDelete,
    },
  });

  // Render the component
  return (
    <div className="w-full p-4 space-y-12">
      {/* Form Card for Adding/Editing Tenancies */}
      <Card className="w-full mx-auto shadow-lg border border-gray-200 rounded-lg">
        <CardHeader className="border-b border-gray-200">
          <CardTitle className="text-lg font-semibold text-gray-800">
            {editingId
              ? `Edit Tenancy: ${editingDetails?.tenant_name}, ${editingDetails?.apartment_number}`
              : "Add New Tenancy"}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Tenant</label>
                <div className="relative">
                  <Input
                    placeholder="Filter Tenants"
                    value={tenantFilter}
                    onChange={(e) => setTenantFilter(e.target.value)}
                    className="w-full mb-2"
                  />
                  <Select
                    value={form.tenant_id}
                    onValueChange={(value) => setForm({ ...form, tenant_id: value })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Tenant" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredTenants.map((tenant) => (
                        <SelectItem key={tenant.tenant_id} value={tenant.tenant_id.toString()}>
                          {`${tenant.name} - ${tenant.id_passport_number || "No ID"}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Apartment</label>
                <div className="relative">
                  <Input
                    placeholder="Filter Apartments"
                    value={apartmentFilter}
                    onChange={(e) => setApartmentFilter(e.target.value)}
                    className="w-full mb-2"
                  />
                  <Select
                    value={form.apartment_id}
                    onValueChange={(value) => setForm({ ...form, apartment_id: value })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Apartment" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredApartments.map((apartment) => {
                        const property = properties.find(
                          (p) => p.property_id === apartment.property_id
                        );
                        return (
                          <SelectItem
                            key={apartment.apartment_id}
                            value={apartment.apartment_id.toString()}
                          >
                            {`${property?.name || "Unknown"} - ${apartment.apartment_number}`}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Start Date</label>
                <Input
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  className="w-full"
                  type="date"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">End Date</label>
                <Input
                  value={form.end_date}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                  className="w-full"
                  type="date"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Rent Amount</label>
                <Input
                  value={form.rent_amount}
                  onChange={(e) => setForm({ ...form, rent_amount: e.target.value })}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Deposit Amount</label>
                <Input
                  value={form.deposit_amount}
                  onChange={(e) => setForm({ ...form, deposit_amount: e.target.value })}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Internet Plan ID</label>
                <Input
                  value={form.internet_plan_id}
                  onChange={(e) => setForm({ ...form, internet_plan_id: e.target.value })}
                  className="w-full"
                  type="number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tenancy Status</label>
                <Select
                  value={form.active}
                  onValueChange={(value) => setForm({ ...form, active: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Active</SelectItem>
                    <SelectItem value="0">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="submit">{editingId ? "Update" : "Add"} Tenancy</Button>
              {editingId && (
                <Button variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Filters Card */}
      <Card className="w-full mx-auto shadow-lg border border-gray-200 rounded-lg">
        <CardHeader className="border-b border-gray-200">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-semibold text-gray-800">Filters</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                table.getAllColumns().forEach((column) => column.setFilterValue(""));
              }}
              className="text-gray-600 hover:text-gray-800 border-gray-300"
            >
              Clear Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {table
              .getAllColumns()
              .filter((col) => col.id !== "actions" && col.id !== "months_active")
              .map((column, index) => (
                <div key={column.id} className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    {[
                      "Tenant",
                      "Apartment",
                      "Property",
                      "Start Date",
                      "End Date",
                      "Rent Amount",
                      "Deposit Amount",
                      "Tenancy Status",
                    ][index]}
                  </label>
                  {column.id === "active" ? (
                    <Select
                      value={(column.getFilterValue() as string) ?? ""}
                      onValueChange={(value) => column.setFilterValue(value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Filter by Tenancy Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Active</SelectItem>
                        <SelectItem value="0">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      placeholder={`Filter by ${
                        [
                          "Tenant",
                          "Apartment",
                          "Property",
                          "Start Date",
                          "End Date",
                          "Rent Amount",
                          "Deposit Amount",
                          "Tenancy Status",
                        ][index]
                      }`}
                      value={(column.getFilterValue() as string) ?? ""}
                      onChange={(e) => column.setFilterValue(e.target.value)}
                      className="w-full h-10 text-sm border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400"
                    />
                  )}
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Table with Shadow */}
      <div className="rounded-md border shadow-lg">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={
                    row.original.active
                      ? "hover:bg-gray-50"
                      : "bg-red-100 hover:bg-red-200 transition-colors"
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No tenancies found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 sm:space-x-2 py-4">
        <div className="flex items-center space-x-2">
          <p className="text-sm text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </p>
          <Select
            value={table.getState().pagination.pageSize.toString()}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Rows per page" />
            </SelectTrigger>
            <SelectContent>
              {[5, 10, 20, 25, 30, 50, 100].map((pageSize) => (
                <SelectItem key={pageSize} value={pageSize.toString()}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            First
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            Last
          </Button>
        </div>
      </div>
    </div>
  );
}