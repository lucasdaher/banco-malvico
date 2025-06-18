"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import {
  getClienteById,
  ClienteDetalhado,
} from "@/services/funcionario-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatarMoeda } from "@/utils/utils";
import { Button } from "@/components/ui/button";

export default function DetalhesClientePage() {
  const params = useParams();
  const id = params.id as string;

  const [cliente, setCliente] = useState<ClienteDetalhado | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const carregarDetalhes = async () => {
        try {
          const data = await getClienteById(id);
          setCliente(data);
        } catch (error) {
          console.error("Falha ao carregar detalhes do cliente:", error);
        } finally {
          setIsLoading(false);
        }
      };
      carregarDetalhes();
    }
  }, [id]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/4" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!cliente) {
    return <p>Cliente não encontrado.</p>;
  }

  return (
    <div className="space-y-6">
      <Link
        href="/funcionario/clientes"
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para a lista de clientes
      </Link>

      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {cliente.nome_cliente}
          </h1>
          <p className="text-muted-foreground">CPF: {cliente.cpf}</p>
        </div>
        <Button>Editar Cliente</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <strong>Email:</strong> {cliente.email}
            </p>
            <p>
              <strong>Telefone:</strong> {cliente.telefone}
            </p>
            <p>
              <strong>Nascimento:</strong>{" "}
              {new Date(cliente?.data_nascimento).toLocaleDateString("pt-BR")}
            </p>
            <p>
              <strong>Score de Crédito:</strong>{" "}
              <Badge>{formatarMoeda(cliente?.score_de_credito)}</Badge>
            </p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Endereço</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>
              {cliente.endereco.local}, {cliente.endereco.numero_casa}
            </p>
            <p>
              {cliente.endereco.bairro}, {cliente.endereco.cidade} -{" "}
              {cliente.endereco.estado}
            </p>
            <p>CEP: {cliente.endereco.cep}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contas Associadas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {cliente.contas.map((conta: any) => (
            <div
              key={conta.id_conta}
              className="border p-4 rounded-lg flex justify-between items-center"
            >
              <div>
                <p className="font-bold">
                  Conta {conta.numero_conta}{" "}
                  <Badge variant="secondary">{conta.tipo_conta}</Badge>
                </p>
                <p className="text-sm text-muted-foreground">
                  Status: {conta.status}
                </p>
              </div>
              <p className="text-lg font-bold">{formatarMoeda(conta.saldo)}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
