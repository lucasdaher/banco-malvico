"use client";

import { useEffect, useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateRange } from "react-day-picker";

import { getExtrato } from "@/services/cliente-service";
import { Transacao } from "@/types/models";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatarMoeda } from "@/utils/utils";

export default function ExtratoPage() {
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [date, setDate] = useState<DateRange | undefined>();

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

  const handleFilter = () => {
    fetchExtrato(date);
  };

  return (
    <>
      <h1 className="text-3xl font-bold text-zinc-900">Extrato</h1>
      <p className="text-zinc-600 font-medium tracking-tight text-base mt-1">
        Veja seu histórico de transações recentes.
      </p>
      <Card className="mt-8 bg-transparent border-0 p-0 shadow-none">
        <CardContent className="p-0">
          <div className="flex items-center gap-4 mb-6">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[300px] justify-start text-left font-normal",
                    !date && "text-zinc-500"
                  )}
                >
                  <CalendarIcon className="h-4 w-4" />
                  {date?.from ? (
                    date.to ? (
                      <>
                        {format(date.from, "LLL dd, y", { locale: ptBR })} -{" "}
                        {format(date.to, "LLL dd, y", { locale: ptBR })}
                      </>
                    ) : (
                      format(date.from, "LLL dd, y", { locale: ptBR })
                    )
                  ) : (
                    <span>Selecione um período</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={setDate}
                  numberOfMonths={2}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
            <Button onClick={handleFilter} variant="default">
              Buscar
            </Button>
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="bg-white rounded-t-lg">Data</TableHead>
                  <TableHead className="bg-white rounded-t-lg">
                    Descrição
                  </TableHead>
                  <TableHead className="bg-white rounded-t-lg text-right">
                    Valor
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Skeleton className="h-5 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-5 w-20 ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-red-500">
                      {error}
                    </TableCell>
                  </TableRow>
                ) : transacoes.length > 0 ? (
                  transacoes.map((t) => {
                    const isDebito = [
                      "SAQUE",
                      "TRANSFERENCIA",
                      "TAXA",
                    ].includes(t.tipo_transacao);
                    return (
                      <TableRow key={t.id_transacao} className="bg-white">
                        <TableCell>
                          {format(new Date(t.data_hora), "dd/MM/yyyy HH:mm")}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium capitalize">
                            {t.tipo_transacao.toLowerCase()}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {t.descricao}
                          </div>
                        </TableCell>
                        <TableCell
                          className={`text-right font-bold ${
                            isDebito ? "text-red-500" : "text-green-600"
                          }`}
                        >
                          {isDebito ? "-" : "+"} {formatarMoeda(t.valor)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center px-8 py-12">
                      <span className="text-lg text-zinc-400 tracking-tight">
                        Nenhuma transação encontrada para este período.
                      </span>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
