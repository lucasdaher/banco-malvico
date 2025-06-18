"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Eye, EyeOff } from "lucide-react";

import {
  getDadosConta,
  getExtrato,
  getLimiteDiario,
  LimiteDiario,
} from "@/services/cliente-service";
import { Transacao, DadosConta } from "@/types/models";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DateRange } from "react-day-picker";
import EvolutionChart from "@/components/evolution-chart";
import MovementChart from "@/components/movement-chart";
import ExtratoTable from "@/components/extrato-table";
import { formatarMoeda } from "@/utils/utils";
import Link from "next/link";
import { clientMenuItems } from "@/components/sidebar/sidebar";
import { useSession } from "@/providers/session-provider";

export default function ClienteDashboardPage() {
  const [conta, setConta] = useState<DadosConta | null>(null);
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBalances, setShowBalances] = useState<boolean>(true);
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

  const { user } = useSession();

  return (
    <>
      <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">
        Olá, {user?.nome?.split(" ")[0]}!
      </h1>
      <p className="text-zinc-600 font-medium tracking-tight text-base mt-1">
        Bem-vindo de volta, aqui está um resumo de suas finanças.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
        <div className="border border-zinc-200 bg-white rounded-xl">
          <div className="p-7 flex justify-between items-start">
            {isLoading ? (
              <div className="space-y-2 w-full">
                <Skeleton className="bg-zinc-100 w-1/3 h-6 animate-pulse" />
                <Skeleton className="bg-zinc-100 w-full h-6 animate-pulse" />
              </div>
            ) : conta ? (
              <>
                <div>
                  <h1 className="text-lg font-medium tracking-tight text-zinc-500">
                    Saldo
                  </h1>
                  {showBalances ? (
                    <h2 className="text-3xl font-bold tracking-tight text-red-500">
                      {formatarMoeda(conta?.saldo)}
                    </h2>
                  ) : (
                    <h2 className="text-3xl font-bold tracking-tight text-red-500">
                      R$ ••••••
                    </h2>
                  )}
                  {conta?.tipo_conta === "CORRENTE" && (
                    <span className="tracking-tight text-sm text-zinc-600">
                      Limite atual{" "}
                      <strong className="text-zinc-700">
                        {formatarMoeda(conta?.limite ?? 0)}
                      </strong>
                    </span>
                  )}
                </div>
                <button
                  title="Clique para esconder os valores"
                  onClick={() => setShowBalances(!showBalances)}
                  className="cursor-pointer hover:bg-zinc-100 transition-all duration-200 ease-in-out p-2 rounded-lg"
                >
                  {showBalances ? (
                    <Eye className="text-zinc-900 w-5 h-5" />
                  ) : (
                    <EyeOff className="text-zinc-900 w-5 h-5" />
                  )}
                </button>
              </>
            ) : null}
          </div>
        </div>

        {/* Card de Tipo de Conta */}
        <div className="border border-zinc-200 bg-white rounded-xl">
          <div className="p-7 flex justify-between items-start">
            {isLoading || !limite ? (
              <div className="space-y-2 w-full">
                <Skeleton className="bg-zinc-100 w-1/3 h-6 animate-pulse" />
                <Skeleton className="bg-zinc-100 w-full h-6 animate-pulse" />
              </div>
            ) : conta ? (
              <>
                <div className="flex-1">
                  <h1 className="text-lg font-medium tracking-tight text-zinc-500">
                    Limite diário
                  </h1>
                  <h2 className="text-3xl font-bold tracking-tight text-red-500">
                    {showBalances
                      ? formatarMoeda(limite.limiteRestante)
                      : "R$ ••••••"}
                  </h2>
                  {limite.totalDepositadoHoje === 10000 ? (
                    <span className="tracking-tight text-sm text-zinc-600">
                      Você usou todo seu limite diário
                    </span>
                  ) : (
                    <span className="tracking-tight text-sm text-zinc-600">
                      Você já usou{" "}
                      <strong className="text-red-500 tracking-tight">
                        {showBalances
                          ? formatarMoeda(limite?.totalDepositadoHoje)
                          : "R$ ••••••"}
                      </strong>
                    </span>
                  )}
                </div>
                <button
                  title="Clique para esconder os valores"
                  onClick={() => setShowBalances(!showBalances)}
                  className="cursor-pointer hover:bg-zinc-100 transition-all duration-200 ease-in-out p-2 rounded-lg"
                >
                  {showBalances ? (
                    <Eye className="text-zinc-900 w-5 h-5" />
                  ) : (
                    <EyeOff className="text-zinc-900 w-5 h-5" />
                  )}
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>

      <div>
        <h1 className="text-xl font-bold text-zinc-900 mt-8">Ações rápidas</h1>
        <div className="flex flex-row justify-start items-center mt-4 mb-8">
          {clientMenuItems.map((item) => (
            <div key={item.id}>
              {item.label === "Dashboard" ? null : (
                <div className="flex flex-col justify-start items-center min-w-[86px] max-w-[86px] w-full pr-7">
                  <Link href={item.path}>
                    <div className="p-4 border border-zinc-200 rounded-xl bg-white group hover:bg-red-50 hover:border-red-400 transition-colors duration-200 ease-in-out">
                      <item.icon className="w-6 h-6 text-red-500 group-hover:animate-jump group-hover:animate-duration-1000" />
                    </div>
                  </Link>
                  <span className="font-semibold text-sm text-zinc-600 text-center tracking-tight mt-2">
                    {item.label === "Transferência" ? "Transferir" : item.label}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

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
          <h1 className="text-xl font-bold text-zinc-900 mt-14">Relatórios</h1>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 mt-4">
            <MovementChart data={processedChartData} />
            <EvolutionChart />
          </div>
        </>
      )}

      <div className="mt-8">
        <h1 className="text-xl font-bold text-zinc-900 mt-8">
          Últimas transaçoes
        </h1>
        <ExtratoTable />
      </div>
    </>
  );
}
