"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { realizarDeposito } from "@/services/cliente-service";
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

export default function DepositoPage() {
  const [valor, setValor] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleDeposito = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const valorNumerico = parseFloat(valor);
      if (isNaN(valorNumerico) || valorNumerico <= 0) {
        throw new Error("Por favor, insira um valor válido.");
      }
      const response = await realizarDeposito(valorNumerico);
      toast.success("Sucesso!", {
        description: `Você efetuou um depósito de R$${valorNumerico}`,
      });
      setValor("");
    } catch (error: any) {
      toast.error(error.message || "Falha ao realizar depósito.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <h1 className="text-3xl font-bold text-zinc-900">Depósito</h1>
      <p className="text-zinc-600 font-medium tracking-tight text-base mt-1">
        Faça depósitos para sua conta com facilidade.
      </p>
      <Card className="w-full bg-transparent border-none p-0 shadow-none max-w-lg mt-8">
        <CardContent className="p-0">
          <form onSubmit={handleDeposito} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="deposito-valor">Valor do depósito (R$)</Label>
              <Input
                id="deposito-valor"
                className="text-zinc-900"
                type="number"
                placeholder="Digite um valor para depositar"
                step="0.01"
                min="0.01"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar Depósito
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
