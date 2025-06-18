"use client";

import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { ChartContainer, ChartTooltipContent } from "./ui/chart";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useEffect, useMemo, useState } from "react";
import { DateRange } from "react-day-picker";
import { DadosConta, Transacao } from "@/types/models";
import { formatarMoeda } from "@/utils/utils";
import { getDadosConta, getExtrato } from "@/services/cliente-service";

export default function EvolutionChart() {
  const [date, setDate] = useState<DateRange | undefined>();
  const [conta, setConta] = useState<DadosConta | null>(null);
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const carregarDadosIniciais = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [dadosConta, dadosTransacoes] = await Promise.all([
          getDadosConta(),
          getExtrato(),
        ]);
        setConta(dadosConta);
        setTransacoes(dadosTransacoes);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    carregarDadosIniciais();
  }, []);

  const processedChartData = useMemo(() => {
    const monthlyFlow: {
      [key: string]: { month: string; Entradas: number; Saídas: number };
    } = {};

    const expenseComposition = { Saques: 0, Transferências: 0, Taxas: 0 };

    const balanceEvolution: { date: string; netFlow: number }[] = [];
    let cumulativeNetFlow = 0;

    const sortedTransactions = [...transacoes].sort(
      (a, b) =>
        new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime()
    );

    sortedTransactions.forEach((t) => {
      const valor = Number(t.valor) || 0;
      const monthKey = format(new Date(t.data_hora), "MMM/yy", {
        locale: ptBR,
      });

      if (!monthlyFlow[monthKey]) {
        monthlyFlow[monthKey] = { month: monthKey, Entradas: 0, Saídas: 0 };
      }

      if (["DEPOSITO", "RENDIMENTO"].includes(t.tipo_transacao)) {
        monthlyFlow[monthKey].Entradas += valor;
        cumulativeNetFlow += valor;
      } else {
        monthlyFlow[monthKey].Saídas += valor;
        cumulativeNetFlow -= valor;
        if (t.tipo_transacao === "SAQUE") expenseComposition["Saques"] += valor;
        if (t.tipo_transacao === "TRANSFERENCIA")
          expenseComposition["Transferências"] += valor;
        if (t.tipo_transacao === "TAXA") expenseComposition["Taxas"] += valor;
      }
      balanceEvolution.push({
        date: format(new Date(t.data_hora), "dd/MM"),
        netFlow: cumulativeNetFlow,
      });
    });

    const barChartData = Object.values(monthlyFlow);
    const pieChartData = Object.entries(expenseComposition)
      .filter(([, value]) => value > 0)
      .map(([name, value]) => ({ name, value }));

    return { barChartData, pieChartData, lineChartData: balanceEvolution };
  }, [transacoes]);

  const fetchExtrato = async (dateRange?: DateRange) => {
    setIsLoading(true);

    setError(null);

    try {
      const params = {
        data_inicio: dateRange?.from
          ? format(dateRange.from, "yyyy-MM-dd")
          : undefined,

        data_fim: dateRange?.to
          ? format(dateRange.to, "yyyy-MM-dd")
          : undefined,
      };

      const data = await getExtrato(params);

      setTransacoes(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExtrato();
  }, []);

  return (
    <>
      <Card className="bg-white border-zinc-200 shadow-none">
        <CardHeader>
          <CardTitle>Evolução financeira</CardTitle>
          <CardDescription>
            Análise da sua evolução financeira mensal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{}} className="min-h-[250px] w-full">
            <LineChart data={processedChartData.lineChartData}>
              <CartesianGrid vertical={false} stroke="#f4f4f5" />
              <XAxis
                dataKey="date"
                stroke="#fff"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#fff"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => formatarMoeda(Number(value))}
              />
              <Tooltip
                cursor={{ stroke: "#fff", strokeWidth: 2 }}
                content={
                  <ChartTooltipContent
                    formatter={(value) => formatarMoeda(Number(value))}
                    labelKey="date"
                    className="bg-zinc-900 text-white"
                  />
                }
              />
              <Line
                type="monotone"
                dataKey="netFlow"
                name="Fluxo Líquido"
                stroke="var(--chart-2)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </>
  );
}
