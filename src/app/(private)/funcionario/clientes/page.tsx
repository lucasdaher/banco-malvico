"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MoreHorizontal } from "lucide-react";

import { getClientes, ResumoCliente } from "@/services/funcionario-service";
import { formatarMoeda } from "@/utils/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EncerrarContaDialog } from "@/components/encerrar-conta";

export default function GerenciarClientesPage() {
  const [clientes, setClientes] = useState<ResumoCliente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const carregarClientes = async () => {
      setIsLoading(true);
      try {
        const data = await getClientes();
        setClientes(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    carregarClientes();
  }, []);

  const getScoreBadgeVariant = (
    score: number
  ): "default" | "secondary" | "destructive" | "outline" => {
    if (score > 700) return "default";
    if (score > 400) return "secondary";
    return "destructive";
  };

  return (
    <>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">
            Gerenciar clientes
          </h1>
          <p className="text-zinc-600 font-medium tracking-tight text-base mt-1">
            Visualize e gerencie todos os clientes cadastrados no sistema.
          </p>
        </div>
        <Button asChild>
          <Link href="/funcionario/abrir-conta">Abrir conta</Link>
        </Button>
      </div>
      <Card className="mt-8 p-0 bg-transparent border-none shadow-none">
        <CardContent className="border-none p-0">
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome do Cliente</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead className="text-center">Nº de Contas</TableHead>
                  <TableHead className="text-center">
                    Score de Crédito
                  </TableHead>
                  <TableHead className="text-right">
                    Saldo Consolidado
                  </TableHead>
                  <TableHead>
                    <span className="sr-only">Ações</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Skeleton className="h-5 w-40" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-28" />
                      </TableCell>
                      <TableCell className="text-center">
                        <Skeleton className="h-5 w-10 mx-auto" />
                      </TableCell>
                      <TableCell className="text-center">
                        <Skeleton className="h-5 w-16 mx-auto" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-5 w-24 ml-auto" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-8 ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : error ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-24 text-center text-red-500"
                    >
                      {error}
                    </TableCell>
                  </TableRow>
                ) : clientes.length > 0 ? (
                  clientes.map((cliente) => (
                    <TableRow key={cliente.id_cliente}>
                      <TableCell className="font-medium">
                        {cliente.nome_cliente}
                      </TableCell>
                      <TableCell>{cliente.cpf}</TableCell>
                      <TableCell className="text-center">
                        {cliente.total_contas}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={getScoreBadgeVariant(
                            cliente?.score_de_credito
                          )}
                        >
                          {formatarMoeda(cliente?.score_de_credito)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatarMoeda(cliente.saldo_total_consolidado)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              aria-haspopup="true"
                              size="icon"
                              variant="ghost"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Abrir menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/funcionario/clientes/${cliente.id_cliente}`}
                              >
                                Ver Detalhes
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/funcionario/clientes/${cliente.id_cliente}/editar`}
                              >
                                Editar Cliente
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-500 focus:text-white focus:bg-red-500">
                              <EncerrarContaDialog
                                clienteId={JSON.stringify(cliente.id_cliente)}
                                clienteNome={cliente.nome_cliente}
                              />
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Nenhum cliente encontrado.
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
