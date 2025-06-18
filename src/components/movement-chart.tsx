"use client";

import { Area, AreaChart, CartesianGrid, Legend, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegendContent,
} from "@/components/ui/chart";
import { formatarMoeda } from "@/utils/utils";

export type ChartDataPoint = {
  day: string;
  Entradas: number;
  Saídas: number;
};

interface MovementChartProps {
  data: ChartDataPoint[];
}

const chartConfig = {
  Entradas: { label: "Entradas", color: "var(--chart-2)" },
  Saídas: { label: "Saídas", color: "var(--chart-1)" },
};

export default function MovementChart({ data }: MovementChartProps) {
  return (
    <Card className="bg-white border-zinc-200 shadow-none">
      <CardHeader>
        <CardTitle>Entradas e saídas</CardTitle>
        <CardDescription>
          Análise do fluxo de caixa nos últimos dias.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-[300px]">
            <p className="text-zinc-500">
              Não há dados suficientes para exibir o gráfico.
            </p>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
            <AreaChart
              accessibilityLayer
              data={data}
              margin={{ left: 12, right: 12 }}
            >
              <CartesianGrid vertical={false} stroke="#f4f4f5" />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                stroke="#f4f4f5"
                tickMargin={8}
                fontSize={12}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                stroke="#f4f4f5"
                fontSize={12}
                tickFormatter={(value) => formatarMoeda(Number(value))}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    style={{ color: "#fff" }}
                    indicator="dot"
                    formatter={(value, name) => (
                      <div className="text-white">
                        <span
                          className="w-2.5 h-2.5 inline-block rounded-full mr-2 text-white"
                          style={{
                            backgroundColor:
                              chartConfig[name as keyof typeof chartConfig]
                                .color,
                          }}
                        ></span>
                        {chartConfig[name as keyof typeof chartConfig].label}:{" "}
                        {formatarMoeda(Number(value))}
                      </div>
                    )}
                    className="bg-zinc-900 text-white"
                  />
                }
              />
              <Legend content={<ChartLegendContent />} />
              <defs>
                <linearGradient id="fillEntradas" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={chartConfig.Entradas.color}
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor={chartConfig.Entradas.color}
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient id="fillSaidas" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={chartConfig.Saídas.color}
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor={chartConfig.Saídas.color}
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <Area
                dataKey="Saídas"
                type="natural"
                fill="url(#fillSaidas)"
                stroke={chartConfig.Saídas.color}
                stackId="a"
              />
              <Area
                dataKey="Entradas"
                type="natural"
                fill="url(#fillEntradas)"
                stroke={chartConfig.Entradas.color}
                stackId="a"
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
