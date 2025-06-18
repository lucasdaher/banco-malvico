"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { realizarTransferencia } from "@/services/cliente-service";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function TransferenciaPage() {
  const [contaDestino, setContaDestino] = useState("");
  const [valor, setValor] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleTransferencia = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const valorNumerico = parseFloat(valor);
      if (isNaN(valorNumerico) || valorNumerico <= 0) {
        throw new Error("Por favor, insira um valor válido.");
      }
      if (!contaDestino) {
        throw new Error("Por favor, informe a conta de destino.");
      }

      const response = await realizarTransferencia({
        numero_conta_destino: contaDestino,
        valor: valorNumerico,
      });

      toast.success(response.message || "Transferência realizada com sucesso!");
      setContaDestino("");
      setValor("");
    } catch (error: any) {
      toast.error(error.message || "Falha ao realizar transferência.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">
        Transferência
      </h1>
      <p className="text-zinc-600 font-medium tracking-tight text-base mt-1">
        Envie dinheiro para outra conta do Banco Malvader.
      </p>
      <Card className="w-full max-w-lg bg-transparent border-0 shadow-none p-0 mt-8">
        <CardContent className="bg-transparent border-0 p-0 shadow-none">
          <form onSubmit={handleTransferencia} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="transferencia-conta">Conta de Destino</Label>
              <Input
                id="transferencia-conta"
                type="text"
                placeholder="Digite o número da conta que receberá"
                value={contaDestino}
                onChange={(e) => setContaDestino(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="transferencia-valor">
                Valor da Transferência (R$)
              </Label>
              <Input
                id="transferencia-valor"
                type="number"
                placeholder="Digite um valor para transferir"
                step="0.01"
                min="0.01"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full cursor-pointer"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Realizar transferência
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
