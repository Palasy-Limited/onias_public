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
import { IconDotsVertical, IconChevronDown, IconChevronUp, IconPlus, IconTrash } from "@tabler/icons-react";

// Define interfaces
interface Apartment {
  apartment_id: number;
  property_id: number;
  apartment_number: string;
  apartment_type: string;
  switch_name: string;
  port_number: number;
}

interface Property {
  property_id: number;
  name: string;
}

interface WaterMeter {
  water_meter_id: number;
  apartment_id: number;
  meter_number: string;
}

interface WaterReading {
  reading_id: number;
  water_meter_id: number;
  reading_date: string;
  water_meter_reading: number;
  meter_number?: string;
  apartment_number?: string;
  property_name?: string;
  apartment_id?: number;
  last_6_months_consumption?: { [month: string]: number };
}

interface CustomTableMeta {
  handleEdit: (reading: WaterReading) => void;
  handleDelete: (id: number, apartmentNumber: string | undefined) => void;
}

interface ReadingFormEntry {
  apartment_id: string;
  water_meter_id: string;
  water_meter_reading: string;
}

// Helper function to get month abbreviation
const getMonthAbbr = (month: number): string => {
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return months[month];
};

// Generate columns for the last 6 months dynamically (latest first)
const getLast6MonthsColumns = (): ColumnDef<WaterReading>[] => {
  const today = new Date();
  const months: ColumnDef<WaterReading>[] = [];
  for (let i = 0; i < 6; i++) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const monthLabel = `${getMonthAbbr(date.getMonth())} ${date.getFullYear()}`;
    months.push({
      id: `consumption_${monthKey}`,
      header: () => <span>{monthLabel}</span>,
      cell: ({ row }) => (
        <div>
          {row.original.last_6_months_consumption?.[monthKey]?.toFixed(2) || "0.00"}
        </div>
      ),
      filterFn: "includesString",
    });
  }
  return months;
};

