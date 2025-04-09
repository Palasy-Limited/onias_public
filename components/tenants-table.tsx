"use client"

import * as React from "react"
import { useEffect, useState } from 'react'
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
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { IconDotsVertical } from "@tabler/icons-react"

// Define the Tenant interface based on expected API data structure
interface Tenant {
  tenant_id: number;
  name: string;
  id_passport_number: string | null;
  contact: string | null;
  email: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
}

// Define a custom meta interface to type the table's meta object
interface CustomTableMeta {
  handleEdit: (tenant: Tenant) => void;
  handleDelete: (id: number, name: string) => void;
}

// Define table columns with filtering and actions
const columns: ColumnDef<Tenant>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <div className="flex items-center gap-2">
        <span>Name:</span>
        <Input
          placeholder="Filter"
          value={(column.getFilterValue() as string) ?? ''}
          onChange={(e) => column.setFilterValue(e.target.value)}
          className="w-32 h-8 text-sm"
        />
      </div>
    ),
    cell: ({ row }) => <div>{row.original.name}</div>,
    filterFn: 'includesString',
  },
  {
    accessorKey: "id_passport_number",
    header: ({ column }) => (
      <div className="flex items-center gap-2">
        <span>ID/Passport:</span>
        <Input
          placeholder="Filter"
          value={(column.getFilterValue() as string) ?? ''}
          onChange={(e) => column.setFilterValue(e.target.value)}
          className="w-32 h-8 text-sm"
        />
      </div>
    ),
    cell: ({ row }) => <div>{row.original.id_passport_number || '-'}</div>,
    filterFn: 'includesString',
  },
  {
    accessorKey: "contact",
    header: ({ column }) => (
      <div className="flex items-center gap-2">
        <span>Contact:</span>
        <Input
          placeholder="Filter"
          value={(column.getFilterValue() as string) ?? ''}
          onChange={(e) => column.setFilterValue(e.target.value)}
          className="w-32 h-8 text-sm"
        />
      </div>
    ),
    cell: ({ row }) => <div>{row.original.contact || '-'}</div>,
    filterFn: 'includesString',
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <div className="flex items-center gap-2">
        <span>Email:</span>
        <Input
          placeholder="Filter"
          value={(column.getFilterValue() as string) ?? ''}
          onChange={(e) => column.setFilterValue(e.target.value)}
          className="w-32 h-8 text-sm"
        />
      </div>
    ),
    cell: ({ row }) => <div>{row.original.email || '-'}</div>,
    filterFn: 'includesString',
  },
  {
    accessorKey: "emergency_contact_name",
    header: ({ column }) => (
      <div className="flex items-center gap-2">
        <span>Emergency Contact:</span>
        <Input
          placeholder="Filter"
          value={(column.getFilterValue() as string) ?? ''}
          onChange={(e) => column.setFilterValue(e.target.value)}
          className="w-32 h-8 text-sm"
        />
      </div>
    ),
    cell: ({ row }) => <div>{row.original.emergency_contact_name || '-'}</div>,
    filterFn: 'includesString',
  },
  {
    accessorKey: "emergency_contact_phone",
    header: ({ column }) => (
      <div className="flex items-center gap-2">
        <span>Emergency Phone:</span>
        <Input
          placeholder="Filter"
          value={(column.getFilterValue() as string) ?? ''}
          onChange={(e) => column.setFilterValue(e.target.value)}
          className="w-32 h-8 text-sm"
        />
      </div>
    ),
    cell: ({ row }) => <div>{row.original.emergency_contact_phone || '-'}</div>,
    filterFn: 'includesString',
  },
  {
    id: "actions",
    header: () => <span>Actions</span>,
    cell: ({ row, table }) => {
      // Type assertion to ensure meta includes handleEdit and handleDelete
      const meta = table.options.meta as CustomTableMeta;
      return (
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
              onClick={() => meta.handleDelete(row.original.tenant_id, row.original.name)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
]

// Main component definition
export default function TenantsTable() {
  // State declarations with TypeScript types
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [form, setForm] = useState({
    name: '',
    id_passport_number: '',
    contact: '',
    email: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
  })
  const [editingId, setEditingId] = useState<number | null>(null)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 25,
  })

  // Fetch tenants on component mount
  useEffect(() => {
    fetchTenants()
  }, [])

  // Function to fetch tenant data from API
  const fetchTenants = async () => {
    const res = await fetch('/api/tenants')
    const data = await res.json()
    const transformedData = Array.isArray(data) ? data.map((item: any) => ({
      tenant_id: item.tenant_id,
      name: item.name,
      id_passport_number: item.id_passport_number,
      contact: item.contact,
      email: item.email,
      emergency_contact_name: item.emergency_contact_name,
      emergency_contact_phone: item.emergency_contact_phone,
    })) : [data]
    setTenants(transformedData)
  }

  // Handle form submission for adding or updating tenants
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const method = editingId ? 'PUT' : 'POST'
    const url = editingId ? `/api/tenants/${editingId}` : '/api/tenants'
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    resetForm()
    fetchTenants()
  }

  // Populate form with tenant data for editing
  const handleEdit = (tenant: Tenant) => {
    setForm({
      name: tenant.name || '',
      id_passport_number: tenant.id_passport_number || '',
      contact: tenant.contact || '',
      email: tenant.email || '',
      emergency_contact_name: tenant.emergency_contact_name || '',
      emergency_contact_phone: tenant.emergency_contact_phone || '',
    })
    setEditingId(tenant.tenant_id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Delete a tenant with confirmation
  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete tenant ${name}?`)) {
      await fetch(`/api/tenants/${id}`, { method: 'DELETE' })
      fetchTenants()
    }
  }

  // Reset form to initial state
  const resetForm = () => {
    setForm({
      name: '',
      id_passport_number: '',
      contact: '',
      email: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
    })
    setEditingId(null)
  }

  // Initialize the table with react-table
  const table = useReactTable({
    data: tenants,
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
  })

  // Render the component
  return (
    <div className="w-full p-4 space-y-12">
      {/* Form Card for Adding/Editing Tenants */}
      <Card className="w-full mx-auto">
        <CardHeader>
          <CardTitle>{editingId ? 'Edit Tenant' : 'Add New Tenant'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              <Input
                placeholder="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full"
              />
              <Input
                placeholder="ID/Passport"
                value={form.id_passport_number}
                onChange={(e) => setForm({ ...form, id_passport_number: e.target.value })}
                className="w-full"
              />
              <Input
                placeholder="Contact"
                value={form.contact}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
                className="w-full"
              />
              <Input
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full"
              />
              <Input
                placeholder="Emergency Contact Name"
                value={form.emergency_contact_name}
                onChange={(e) => setForm({ ...form, emergency_contact_name: e.target.value })}
                className="w-full"
              />
              <Input
                placeholder="Emergency Contact Phone"
                value={form.emergency_contact_phone}
                onChange={(e) => setForm({ ...form, emergency_contact_phone: e.target.value })}
                className="w-full"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="submit">{editingId ? 'Update' : 'Add'} Tenant</Button>
              {editingId && <Button variant="outline" onClick={resetForm}>Cancel</Button>}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Table with Filters */}
      <div className="rounded-md border">
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
                <TableRow key={row.id}>
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
                  No tenants found.
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
              {[5, 10, 20, 25, 30, 50].map((pageSize) => (
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
  )
}