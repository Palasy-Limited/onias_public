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

// Define the Property interface based on expected API data structure
interface Property {
  property_id: number;
  name: string;
  address: string;
  description: string | null;
  conservancy_fee: string; // Keeping as string to match API
}

// Define a custom meta interface to type the table's meta object
interface CustomTableMeta {
  handleEdit: (property: Property) => void;
  handleDelete: (id: number, name: string) => void;
}

// Define table columns with filtering and actions
const columns: ColumnDef<Property>[] = [
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
    accessorKey: "address",
    header: ({ column }) => (
      <div className="flex items-center gap-2">
        <span>Address:</span>
        <Input
          placeholder="Filter"
          value={(column.getFilterValue() as string) ?? ''}
          onChange={(e) => column.setFilterValue(e.target.value)}
          className="w-32 h-8 text-sm"
        />
      </div>
    ),
    cell: ({ row }) => <div>{row.original.address}</div>,
    filterFn: 'includesString',
  },
  {
    accessorKey: "description",
    header: ({ column }) => (
      <div className="flex items-center gap-2">
        <span>Description:</span>
        <Input
          placeholder="Filter"
          value={(column.getFilterValue() as string) ?? ''}
          onChange={(e) => column.setFilterValue(e.target.value)}
          className="w-32 h-8 text-sm"
        />
      </div>
    ),
    cell: ({ row }) => <div>{row.original.description || '-'}</div>,
    filterFn: 'includesString',
  },
  {
    accessorKey: "conservancy_fee",
    header: ({ column }) => (
      <div className="flex items-center gap-2">
        <span>Conservancy Fee:</span>
        <Input
          placeholder="Filter"
          value={(column.getFilterValue() as string) ?? ''}
          onChange={(e) => column.setFilterValue(e.target.value)}
          className="w-32 h-8 text-sm"
        />
      </div>
    ),
    cell: ({ row }) => <div>{row.original.conservancy_fee}</div>,
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
              onClick={() => meta.handleDelete(row.original.property_id, row.original.name)}
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
export default function PropertiesTable() {
  // State declarations with TypeScript types
  const [properties, setProperties] = useState<Property[]>([])
  const [form, setForm] = useState({
    name: '',
    address: '',
    description: '',
    conservancy_fee: '',
  })
  const [editingId, setEditingId] = useState<number | null>(null)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 25,
  })

  // Fetch properties on component mount
  useEffect(() => {
    fetchProperties()
  }, [])

  // Function to fetch property data from API
  const fetchProperties = async () => {
    const res = await fetch('/api/properties')
    const data = await res.json()
    const transformedData = Array.isArray(data) ? data.map((item: any) => ({
      property_id: item.property_id,
      name: item.name,
      address: item.address,
      description: item.description,
      conservancy_fee: item.conservancy_fee,
    })) : [data]
    setProperties(transformedData)
  }

  // Handle form submission for adding or updating properties
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const method = editingId ? 'PUT' : 'POST'
    const url = editingId ? `/api/properties/${editingId}` : '/api/properties'
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    resetForm()
    fetchProperties()
  }

  // Populate form with property data for editing
  const handleEdit = (property: Property) => {
    setForm({
      name: property.name || '',
      address: property.address || '',
      description: property.description || '',
      conservancy_fee: property.conservancy_fee || '',
    })
    setEditingId(property.property_id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Delete a property with confirmation
  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete property ${name}?`)) {
      await fetch(`/api/properties/${id}`, { method: 'DELETE' })
      fetchProperties()
    }
  }

  // Reset form to initial state
  const resetForm = () => {
    setForm({
      name: '',
      address: '',
      description: '',
      conservancy_fee: '',
    })
    setEditingId(null)
  }

  // Initialize the table with react-table
  const table = useReactTable({
    data: properties,
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
      {/* Form Card for Adding/Editing Properties */}
      <Card className="w-full mx-auto">
        <CardHeader>
          <CardTitle>{editingId ? 'Edit Property' : 'Add New Property'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              <Input
                placeholder="Name"
                value={form.name}
                onChange={(e) => setForm({...form, name: e.target.value})}
                className="w-full"
              />
              <Input
                placeholder="Address"
                value={form.address}
                onChange={(e) => setForm({...form, address: e.target.value})}
                className="w-full"
              />
              <Input
                placeholder="Description"
                value={form.description}
                onChange={(e) => setForm({...form, description: e.target.value})}
                className="w-full"
              />
              <Input
                placeholder="Conservancy Fee"
                value={form.conservancy_fee}
                onChange={(e) => setForm({...form, conservancy_fee: e.target.value})}
                className="w-full"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="submit">{editingId ? 'Update' : 'Add'} Property</Button>
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
                  No properties found.
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