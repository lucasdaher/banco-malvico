"use client";

import { useState } from "react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { toast } from "sonner";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Legend } from "recharts";
import { FileDown, Loader2, Calendar as CalendarIcon } from "lucide-react";

import {
  getRelatorioMovimentacoes,
  getRelatorioInadimplentes,
  getRelatorioDesempenho,
  RelatorioMovimentacao,
  RelatorioInadimplente,
  RelatorioDesempenho,
} from "@/services/funcionario-service";

import { exportToPdf, exportToXlsx } from "@/lib/export-utils";
import { formatarMoeda } from "@/utils/utils";
import { cn } from "@/lib/utils";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

// --- Componente da Aba de Movimentações ---
function MovimentacoesReport() {
  const [data, setData] = useState<RelatorioMovimentacao[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [date, setDate] = useState<DateRange | undefined>();
  const [tipoTransacao, setTipoTransacao] = useState("");

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const filters = {
        data_inicio: date?.from ? format(date.from, "yyyy-MM-dd") : undefined,
        data_fim: date?.to ? format(date.to, "yyyy-MM-dd") : undefined,
        tipo_transacao: tipoTransacao || undefined,
      };
      const result = await getRelatorioMovimentacoes(filters);
      if (result.length === 0)
        toast.info(
          "Nenhuma movimentação encontrada para os filtros aplicados."
        );
      setData(result);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = (exportFormat: "pdf" | "xlsx") => {
    if (data.length === 0) {
      toast.error("Gere um relatório antes de exportar.");
      return;
    }
    const headers = [
      "Data",
      "Cliente",
      "CPF",
      "Nº Conta",
      "Tipo",
      "Valor (R$)",
    ];
    const dataToExport = data.map((item) => ({
      Data: format(new Date(item.data_hora), "dd/MM/yyyy HH:mm"),
      Cliente: item.nome_cliente,
      CPF: item.cpf,
      "Nº Conta": item.numero_conta,
      Tipo: item.tipo_transacao,
      "Valor (R$)": item.valor,
    }));
    const filename = `Relatorio_Movimentacoes_${
      new Date().toISOString().split("T")[0]
    }`;
    if (exportFormat === "pdf")
      exportToPdf(
        headers,
        dataToExport,
        "Relatório de Movimentações",
        `${filename}.pdf`
      );
    if (exportFormat === "xlsx") exportToXlsx(dataToExport, `${filename}.xlsx`);
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Relatório de Movimentações</CardTitle>
        <CardDescription>
          Filtre e visualize todas as transações do banco.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-4 p-4 border rounded-lg">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    `${format(date.from, "dd/MM/yy")} - ${format(
                      date.to,
                      "dd/MM/yy"
                    )}`
                  ) : (
                    format(date.from, "dd/MM/yy")
                  )
                ) : (
                  <span>Selecione um período</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="range" selected={date} onSelect={setDate} />
            </PopoverContent>
          </Popover>
          <Select onValueChange={setTipoTransacao}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo de Transação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DEPOSITO">Depósito</SelectItem>
              <SelectItem value="SAQUE">Saque</SelectItem>
              <SelectItem value="TRANSFERENCIA">Transferência</SelectItem>
              <SelectItem value="TAXA">Taxa</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleGenerate} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Gerar
          </Button>
        </div>
        {data.length > 0 && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("pdf")}
            >
              <FileDown className="mr-2 h-4 w-4" />
              Exportar PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("xlsx")}
            >
              <FileDown className="mr-2 h-4 w-4" />
              Exportar Excel
            </Button>
          </div>
        )}
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Nº Conta</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : data.length > 0 ? (
                data.map((t) => (
                  <TableRow key={t.id_transacao}>
                    <TableCell>
                      {format(new Date(t.data_hora), "dd/MM/yy HH:mm")}
                    </TableCell>
                    <TableCell className="font-medium">
                      {t.nome_cliente}
                    </TableCell>
                    <TableCell>{t.numero_conta}</TableCell>
                    <TableCell>
                      <span className="text-xs font-semibold">
                        {t.tipo_transacao}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatarMoeda(t.valor)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
                    Nenhum dado para exibir. Gere um relatório.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function InadimplenciaReport() {
  const [data, setData] = useState<RelatorioInadimplente[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const result = await getRelatorioInadimplentes();
      if (result.length === 0)
        toast.info("Ótima notícia! Nenhum cliente inadimplente encontrado.");
      setData(result);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Relatório de Inadimplência</CardTitle>
        <CardDescription>
          Liste todos os clientes com saldo devedor em suas contas.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={handleGenerate} disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Gerar Relatório
        </Button>
        {data.length > 0 && (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Nº Conta</TableHead>
                  <TableHead className="text-right">Saldo Devedor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">
                      {item.nome_cliente}
                    </TableCell>
                    <TableCell>{item.cpf}</TableCell>
                    <TableCell>{item.numero_conta}</TableCell>
                    <TableCell className="text-right font-bold text-destructive">
                      {formatarMoeda(item.saldo)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DesempenhoReport() {
  const [data, setData] = useState<RelatorioDesempenho[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const chartConfig = {
    contas_abertas_mes: {
      label: "Contas Abertas (Mês)",
      color: "var(--chart-1)",
    },
    contas_abertas_total: {
      label: "Total de Contas",
      color: "var(--chart-2)",
    },
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const result = await getRelatorioDesempenho();
      setData(result);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle>Relatório de Desempenho de Funcionários</CardTitle>
        <CardDescription>
          Visualize o número de contas abertas por cada funcionário.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={handleGenerate} disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Gerar Relatório
        </Button>
        {data.length > 0 && (
          <div className="grid gap-6">
            <ChartContainer
              config={chartConfig}
              className="min-h-[200px] w-full"
            >
              <BarChart accessibilityLayer data={data}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="nome_funcionario"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent />}
                />
                <Legend />
                <Bar
                  dataKey="contas_abertas_mes"
                  fill="var(--color-contas_abertas_mes)"
                  radius={4}
                />
                <Bar
                  dataKey="contas_abertas_total"
                  fill="var(--color-contas_abertas_total)"
                  radius={4}
                />
              </BarChart>
            </ChartContainer>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Funcionário</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead className="text-center">
                      Contas Abertas (Mês)
                    </TableHead>
                    <TableHead className="text-center">
                      Contas Abertas (Total)
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((item) => (
                    <TableRow key={item.id_funcionario}>
                      <TableCell className="font-medium">
                        {item.nome_funcionario}
                      </TableCell>
                      <TableCell>{item.cargo}</TableCell>
                      <TableCell className="text-center">
                        {item.contas_abertas_mes}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.contas_abertas_total}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function RelatoriosFuncionarioPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Central de Relatórios
        </h1>
        <p className="text-muted-foreground">
          Analise os dados operacionais e de desempenho do banco.
        </p>
      </div>
      <Tabs defaultValue="movimentacoes" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="movimentacoes">Movimentações</TabsTrigger>
          <TabsTrigger value="inadimplencia">Inadimplência</TabsTrigger>
          <TabsTrigger value="desempenho">Desempenho</TabsTrigger>
        </TabsList>

        <TabsContent value="movimentacoes" className="mt-6">
          <MovimentacoesReport />
        </TabsContent>

        <TabsContent value="inadimplencia" className="mt-6">
          <InadimplenciaReport />
        </TabsContent>

        <TabsContent value="desempenho" className="mt-6">
          <DesempenhoReport />
        </TabsContent>
      </Tabs>
    </div>
  );
}