// Define static columns
const staticColumns: ColumnDef<WaterReading>[] = [
  {
    accessorKey: "property_name",
    header: () => <span>Property</span>,
    cell: ({ row }) => <div>{row.original.property_name}</div>,
    filterFn: "includesString",
  },
  {
    accessorKey: "apartment_number",
    header: () => <span>Apartment</span>,
    cell: ({ row }) => <div>{row.original.apartment_number}</div>,
    filterFn: "includesString",
  },
  {
    accessorKey: "meter_number",
    header: () => <span>Meter Number</span>,
    cell: ({ row }) => <div>{row.original.meter_number}</div>,
    filterFn: "includesString",
  },
  {
    accessorKey: "reading_date",
    header: () => <span>Reading Date</span>,
    cell: ({ row }) => (
      <div>{new Date(row.original.reading_date).toLocaleDateString()}</div>
    ),
    filterFn: "includesString",
  },
  {
    accessorKey: "water_meter_reading",
    header: () => <span>Units (m³)</span>,
    cell: ({ row }) => <div>{row.original.water_meter_reading}</div>,
    filterFn: "includesString",
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
                  meta.handleDelete(row.original.reading_id, row.original.apartment_number)
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

// Combine static and dynamic columns
const columns: ColumnDef<WaterReading>[] = [...staticColumns, ...getLast6MonthsColumns()];

// Helper function to get the most recent reading per apartment
const getUniqueApartmentReadings = (readings: WaterReading[]): WaterReading[] => {
  const latestReadingsMap = new Map<number, WaterReading>();

  readings.forEach((reading) => {
    const apartmentId = reading.apartment_id;
    if (!apartmentId) return;

    const existingReading = latestReadingsMap.get(apartmentId);
    if (!existingReading || new Date(reading.reading_date) > new Date(existingReading.reading_date)) {
      latestReadingsMap.set(apartmentId, reading);
    }
  });

  return Array.from(latestReadingsMap.values());
};

export default function WaterTable() {
  const [readings, setReadings] = useState<WaterReading[]>([]);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [waterMeters, setWaterMeters] = useState<WaterMeter[]>([]);
  const [consumptionData, setConsumptionData] = useState<{
    [key: number]: { [month: string]: number };
  }>({});
  const [formEntries, setFormEntries] = useState<ReadingFormEntry[]>([
    { apartment_id: "", water_meter_id: "", water_meter_reading: "" },
  ]);
  const [readingDate, setReadingDate] = useState(new Date().toISOString().split("T")[0]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingDetails, setEditingDetails] = useState<{
    apartment_number: string;
    property_name: string;
    meter_number: string;
  } | null>(null);
  const [apartmentFilter, setApartmentFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "reading_date", desc: true }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 });
  const [isAddCardOpen, setIsAddCardOpen] = useState(true);
  const [isFilterCardOpen, setIsFilterCardOpen] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [readingsRes, apartmentsRes, propertiesRes, waterMetersRes, consumptionRes] = await Promise.all([
        fetch("/api/water/readings"),
        fetch("/api/apartments"),
        fetch("/api/properties"),
        fetch("/api/water/meters"),
        fetch("/api/water/usage/meter-monthly"),
      ]);

      const checkResponse = async (res: Response, endpoint: string) => {
        if (!res.ok) {
          const text = await res.text();
          console.error(`Error fetching ${endpoint}: ${res.status} - ${text}`);
          throw new Error(`Failed to fetch ${endpoint}: ${res.status}`);
        }
        return res;
      };

      const readingsData = await (await checkResponse(readingsRes, "/api/water/readings")).json();
      const apartmentsData = await (await checkResponse(apartmentsRes, "/api/apartments")).json();
      const propertiesData = await (await checkResponse(propertiesRes, "/api/properties")).json();
      const waterMetersData = await (await checkResponse(waterMetersRes, "/api/water/meters")).json();
      const consumptionDataRaw = await (await checkResponse(consumptionRes, "/api/water/usage/meter-monthly")).json();

      const transformedConsumptionData: { [key: number]: { [month: string]: number } } = {};
      for (const meter of waterMetersData) {
        const apartmentId = meter.apartment_id;
        const meterId = meter.water_meter_id;
        if (consumptionDataRaw.data[meterId]) {
          transformedConsumptionData[apartmentId] = consumptionDataRaw.data[meterId];
        }
      }

      const transformedReadings = (readingsData.data || []).map((reading: any) => {
        const waterMeter = waterMetersData.find((wm: WaterMeter) => wm.water_meter_id === reading.water_meter_id);
        const apartment = apartmentsData.find((a: Apartment) => a.apartment_id === waterMeter?.apartment_id);
        const property = propertiesData.find((p: Property) => p.property_id === apartment?.property_id);
        return {
          reading_id: reading.reading_id,
          water_meter_id: reading.water_meter_id,
          reading_date: reading.reading_date,
          water_meter_reading: reading.water_meter_reading,
          meter_number: waterMeter?.meter_number || "Unknown",
          apartment_number: apartment?.apartment_number || "Unknown",
          property_name: property?.name || "Unknown",
          apartment_id: apartment?.apartment_id,
          last_6_months_consumption: transformedConsumptionData[apartment?.apartment_id || 0] || {},
        };
      });

      const uniqueReadings = getUniqueApartmentReadings(transformedReadings);

      setReadings(uniqueReadings);
      setApartments(apartmentsData);
      setProperties(propertiesData);
      setWaterMeters(waterMetersData);
      setConsumptionData(transformedConsumptionData);
    } catch (error) {
      console.error("Error in fetchAllData:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      const payload = {
        water_meter_id: parseInt(formEntries[0].water_meter_id),
        reading_date: readingDate,
        water_meter_reading: parseFloat(formEntries[0].water_meter_reading),
      };
      const response = await fetch(`/api/water/readings/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        resetForm();
        fetchAllData();
      } else {
        console.error(`Failed to update reading: ${response.status}`);
      }
    } else {
      const payloads = formEntries
        .filter((entry) => entry.water_meter_id && entry.water_meter_reading)
        .map((entry) => ({
          water_meter_id: parseInt(entry.water_meter_id),
          reading_date: readingDate,
          water_meter_reading: parseFloat(entry.water_meter_reading),
        }));

      if (payloads.length === 0) {
        alert("Please add at least one valid reading.");
        return;
      }

      const response = await fetch("/api/water/readings/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloads),
      });

      if (response.ok) {
        resetForm();
        fetchAllData();
      } else {
        console.error(`Failed to add readings: ${response.status}`);
      }
    }
  };

  const handleEdit = (reading: WaterReading) => {
    const waterMeter = waterMeters.find((wm) => wm.water_meter_id === reading.water_meter_id);
    const apartment = apartments.find((a) => a.apartment_id === waterMeter?.apartment_id);
    const property = properties.find((p) => p.property_id === apartment?.property_id);

    setFormEntries([{
      apartment_id: apartment?.apartment_id.toString() || "",
      water_meter_id: reading.water_meter_id.toString(),
      water_meter_reading: reading.water_meter_reading.toString(),
    }]);
    setReadingDate(reading.reading_date.split("T")[0]);
    setEditingId(reading.reading_id);
    setEditingDetails({
      apartment_number: apartment?.apartment_number || "Unknown",
      property_name: property?.name || "Unknown",
      meter_number: waterMeter?.meter_number || "Unknown",
    });
    setIsAddCardOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: number, apartmentNumber: string | undefined) => {
    if (window.confirm(`Are you sure you want to delete water reading for apartment ${apartmentNumber || "Unknown"}?`)) {
      const response = await fetch(`/api/water/readings/${id}`, { method: "DELETE" });
      if (response.ok) {
        fetchAllData();
      } else {
        console.error(`Failed to delete reading ${id}: ${response.status}`);
      }
    }
  };

  const resetForm = () => {
    setFormEntries([{ apartment_id: "", water_meter_id: "", water_meter_reading: "" }]);
    setReadingDate(new Date().toISOString().split("T")[0]);
    setApartmentFilter("");
    setEditingId(null);
    setEditingDetails(null);
  };

  const addFormEntry = () => {
    setFormEntries([{ apartment_id: "", water_meter_id: "", water_meter_reading: "" }, ...formEntries]);
  };

  const removeFormEntry = (index: number) => {
    if (formEntries.length > 1) {
      setFormEntries(formEntries.filter((_, i) => i !== index));
    }
  };

  const updateFormEntry = (index: number, field: keyof ReadingFormEntry, value: string) => {
    const updatedEntries = [...formEntries];
    updatedEntries[index][field] = value;
    if (field === "apartment_id" && value) {
      const meter = waterMeters.find((wm) => wm.apartment_id === parseInt(value));
      updatedEntries[index].water_meter_id = meter?.water_meter_id.toString() || "";
    }
    setFormEntries(updatedEntries);
  };

  const filteredApartments = apartments.filter((apartment) => {
    const property = properties.find((p) => p.property_id === apartment.property_id);
    const optionText = `${property?.name || "Unknown"} - ${apartment.apartment_number}`;
    return optionText.toLowerCase().includes(apartmentFilter.toLowerCase());
  });

  const table = useReactTable({
    data: readings,
    columns,
    state: { sorting, columnFilters, columnVisibility, pagination },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    meta: { handleEdit, handleDelete },
  });

  return (
    <div className="w-full p-4 space-y-12">
      <Card className="w-full mx-auto shadow-lg border border-gray-200 rounded-lg">
        <CardHeader
          className="border-b border-gray-200 flex justify-between items-center cursor-pointer"
          onClick={() => setIsAddCardOpen(!isAddCardOpen)}
        >
          <CardTitle className="text-lg font-semibold text-gray-800">
            {editingId
              ? `Edit Water Reading: ${editingDetails?.property_name} - ${editingDetails?.apartment_number}`
              : "Add New Water Readings"}
          </CardTitle>
          {isAddCardOpen ? <IconChevronUp /> : <IconChevronDown />}
        </CardHeader>
        {isAddCardOpen && (
          <CardContent className="pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Reading Date</label>
                  <Input
                    value={readingDate}
                    onChange={(e) => setReadingDate(e.target.value)}
                    className="w-full"
                    type="date"
                    // Removed disabled={editingId !== null} to allow editing
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Filter Apartments</label>
                  <Input
                    placeholder="Filter Apartments"
                    value={apartmentFilter}
                    onChange={(e) => setApartmentFilter(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
              {!editingId && (
                <Button type="button" variant="outline" onClick={addFormEntry}>
                  <IconPlus className="mr-2" /> Add Another Reading
                </Button>
              )}
              <div className="space-y-4">
                {formEntries.map((entry, index) => (
                  <div key={index} className="grid gap-4 sm:grid-cols-3 items-end">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Apartment</label>
                      <Select
                        value={entry.apartment_id}
                        onValueChange={(value) => updateFormEntry(index, "apartment_id", value)}
                        disabled={editingId !== null}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select Apartment" />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredApartments.map((apartment) => {
                            const property = properties.find((p) => p.property_id === apartment.property_id);
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
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Water Meter</label>
                      <Input
                        value={
                          waterMeters.find((wm) => wm.water_meter_id === parseInt(entry.water_meter_id))?.meter_number || ""
                        }
                        className="w-full"
                        disabled
                      />
                    </div>
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700">Units (m³)</label>
                        <Input
                          value={entry.water_meter_reading}
                          onChange={(e) => updateFormEntry(index, "water_meter_reading", e.target.value)}
                          className="w-full"
                          type="number"
                          step="0.01"
                        />
                      </div>
                      {!editingId && formEntries.length > 1 && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => removeFormEntry(index)}
                        >
                          <IconTrash />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-2">
                <Button type="submit">{editingId ? "Update" : "Add"} Reading{!editingId && "s"}</Button>
                {editingId && (
                  <Button variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        )}
      </Card>

      <Card className="w-full mx-auto shadow-lg border border-gray-200 rounded-lg">
        <CardHeader
          className="border-b border-gray-200 flex justify-between items-center cursor-pointer"
          onClick={() => setIsFilterCardOpen(!isFilterCardOpen)}
        >
          <div className="flex justify-between items-center w-full">
            <CardTitle className="text-lg font-semibold text-gray-800">Filters</CardTitle>
            {isFilterCardOpen ? <IconChevronUp /> : <IconChevronDown />}
          </div>
        </CardHeader>
        {isFilterCardOpen && (
          <CardContent className="pt-4">
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {table
                .getAllColumns()
                .filter((col) => col.id !== "actions" && !col.id.startsWith("consumption_"))
                .map((column, index) => (
                  <div key={column.id} className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">
                      {["Property", "Apartment", "Meter Number", "Reading Date", "Units"][index]}
                    </label>
                    <Input
                      placeholder={`Filter by ${["Property", "Apartment", "Meter Number", "Reading Date", "Units"][index]}`}
                      value={(column.getFilterValue() as string) ?? ""}
                      onChange={(e) => column.setFilterValue(e.target.value)}
                      className="w-full"
                    />
                  </div>
                ))}
            </div>
            <div className="flex justify-end mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.getAllColumns().forEach((column) => column.setFilterValue(""))}
              >
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
                  <TableHead key={header.id} className="whitespace-nowrap">
                    {flexRender(header.column.columnDef.header, header.getContext())}
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
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No water readings found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 sm:space-x-2 py-4">
        <div className="flex items-center space-x-2">
          <p className="text-sm text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </p>
          <Select
            value={table.getState().pagination.pageSize.toString()}
            onValueChange={(value) => table.setPageSize(Number(value))}
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
  );
}