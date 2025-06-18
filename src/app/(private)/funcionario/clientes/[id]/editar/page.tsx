"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

import {
  getClienteById,
  updateCliente,
  UpdateClienteData,
} from "@/services/funcionario-service";
import { ClienteDetalhado } from "@/services/funcionario-service";

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
import { Skeleton } from "@/components/ui/skeleton";

export default function EditarClientePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [formData, setFormData] = useState<UpdateClienteData | null>(null);
  const [funcionarioSenha, setFuncionarioSenha] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      const carregarCliente = async () => {
        setIsLoading(true);
        try {
          const data: ClienteDetalhado = await getClienteById(id);
          setFormData({
            nome: data.nome_cliente,
            telefone: data.telefone,
            email: data.email,
            endereco: {
              cep: data.endereco.cep,
              local: data.endereco.local,
              numero_casa: data.endereco.numero_casa,
              bairro: data.endereco.bairro,
              cidade: data.endereco.cidade,
              estado: data.endereco.estado,
            },
          });
        } catch (error) {
          toast.error("Falha ao carregar dados do cliente.");
          setFormData(null);
        } finally {
          setIsLoading(false);
        }
      };
      carregarCliente();
    }
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const [section, field] = name.split(".");

    if (formData && section === "endereco") {
      setFormData((prev) => ({
        ...prev!,
        endereco: { ...prev!.endereco, [field]: value },
      }));
    } else if (formData) {
      setFormData((prev) => ({ ...prev!, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;
    if (!funcionarioSenha) {
      toast.error("Por favor, insira sua senha para confirmar a alteração.");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await updateCliente(id, {
        clienteData: formData,
        funcionarioSenha,
      });
      toast.success(response.message);
      router.push(`/funcionario/clientes/${id}`);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/4" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!formData) {
    return <p>Não foi possível carregar os dados do cliente para edição.</p>;
  }

  return (
    <div className="space-y-6">
      <Link
        href={`/funcionario/clientes`}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para o gerenciador de clientes
      </Link>
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle>Editar Cliente: {formData.nome}</CardTitle>
          <CardDescription>
            Altere os dados cadastrais do cliente e confirme com sua senha.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            <section>
              <h3 className="font-semibold text-lg mb-4">Dados Pessoais</h3>
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
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    name="telefone"
                    value={formData.telefone}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2 col-span-2">
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
              </div>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-4">Endereço</h3>
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

            <Card className="bg-amber-50 border-amber-200">
              <CardHeader>
                <CardTitle className="text-amber-800">
                  Confirmação de Segurança
                </CardTitle>
                <CardDescription>
                  Para salvar as alterações, por favor, insira sua senha de
                  funcionário.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Label htmlFor="funcionarioSenha">Sua Senha</Label>
                <Input
                  id="funcionarioSenha"
                  type="password"
                  value={funcionarioSenha}
                  className="mt-2"
                  onChange={(e) => setFuncionarioSenha(e.target.value)}
                  required
                />
              </CardContent>
            </Card>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Salvar Alterações
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
