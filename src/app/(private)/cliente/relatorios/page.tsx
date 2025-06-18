"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { Calendar as CalendarIcon, FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  getDadosConta,
  getExtrato,
  getLimiteDiario,
  LimiteDiario,
} from "@/services/cliente-service";
import {
  exportToCsv,
  exportToXlsx,
  exportToPdf,
  exportToDocx,
} from "@/lib/export-utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useSession } from "@/providers/session-provider";
import { Skeleton } from "@/components/ui/skeleton";
import MovementChart from "@/components/movement-chart";
import EvolutionChart from "@/components/evolution-chart";
import { DadosConta, Transacao } from "@/types/models";

export default function RelatoriosPage() {
  const { user } = useSession();
  const [date, setDate] = useState<DateRange | undefined>();
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formatType, setFormatType] = useState<"pdf" | "xlsx" | "csv" | "docx">(
    "pdf"
  );

  const [conta, setConta] = useState<DadosConta | null>(null);
  const [limite, setLimite] = useState<LimiteDiario | null>(null);

  useEffect(() => {
    const carregarDadosIniciais = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [dadosConta, dadosTransacoes, dadosLimite] = await Promise.all([
          getDadosConta(),
          getExtrato(),
          getLimiteDiario(),
        ]);
        setConta(dadosConta);
        setTransacoes(dadosTransacoes);
        setLimite(dadosLimite);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    carregarDadosIniciais();
  }, []);

  const handleGenerateReport = async () => {
    if (!date?.from) {
      toast.error("Um erro ocorreu!", {
        description:
          "Você precisa selecionar um período para gerar um relatório.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const params = {
        data_inicio: format(date.from, "yyyy-MM-dd"),
        data_fim: date.to
          ? format(date.to, "yyyy-MM-dd")
          : format(date.from, "yyyy-MM-dd"),
      };
      const transacoes = await getExtrato(params);

      if (transacoes.length === 0) {
        toast.info("Não encontrado!", {
          description:
            "Nenhuma transação encontrada para o período selecionado.",
        });
        return;
      }

      const reportTitle = `Extrato Detalhado - ${user?.nome}`;
      const filename = `Extrato_${user?.nome?.split(" ")[0]}_${
        params.data_inicio
      }_a_${params.data_fim}`;

      const reportData = transacoes.map((t) => ({
        Data: format(new Date(t.data_hora), "dd/MM/yyyy HH:mm"),
        Tipo: t.tipo_transacao,
        Descrição: t.descricao || "-",
        "Valor (R$)":
          (["SAQUE", "TRANSFERENCIA", "TAXA"].includes(t.tipo_transacao)
            ? "-"
            : "") + t.valor,
      }));
      const headers = ["Data", "Tipo", "Descrição", "Valor (R$)"];

      switch (formatType) {
        case "pdf":
          exportToPdf(headers, reportData, reportTitle, `${filename}.pdf`);
          break;
        case "xlsx":
          exportToXlsx(reportData, `${filename}.xlsx`);
          break;

        case "csv":
          exportToCsv(reportData, `${filename}.csv`);
          break;
        case "docx":
          const htmlContent =
            `<h1>${reportTitle}</h1><p>Período: ${params.data_inicio} a ${params.data_fim}</p>` +
            `<table border="1" style="width:100%; border-collapse: collapse;"><thead><tr>${headers
              .map((h) => `<th>${h}</th>`)
              .join("")}</tr></thead>` +
            `<tbody>${reportData
              .map(
                (row) =>
                  `<tr>${headers
                    .map((h) => `<td>${row[h as keyof typeof row]}</td>`)
                    .join("")}</tr>`
              )
              .join("")}</tbody></table>`;
          exportToDocx(htmlContent, `${filename}.docx`);
          break;
      }
      toast.success("Sucesso!", {
        description:
          "Seu relatório foi gerado com sucesso e está sendo baixado neste momento.",
      });
    } catch (error: any) {
      toast.error(error.message || "Falha ao gerar relatório.");
    } finally {
      setIsLoading(false);
    }
  };

  const processedChartData = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentTransactions = transacoes.filter(
      (t) => new Date(t.data_hora) >= thirtyDaysAgo
    );

    const dataByDay: {
      [key: string]: { day: string; Entradas: number; Saídas: number };
    } = {};

    recentTransactions.forEach((t) => {
      const valor = Number(t.valor) || 0;
      const transactionDate = new Date(t.data_hora);
      const displayDay = format(transactionDate, "dd/MM");

      if (!dataByDay[displayDay]) {
        dataByDay[displayDay] = { day: displayDay, Entradas: 0, Saídas: 0 };
      }

      if (["DEPOSITO", "RENDIMENTO"].includes(t.tipo_transacao)) {
        dataByDay[displayDay].Entradas += valor;
      } else {
        dataByDay[displayDay].Saídas += valor;
      }
    });

    return Object.values(dataByDay);
  }, [transacoes]);

  return (
    <>
      <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">
        Relatórios
      </h1>
      <p className="text-zinc-600 font-medium tracking-tight text-base mt-1">
        Gere relatórios detalhados de suas movimentações e exporte no formato
        desejado.
      </p>
      <Card className="w-full max-w-2xl bg-transparent shadow-none p-0 border-0 border-none mt-8">
        <CardContent className="space-y-6 bg-transparent p-0 border-none">
          <div className="space-y-1">
            <h3 className="font-semibold text-lg tracking-tight text-zinc-900">
              Extrato Detalhado por Período
            </h3>
            <p className="text-sm text-zinc-500 tracking-tight font-medium">
              Selecione o período e o formato para gerar seu extrato completo.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full sm:w-[300px] justify-start text-left font-normal",
                    !date && "text-zinc-500"
                  )}
                >
                  <CalendarIcon className="h-4 w-4" />
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
                    <span>Selecione o período</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  selected={date}
                  onSelect={setDate}
                  numberOfMonths={2}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>

            <Select
              onValueChange={(value) => setFormatType(value as any)}
              defaultValue="pdf"
            >
              <SelectTrigger className="w-full sm:w-[120px]">
                <SelectValue placeholder="Formato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="xlsx">Excel</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="docx">Word</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleGenerateReport}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4" />
            )}
            Gerar relatório
          </Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-14">
          <Skeleton className="h-96 w-full lg:col-span-2 bg-zinc-100" />
          <Skeleton className="h-80 w-full bg-zinc-100" />
          <Skeleton className="h-80 w-full bg-zinc-100" />
        </div>
      ) : error ? (
        <Card className="bg-destructive/10 border-destructive">
          <CardContent className="p-6">
            <p className="text-destructive text-center">{error}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <h1 className="text-xl font-bold text-zinc-900 mt-14">
            Seus relatórios mensais
          </h1>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 mt-4">
            <MovementChart data={processedChartData} />
            <EvolutionChart />
          </div>
        </>
      )}
    </>
  );
}
