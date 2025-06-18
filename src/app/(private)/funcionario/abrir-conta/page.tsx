"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { abrirConta, NovaContaData } from "@/services/funcionario-service";
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

const initialState: NovaContaData = {
  nome: "",
  cpf: "",
  data_nascimento: "",
  telefone: "",
  email: "",
  senha: "",
  endereco: {
    cep: "",
    local: "",
    numero_casa: "",
    bairro: "",
    cidade: "",
    estado: "",
  },
  tipo_conta: "CORRENTE",
  saldo_inicial: 0,
  limite: 500,
  data_vencimento: "",
  taxa_manutencao: 15,
  taxa_rendimento: 0.5,
  perfil_risco: "MEDIO",
  valor_minimo: 1000,
  taxa_rendimento_base: 0.8,
};

export default function AbrirContaPage() {
  const [formData, setFormData] = useState<NovaContaData>(initialState);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const [section, field] = name.split(".");

    if (section === "endereco") {
      setFormData((prev) => ({
        ...prev,
        endereco: { ...prev.endereco, [field]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const dadosParaApi = {
        ...formData,
        saldo_inicial: Number(formData.saldo_inicial) || 0,
        limite: Number(formData.limite) || 0,
        taxa_manutencao: Number(formData.taxa_manutencao) || 0,
        taxa_rendimento: Number(formData.taxa_rendimento) || 0,
        valor_minimo: Number(formData.valor_minimo) || 0,
        taxa_rendimento_base: Number(formData.taxa_rendimento_base) || 0,
      };
      const response = await abrirConta(dadosParaApi);
      toast.success(response.message || "Conta aberta com sucesso!");
      setFormData(initialState);
    } catch (error: any) {
      toast.error(error.message || "Falha ao abrir conta.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">
        Abertura de conta
      </h1>
      <p className="text-zinc-600 font-medium tracking-tight text-base mt-1">
        Preencha os dados abaixo para cadastrar um novo cliente e sua primeira
        conta.
      </p>
      <Card className="w-full max-w-4xl mt-8 shadow-none bg-transparent p-0 border-none">
        <CardContent className="p-0">
          <form onSubmit={handleSubmit} className="space-y-8">
            <section className="space-y-4">
              <h3 className="font-semibold text-lg">Dados Pessoais</h3>
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
                    required
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
              </div>
            </section>

            {/* Seção de Endereço */}
            <section className="space-y-4">
              <h3 className="font-semibold text-lg">Endereço</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cep">CEP</Label>
                  <Input
                    id="cep"
                    name="endereco.cep"
                    value={formData.endereco.cep}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="local">Logradouro</Label>
                  <Input
                    id="local"
                    name="endereco.local"
                    value={formData.endereco.local}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numero_casa">Número</Label>
                  <Input
                    id="numero_casa"
                    name="endereco.numero_casa"
                    value={formData.endereco.numero_casa}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bairro">Bairro</Label>
                  <Input
                    id="bairro"
                    name="endereco.bairro"
                    value={formData.endereco.bairro}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    name="endereco.cidade"
                    value={formData.endereco.cidade}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estado">Estado (UF)</Label>
                  <Input
                    id="estado"
                    name="endereco.estado"
                    value={formData.endereco.estado}
                    onChange={handleChange}
                    maxLength={2}
                    required
                  />
                </div>
              </div>
            </section>

            {/* Seção da Conta */}
            <section className="space-y-4">
              <h3 className="font-semibold text-lg">Dados da Conta</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Conta</Label>
                  <Select
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        tipo_conta: value as any,
                      }))
                    }
                    defaultValue={formData.tipo_conta}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CORRENTE">Conta Corrente</SelectItem>
                      <SelectItem value="POUPANCA">Conta Poupança</SelectItem>
                      <SelectItem value="INVESTIMENTO">
                        Conta Investimento
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="saldo_inicial">Depósito Inicial (R$)</Label>
                  <Input
                    id="saldo_inicial"
                    name="saldo_inicial"
                    type="number"
                    step="0.01"
                    value={formData.saldo_inicial}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </section>

            {/* SEÇÃO CONDICIONAL PARA CONTA CORRENTE */}
            {formData.tipo_conta === "CORRENTE" && (
              <section className="space-y-4 p-6 border rounded-lg bg-muted/50 animate-in fade-in">
                <h3 className="font-semibold text-lg text-primary">
                  Detalhes da Conta Corrente
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="limite">Limite (R$)</Label>
                    <Input
                      id="limite"
                      name="limite"
                      type="number"
                      step="0.01"
                      value={formData.limite}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxa_manutencao">
                      Taxa Manutenção (R$)
                    </Label>
                    <Input
                      id="taxa_manutencao"
                      name="taxa_manutencao"
                      type="number"
                      step="0.01"
                      value={formData.taxa_manutencao}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="data_vencimento">
                      Vencimento da Fatura
                    </Label>
                    <Input
                      id="data_vencimento"
                      name="data_vencimento"
                      type="date"
                      value={formData.data_vencimento}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </section>
            )}

            {/* SEÇÃO CONDICIONAL PARA CONTA POUPANÇA */}
            {formData.tipo_conta === "POUPANCA" && (
              <section className="space-y-4 p-6 border rounded-lg bg-muted/50 animate-in fade-in">
                <h3 className="font-semibold text-lg text-primary">
                  Detalhes da Conta Poupança
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="taxa_rendimento">
                      Taxa de Rendimento (% a.m.)
                    </Label>
                    <Input
                      id="taxa_rendimento"
                      name="taxa_rendimento"
                      type="number"
                      step="0.01"
                      value={formData.taxa_rendimento}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </section>
            )}

            {/* SEÇÃO CONDICIONAL PARA CONTA INVESTIMENTO */}
            {formData.tipo_conta === "INVESTIMENTO" && (
              <section className="space-y-4 p-6 border rounded-lg bg-muted/50 animate-in fade-in">
                <h3 className="font-semibold text-lg text-primary">
                  Detalhes da Conta Investimento
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Perfil de Risco</Label>
                    <Select
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          perfil_risco: value as any,
                        }))
                      }
                      defaultValue={formData.perfil_risco}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BAIXO">Baixo</SelectItem>
                        <SelectItem value="MEDIO">Médio</SelectItem>
                        <SelectItem value="ALTO">Alto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="valor_minimo">
                      Valor Mínimo Investimento (R$)
                    </Label>
                    <Input
                      id="valor_minimo"
                      name="valor_minimo"
                      type="number"
                      step="0.01"
                      value={formData.valor_minimo}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxa_rendimento_base">
                      Taxa Rendimento Base (% a.m.)
                    </Label>
                    <Input
                      id="taxa_rendimento_base"
                      name="taxa_rendimento_base"
                      type="number"
                      step="0.01"
                      value={formData.taxa_rendimento_base}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </section>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Abrir conta
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
