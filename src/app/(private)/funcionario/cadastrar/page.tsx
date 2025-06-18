"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import {
  cadastrarFuncionario,
  NovoFuncionarioData,
} from "@/services/funcionario-service";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const initialState: NovoFuncionarioData = {
  nome: "",
  cpf: "",
  data_nascimento: "",
  telefone: "",
  email: "",
  senha: "",
  cargo: "ATENDENTE",
};

export default function CadastrarFuncionarioPage() {
  const [formData, setFormData] = useState<NovoFuncionarioData>(initialState);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await cadastrarFuncionario(formData);
      toast.success(response.message || "Funcionário cadastrado com sucesso!");
      setFormData(initialState);
    } catch (error: any) {
      toast.error(error.message || "Falha ao cadastrar funcionário.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">
        Cadastrar Funcionário
      </h1>
      <p className="text-zinc-600 font-medium tracking-tight text-base mt-1">
        Apenas gerentes podem realizar esta operação.
      </p>
      <Card className="w-full max-w-2xl mt-8 shadow-none border-none bg-transparent p-0">
        <CardContent className="p-0">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo</Label>
                <Input
                  id="nome"
                  name="nome"
                  value={formData.nome}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  name="cpf"
                  value={formData.cpf}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="data_nascimento">Data de Nascimento</Label>
                <Input
                  id="data_nascimento"
                  name="data_nascimento"
                  type="date"
                  value={formData.data_nascimento}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  name="telefone"
                  value={formData.telefone}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="senha">Senha Provisória</Label>
                <Input
                  id="senha"
                  name="senha"
                  type="password"
                  value={formData.senha}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Cargo</Label>
                <Select
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, cargo: value as any }))
                  }
                  defaultValue={formData.cargo}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ATENDENTE">Atendente</SelectItem>
                    <SelectItem value="ESTAGIARIO">Estagiário</SelectItem>
                    <SelectItem value="GERENTE">Gerente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full cursor-pointer"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Cadastrar Funcionário
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
