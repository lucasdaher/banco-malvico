"use client";

import { getDadosConta, getExtrato } from "@/services/cliente-service";
import { Transacao, DadosConta } from "@/types/models";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
import {
  ArrowDown,
  ArrowLeftRight,
  ArrowUp,
  Banknote,
  BanknoteArrowDown,
  CalendarIcon,
} from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "./ui/calendar";
import { Skeleton } from "./ui/skeleton";
import { formatarMoeda } from "@/utils/utils";

export default function ExtratoTable() {
  const [date, setDate] = useState<DateRange | undefined>();
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conta, setConta] = useState<DadosConta | null>(null);

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
      <div className="flex justify-between items-center mt-4 bg-white rounded-xl border border-zinc-200 p-4 ">
        {transacoes.length > 0 ? (
          <div className="flex flex-col justify-between items-center gap-4 w-full">
            {transacoes.map((t) => {
              const isDebito = ["SAQUE", "TRANSFERENCIA", "TAXA"].includes(
                t.tipo_transacao
              );
              return (
                <div
                  className={`flex justify-start items-center gap-4 p-2 rounded-xl w-full ${
                    isDebito ? "hover:bg-red-50" : "hover:bg-green-50"
                  }`}
                  key={t.id_transacao}
                >
                  <div
                    className={`p-2 rounded-xl ${
                      isDebito
                        ? "bg-red-50 border border-red-300 text-red-500"
                        : "bg-green-50 border border-green-300 text-green-500"
                    }`}
                  >
                    {isDebito ? <ArrowDown /> : <ArrowUp />}
                  </div>
                  <div className="flex justify-between items-center w-full">
                    <div className="">
                      <h1
                        className={`font-semibold tracking-tight text-base ${
                          isDebito ? "text-red-500" : "text-green-500"
                        }`}
                      >
                        {t.tipo_transacao === "SAQUE" ? "Saque" : "Depósito"}
                      </h1>
                      <p className="text-sm font-zinc-500 tracking-tight">
                        {format(new Date(t.data_hora), "dd/MM/yyyy HH:mm")}
                      </p>
                    </div>

                    <h1
                      className={`font-semibold tracking-tight text-base ${
                        isDebito ? "text-red-500" : "text-green-500"
                      }`}
                    >
                      {formatarMoeda(t.valor)}
                    </h1>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-zinc-600 mx-auto">Nenhum transação encontrada</p>
        )}
      </div>
      {/* <Card className="mt-8 bg-transparent border-0 p-0">
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
            <Button onClick={handleFilter} variant="secondary">
              Buscar
            </Button>
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right ">Valor</TableHead>
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
                      <TableRow key={t.id_transacao}>
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
                          className={`text-right font-medium tracking-tight text-base ${
                            isDebito ? "text-red-500" : "text-green-400"
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
      </Card> */}
    </>
  );
}
