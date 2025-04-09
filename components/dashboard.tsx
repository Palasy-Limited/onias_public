"use client";

import { useState, useEffect, useRef } from "react";
import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartConfiguration,
  Tick,
  Scale,
  CoreScaleOptions,
} from "chart.js";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// MetricCard Component
interface MetricCardProps {
  title: string;
  value: string;
  currency?: string;
  trendValue?: number;
  trendDirection?: "up" | "down";
  trendText?: string;
  footerText: string;
}

function MetricCard({
  title,
  value,
  currency,
  trendValue,
  trendDirection,
  trendText,
  footerText,
}: MetricCardProps) {
  return (
    <Card className="@container/card">
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl flex items-baseline gap-1.5">
          {currency && <span>{currency}</span>}
          <span>{value}</span>
        </CardTitle>
        {trendValue !== undefined && trendDirection && (
          <CardAction>
            <Badge variant="outline">
              {trendDirection === "up" ? <IconTrendingUp /> : <IconTrendingDown />}
              {trendValue > 0 ? "+" : ""}{trendValue}%
            </Badge>
          </CardAction>
        )}
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5 text-sm">
        {trendValue !== undefined && trendDirection && trendText && (
          <div className="line-clamp-1 flex gap-2 font-medium">
            {trendDirection === "up" ? "Up" : "Down"} {Math.abs(trendValue)}% {trendText}
            {trendDirection === "up" ? (
              <IconTrendingUp className="size-4" />
            ) : (
              <IconTrendingDown className="size-4" />
            )}
          </div>
        )}
        <div className="text-muted-foreground">{footerText}</div>
      </CardFooter>
    </Card>
  );
}

