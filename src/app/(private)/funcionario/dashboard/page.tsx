"use client";

import { useEffect, useState } from "react";
import { Users, Wallet, UserPlus, ArrowLeftRight } from "lucide-react";
import Link from "next/link";

import {
  getDashboardStats,
  DashboardStats,
} from "@/services/funcionario-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatarMoeda } from "@/utils/utils";
import { Button } from "@/components/ui/button";
import { useSession } from "@/providers/session-provider";
import { toast } from "sonner";

export default function FuncionarioDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const carregarStats = async () => {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (error) {
        toast.error("Um erro ocorreu!", {
          description: "Falha ao carregar estatísticas: " + error,
        });
      } finally {
        setIsLoading(false);
      }
    };
    carregarStats();
  }, []);

  const user = useSession();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">
          Painel de Controle
        </h1>
        <p className="text-zinc-600 font-medium tracking-tight text-base mt-1">
          Este é o seu painel com informações e ações relevantes no banco.
        </p>
      </div>

      {/* Grid de Cards de Estatísticas */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total de Clientes"
          value={stats?.totalClientes}
          icon={<Users className="h-5 w-5 text-muted-foreground" />}
          isLoading={isLoading}
        />
        <StatCard
          title="Volume em Contas"
          value={stats?.volumeTotal}
          isCurrency={true}
          icon={<Wallet className="h-5 w-5 text-muted-foreground" />}
          isLoading={isLoading}
        />
        <StatCard
          title="Novas Contas (Mês)"
          value={stats?.novasContasMes}
          icon={<UserPlus className="h-5 w-5 text-muted-foreground" />}
          isLoading={isLoading}
        />
        <StatCard
          title="Transações (Hoje)"
          value={stats?.transacoesHoje}
          icon={<ArrowLeftRight className="h-5 w-5 text-muted-foreground" />}
          isLoading={isLoading}
        />
      </div>

      {/* Seção de Ações Rápidas */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Ações Rápidas</h2>
        <div className="flex flex-wrap gap-4">
          <Button asChild>
            <Link href="/funcionario/abrir-conta">Abrir Nova Conta</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/funcionario/clientes">Gerenciar Clientes</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/funcionario/relatorios">Gerar Relatórios</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

// Componente auxiliar para os cards de estatística para evitar repetição
interface StatCardProps {
  title: string;
  value?: number;
  icon: React.ReactNode;
  isLoading: boolean;
  isCurrency?: boolean;
}

function StatCard({
  title,
  value,
  icon,
  isLoading,
  isCurrency = false,
}: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-3/4" />
        ) : (
          <div className="text-2xl font-bold text-red-500">
            {isCurrency
              ? formatarMoeda(value ?? 0)
              : value?.toLocaleString("pt-BR") ?? "0"}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
