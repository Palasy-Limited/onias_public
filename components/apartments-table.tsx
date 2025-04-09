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

// Define the Apartment interface based on expected API data structure
interface Apartment {
  apartment_id: number;
  property_id: number;
  apartment_number: string;
  apartment_type: string;
  switch_name: string;
  port_number: number;
}

// Define a custom meta interface to type the table's meta object
interface CustomTableMeta {
  handleEdit: (apartment: Apartment) => void;
  handleDelete: (id: number, apartmentNumber: string) => void;
}

// Define table columns with filtering and actions
const columns: ColumnDef<Apartment>[] = [
  {
    accessorKey: "apartment_number",
    header: ({ column }) => (
      <div className="flex items-center gap-2">
        <span>Apartment Number:</span>
        <Input
          placeholder="Filter"
          value={(column.getFilterValue() as string) ?? ''}
          onChange={(e) => column.setFilterValue(e.target.value)}
          className="w-32 h-8 text-sm"
        />
      </div>
    ),
    cell: ({ row }) => <div>{row.original.apartment_number}</div>,
    filterFn: 'includesString',
  },
  {
    accessorKey: "property_id",
    header: ({ column }) => (
      <div className="flex items-center gap-2">
        <span>Property ID:</span>
        <Input
          placeholder="Filter"
          value={(column.getFilterValue() as string) ?? ''}
          onChange={(e) => column.setFilterValue(e.target.value)}
          className="w-32 h-8 text-sm"
        />
      </div>
    ),
    cell: ({ row }) => <div>{row.original.property_id}</div>,
    filterFn: 'includesString',
  },
  {
    accessorKey: "apartment_type",
    header: ({ column }) => (
      <div className="flex items-center gap-2">
        <span>Type:</span>
        <Input
          placeholder="Filter"
          value={(column.getFilterValue() as string) ?? ''}
          onChange={(e) => column.setFilterValue(e.target.value)}
          className="w-32 h-8 text-sm"
        />
      </div>
    ),
    cell: ({ row }) => <div>{row.original.apartment_type}</div>,
    filterFn: 'includesString',
  },
  {
    accessorKey: "switch_name",
    header: ({ column }) => (
      <div className="flex items-center gap-2">
        <span>Switch Name:</span>
        <Input
          placeholder="Filter"
          value={(column.getFilterValue() as string) ?? ''}
          onChange={(e) => column.setFilterValue(e.target.value)}
          className="w-32 h-8 text-sm"
        />
      </div>
    ),
    cell: ({ row }) => <div>{row.original.switch_name}</div>,
    filterFn: 'includesString',
  },
  {
    accessorKey: "port_number",
    header: ({ column }) => (
      <div className="flex items-center gap-2">
        <span>Port Number:</span>
        <Input
          placeholder="Filter"
          value={(column.getFilterValue() as string) ?? ''}
          onChange={(e) => column.setFilterValue(e.target.value)}
          className="w-32 h-8 text-sm"
        />
      </div>
    ),
    cell: ({ row }) => <div>{row.original.port_number}</div>,
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
              onClick={() => meta.handleDelete(row.original.apartment_id, row.original.apartment_number)}
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
export default function ApartmentsTable() {
  // State declarations with TypeScript types
  const [apartments, setApartments] = useState<Apartment[]>([])
  const [form, setForm] = useState({
    property_id: '',
    apartment_number: '',
    apartment_type: '',
    switch_name: '',
    port_number: '',
  })
  const [editingId, setEditingId] = useState<number | null>(null)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 25,
  })

  // Fetch apartments on component mount
  useEffect(() => {
    fetchApartments()
  }, [])

  // Function to fetch apartment data from API
  const fetchApartments = async () => {
    const res = await fetch('/api/apartments')
    const data = await res.json()
    const transformedData = Array.isArray(data) ? data.map((item: any) => ({
      apartment_id: item.apartment_id,
      property_id: item.property_id,
      apartment_number: item.apartment_number,
      apartment_type: item.apartment_type,
      switch_name: item.switch_name,
      port_number: item.port_number,
    })) : [data]
    setApartments(transformedData)
  }

  // Handle form submission for adding or updating apartments
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const method = editingId ? 'PUT' : 'POST'
    const url = editingId ? `/api/apartments/${editingId}` : '/api/apartments'
    const payload = {
      ...form,
      property_id: parseInt(form.property_id),
      port_number: parseInt(form.port_number),
    }
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    resetForm()
    fetchApartments()
  }

  // Populate form with apartment data for editing
  const handleEdit = (apartment: Apartment) => {
    setForm({
      property_id: apartment.property_id.toString(),
      apartment_number: apartment.apartment_number || '',
      apartment_type: apartment.apartment_type || '',
      switch_name: apartment.switch_name || '',
      port_number: apartment.port_number.toString(),
    })
    setEditingId(apartment.apartment_id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Delete an apartment with confirmation
  const handleDelete = async (id: number, apartmentNumber: string) => {
    if (window.confirm(`Are you sure you want to delete apartment ${apartmentNumber}?`)) {
      await fetch(`/api/apartments/${id}`, { method: 'DELETE' })
      fetchApartments()
    }
  }

  // Reset form to initial state
  const resetForm = () => {
    setForm({
      property_id: '',
      apartment_number: '',
      apartment_type: '',
      switch_name: '',
      port_number: '',
    })
    setEditingId(null)
  }

  // Initialize the table with react-table
  const table = useReactTable({
    data: apartments,
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
      {/* Form Card for Adding/Editing Apartments */}
      <Card className="w-full mx-auto">
        <CardHeader>
          <CardTitle>{editingId ? 'Edit Apartment' : 'Add New Apartment'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              <Input
                placeholder="Property ID"
                value={form.property_id}
                onChange={(e) => setForm({...form, property_id: e.target.value})}
                className="w-full"
                type="number"
              />
              <Input
                placeholder="Apartment Number"
                value={form.apartment_number}
                onChange={(e) => setForm({...form, apartment_number: e.target.value})}
                className="w-full"
              />
              <Input
                placeholder="Apartment Type"
                value={form.apartment_type}
                onChange={(e) => setForm({...form, apartment_type: e.target.value})}
                className="w-full"
              />
              <Input
                placeholder="Switch Name"
                value={form.switch_name}
                onChange={(e) => setForm({...form, switch_name: e.target.value})}
                className="w-full"
              />
              <Input
                placeholder="Port Number"
                value={form.port_number}
                onChange={(e) => setForm({...form, port_number: e.target.value})}
                className="w-full"
                type="number"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="submit">{editingId ? 'Update' : 'Add'} Apartment</Button>
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
                  No apartments found.
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