// Main Dashboard Component
export function PropertyManagementDashboard() {
  const [metrics, setMetrics] = useState({
    occupancyRate: 0,
    totalRevenue: 0,
    activeTenancies: 0,
    newTenants: 0,
    maintenanceRequests: { pending: 0, inProgress: 0, completed: 0 },
    overduePayments: 0,
    moveIns: 0,
    moveOuts: 0,
    waterConsumption: 0,
  });

  const [chartData, setChartData] = useState({
    monthlyRevenue: [] as { year: number; month: number; value: number }[],
    monthlyWaterUsage: [] as { month: string; totalConsumption: number }[],
  });

  // Refs with specific chart types
  const revenueChartRef = useRef<ChartJS<"line", number[], string>>(null);
  const waterChartRef = useRef<ChartJS<"line", number[], string>>(null);
  const maintenanceChartRef = useRef<ChartJS<"bar", number[], string>>(null);

  // Fetch data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [
          totalApartmentsRes,
          activeTenanciesRes,
          totalRevenueRes,
          newTenantsRes,
          maintenanceRequestsRes,
          overduePaymentsRes,
          tenantMovesRes,
          waterConsumptionRes,
          monthlyRevenueRes,
          monthlyWaterUsageRes,
        ] = await Promise.all([
          fetch("/api/apartments/count"),
          fetch("/api/tenancies/active/count"),
          fetch("/api/payments/revenue"),
          fetch("/api/tenants/new"),
          fetch("/api/maintenance/requests"),
          fetch("/api/payments/overdue"),
          fetch("/api/tenants/moves"),
          fetch("/api/water/consumption"),
          fetch("/api/payments/revenue/monthly?months=12"),
          fetch("/api/water/usage/monthly"),
        ]);

        const totalApartmentsData = await totalApartmentsRes.json();
        const totalApartments = totalApartmentsData.total || 0;

        const activeTenanciesData = await activeTenanciesRes.json();
        const activeTenancies = activeTenanciesData.total || 0;

        const totalRevenueData = await totalRevenueRes.json();
        const totalRevenue = totalRevenueData.total || 0;

        const newTenantsData = await newTenantsRes.json();
        const newTenants = newTenantsData.total || 0;

        const maintenanceRequestsData = await maintenanceRequestsRes.json();
        const maintenanceRequests = maintenanceRequestsData || { pending: 0, inProgress: 0, completed: 0 };

        const overduePaymentsData = await overduePaymentsRes.json();
        const overduePayments = overduePaymentsData.total || 0;

        const tenantMovesData = await tenantMovesRes.json();
        const tenantMoves = tenantMovesData || { moveIns: 0, moveOuts: 0 };

        const waterConsumptionData = await waterConsumptionRes.json();
        const waterConsumption = waterConsumptionData.success
          ? waterConsumptionData.data.totalConsumption || 0
          : 0;

        const monthlyRevenueData = await monthlyRevenueRes.json();
        const monthlyRevenue = Array.isArray(monthlyRevenueData) ? monthlyRevenueData : [];

        const monthlyWaterUsageData = await monthlyWaterUsageRes.json();
        const monthlyWaterUsage = monthlyWaterUsageData.success
          ? monthlyWaterUsageData.data || []
          : [];

        const occupancyRate =
          totalApartments > 0 ? (activeTenancies / totalApartments) * 100 : 0;

        setMetrics({
          occupancyRate,
          totalRevenue,
          activeTenancies,
          newTenants,
          maintenanceRequests,
          overduePayments,
          moveIns: tenantMoves.moveIns,
          moveOuts: tenantMoves.moveOuts,
          waterConsumption,
        });

        setChartData({
          monthlyRevenue,
          monthlyWaterUsage,
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setChartData({
          monthlyRevenue: [],
          monthlyWaterUsage: [],
        });
      }
    };

    loadData();
  }, []);

  // Calculate trends
  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const revenueTrend =
    chartData.monthlyRevenue.length >= 2
      ? Number(calculateTrend(
          metrics.totalRevenue,
          chartData.monthlyRevenue[chartData.monthlyRevenue.length - 2].value
        ).toFixed(2))
      : 0;

  const waterTrend =
    chartData.monthlyWaterUsage.length >= 2
      ? Number(calculateTrend(
          metrics.waterConsumption,
          chartData.monthlyWaterUsage[chartData.monthlyWaterUsage.length - 2].totalConsumption
        ).toFixed(2))
      : 0;

  // Format money without currency symbol
  const formatMoney = (value: number): string => {
    return value.toLocaleString("en-KE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Generate chart labels
  const revenueChartLabels = Array.isArray(chartData.monthlyRevenue)
    ? chartData.monthlyRevenue.map((entry) => {
        const date = new Date(entry.year, entry.month - 1);
        return date.toLocaleString("en-US", { month: "short", year: "numeric" });
      })
    : [];

  // Chart data
  const revenueChartData: ChartConfiguration<"line", number[], string>["data"] = {
    labels: revenueChartLabels,
    datasets: [
      {
        label: "Revenue (KSh)",
        data: Array.isArray(chartData.monthlyRevenue)
          ? chartData.monthlyRevenue.map((entry) => entry.value)
          : [],
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        fill: true,
      },
    ],
  };

  const maintenanceChartData: ChartConfiguration<"bar", number[], string>["data"] = {
    labels: ["Pending", "In Progress", "Completed"],
    datasets: [
      {
        label: "Requests",
        data: [
          metrics.maintenanceRequests.pending,
          metrics.maintenanceRequests.inProgress,
          metrics.maintenanceRequests.completed,
        ],
        backgroundColor: ["#FF6384", "#36A2EB", "#4BC0C0"],
      },
    ],
  };

  const waterChartData: ChartConfiguration<"line", number[], string>["data"] = {
    labels: chartData.monthlyWaterUsage.map((entry) => entry.month),
    datasets: [
      {
        label: "Water Usage (m³)",
        data: chartData.monthlyWaterUsage.map((entry) => entry.totalConsumption),
        borderColor: "rgba(54, 162, 235, 1)",
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        fill: true,
      },
    ],
  };

  // Chart options with ref-based dynamic formatting
  const getChartOptions = (
    chartRef: typeof revenueChartRef | typeof waterChartRef | typeof maintenanceChartRef
  ) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" as const },
    },
    scales: {
      x: {
        type: "category" as const, // Explicitly define x-axis as category
        ticks: {
          maxTicksLimit: 12,
          autoSkip: true,
        },
      },
      y: {
        type: "linear" as const, // Explicitly define y-axis as linear
        ticks: {
          callback: function (
            this: Scale<CoreScaleOptions>,
            tickValue: number | string,
            index: number,
            ticks: Tick[]
          ): string | number | null | undefined {
            const chart = chartRef.current;
            if (chart && chart.data.datasets[0]?.label === "Revenue (KSh)") {
              return formatMoney(Number(tickValue));
            }
            return tickValue;
          },
        },
      },
    },
  });

  return (
    <div className="p-4 lg:p-6">
      {/* Cards Section */}
      <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        <MetricCard
          title="Occupancy Rate"
          value={`${metrics.occupancyRate.toFixed(1)}%`}
          footerText="Current occupancy"
        />
        <MetricCard
          title="Total Revenue"
          value={formatMoney(metrics.totalRevenue)}
          currency="KSh"
          trendValue={revenueTrend}
          trendDirection={revenueTrend >= 0 ? "up" : "down"}
          trendText="this month"
          footerText="Revenue for the current month"
        />
        <MetricCard
          title="Active Tenancies"
          value={metrics.activeTenancies.toString()}
          footerText="Current active leases"
        />
        <MetricCard
          title="New Tenants"
          value={metrics.newTenants.toString()}
          footerText="New tenants this month"
        />
        <MetricCard
          title="Pending Maintenance"
          value={metrics.maintenanceRequests.pending.toString()}
          footerText="Requests awaiting action"
        />
        <MetricCard
          title="Overdue Payments"
          value={metrics.overduePayments.toString()}
          footerText="Tenants with overdue payments"
        />
        <MetricCard
          title="Tenant Moves"
          value={`${metrics.moveIns} in / ${metrics.moveOuts} out`}
          footerText="This month"
        />
        <MetricCard
          title="Water Consumption"
          value={`${metrics.waterConsumption} m³`}
          trendValue={waterTrend}
          trendDirection={waterTrend >= 0 ? "up" : "down"}
          trendText="this month"
          footerText="Total water usage this month"
        />
      </div>

      {/* Graphs Section */}
      <div className="mt-8 grid grid-cols-1 gap-4 @xl/main:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Over Time</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <Line
              ref={revenueChartRef}
              data={revenueChartData}
              options={getChartOptions(revenueChartRef)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Maintenance Requests by Status</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <Bar
              ref={maintenanceChartRef}
              data={maintenanceChartData}
              options={getChartOptions(maintenanceChartRef)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Water Consumption Over Time</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <Line
              ref={waterChartRef}
              data={waterChartData}
              options={getChartOptions(waterChartRef)}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}