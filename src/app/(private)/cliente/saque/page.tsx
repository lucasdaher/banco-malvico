"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { realizarSaque } from "@/services/cliente-service";
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

export default function SaquePage() {
  const [valor, setValor] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSaque = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const valorNumerico = parseFloat(valor);
      if (isNaN(valorNumerico) || valorNumerico <= 0) {
        throw new Error("Por favor, insira um valor válido.");
      }
      const response = await realizarSaque(valorNumerico);
      toast.success(response.message || "Saque realizado com sucesso!");
      setValor("");
    } catch (error: any) {
      toast.error(error.message || "Falha ao realizar saque.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Saque</h1>
      <p className="text-zinc-600 font-medium tracking-tight text-base mt-1">
        Informe o valor que deseja sacar. Sujeito a taxas.
      </p>
      <Card className="bg-transparent border-0 shadow-none p-0 w-full max-w-lg mt-8">
        <CardContent className="p-0">
          <form onSubmit={handleSaque} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="saque-valor">Valor do Saque (R$)</Label>
              <Input
                id="saque-valor"
                type="number"
                placeholder="Digite o valor do saque"
                step="0.01"
                min="0.01"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Realizar saque
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
