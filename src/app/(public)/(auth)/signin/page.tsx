"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";

import demonstration from "@/assets/demonstration.png";
import Logo from "@/assets/malvo-logo-white.svg";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { loginSchema, otpSchema } from "@/schemas/auth/signin-schema";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function LoginPage() {
  const router = useRouter();

  const [cpf, setCpf] = useState("");
  const [senha, setSenha] = useState("");
  const [userType, setUserType] = useState("CLIENTE");
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ cpf?: string; senha?: string }>({});

  const handleLoginStep1 = async (e: any) => {
    e.preventDefault();
    setErrors({});

    try {
      loginSchema.parse({
        cpf,
        senha,
        tipo_usuario: userType,
      });

      setIsLoading(true);

      const response = await fetch("/api/auth/login-first-step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpf, senha, tipo_usuario: userType }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "CPF ou senha inválidos.");
      }

      setIsOtpStep(true);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        const fieldErrors: { [key: string]: string } = {};
        for (const issue of err.issues) {
          if (issue.path[0]) {
            fieldErrors[issue.path[0] as string] = issue.message;
          }
        }
        setErrors(fieldErrors);
      } else {
        toast.error("Falha na autenticação", {
          description: err.message,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginStep2 = async (otp: string) => {
    try {
      otpSchema.parse({ otp });

      setIsLoading(true);

      const response = await fetch("/api/auth/login-second-step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpf, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Código OTP inválido.");
      }

      const dashboardUrl =
        data.user.tipo_usuario === "CLIENTE"
          ? "/cliente/dashboard"
          : "/funcionario/dashboard";
      window.location.href = dashboardUrl;
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        toast.error("Erro de Validação", {
          description: err.issues[0].message,
        });
      } else {
        toast.error("Falha na validação do código", {
          description: err.message,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-row">
        <div className="w-full h-screen md:h-auto md:w-6/12 bg-zinc-900 px-10 py-20">
          <Link href={`/`}>
            <Image
              src={Logo}
              alt="Logo do banco malvader"
              className="w-48 hover:scale-105 transition-all duration-200 ease-in-out cursor-pointer"
            />
          </Link>

          <div className="flex flex-col mt-16">
            <h1 className="text-2xl text-white font-bold tracking-tight">
              {isOtpStep ? "Validação com código" : "Acessar uma conta"}
            </h1>
            <p className="text-base text-zinc-400 tracking-tight font-medium">
              {isOtpStep
                ? "Informe o código enviado para o seu e-mail"
                : "Informe seu CPF e senha para acessar"}
            </p>
            <form>
              {!isOtpStep ? (
                <>
                  <div className="mt-8 flex flex-col gap-2">
                    <Label className="font-semibold text-white tracking-tight">
                      Tipo de conta
                    </Label>
                    <RadioGroup
                      defaultValue="CLIENTE"
                      className="grid grid-cols-2 gap-4 mt-2"
                      onValueChange={setUserType}
                      value={userType}
                    >
                      <div>
                        <RadioGroupItem
                          value="CLIENTE"
                          id="r1"
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor="r1"
                          className="flex flex-col items-center justify-between rounded-md border-2 border-zinc-800 bg-zinc-900 text-white p-4 hover:bg-zinc-800 hover:text-white peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                        >
                          Cliente
                        </Label>
                      </div>
                      <div>
                        <RadioGroupItem
                          value="FUNCIONARIO"
                          id="r2"
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor="r2"
                          className="flex flex-col items-center justify-between rounded-md border-2 border-zinc-800 bg-zinc-900 text-white p-4 hover:bg-zinc-800 hover:text-white peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                        >
                          Funcionário
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <div className="mt-8 flex flex-col gap-2">
                    <Label className="font-semibold text-white tracking-tight">
                      CPF
                    </Label>
                    <Input
                      id="cpf"
                      type="text"
                      inputMode="numeric"
                      maxLength={11}
                      className="bg-zinc-900 text-white"
                      placeholder="Digite o número do seu CPF"
                      value={cpf}
                      onChange={(e) => {
                        const numericValue = e.target.value.replace(/\D/g, "");
                        setCpf(numericValue);
                        if (errors.cpf) {
                          setErrors((prev) => ({ ...prev, cpf: undefined }));
                        }
                      }}
                    />
                    {errors.cpf && (
                      <span className="text-sm font-medium text-red-500 mt-1">
                        {errors.cpf}
                      </span>
                    )}
                  </div>
                  <div className="mt-6 flex flex-col gap-2">
                    <Label className="font-semibold text-white tracking-tight">
                      Senha
                    </Label>
                    <Input
                      id="password"
                      placeholder="Digite a sua senha"
                      className="text-white"
                      type="password"
                      value={senha}
                      onChange={(e) => {
                        setSenha(e.target.value);
                        if (errors.senha) {
                          setErrors((prev) => ({ ...prev, senha: undefined }));
                        }
                      }}
                    />
                    {errors.senha && (
                      <span className="text-sm font-medium text-red-500 mt-1">
                        {errors.senha}
                      </span>
                    )}
                  </div>
                  <div className="w-full text-zinc-400 hover:text-zinc-300 text-right text-sm mt-2 cursor-pointer hover:underline">
                    Esqueci minha senha
                  </div>
                </>
              ) : (
                <>
                  <div className="mt-8">
                    <InputOTP
                      className="w-full"
                      maxLength={6}
                      onComplete={handleLoginStep2}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </>
              )}

              {!isOtpStep && (
                <Button
                  type="submit"
                  className="w-full mt-8 cursor-pointer"
                  size="lg"
                  onClick={handleLoginStep1}
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Avançar
                </Button>
              )}
              {isOtpStep && (
                <div className="w-full text-left text-white text-sm mt-12">
                  Não recebeu?{" "}
                  <span className="font-bold text-red-500 cursor-pointer hover:underline">
                    Reenviar código
                  </span>
                </div>
              )}
            </form>
          </div>
        </div>
        <div className="hidden md:flex w-full h-screen bg-gradient-to-br from-zinc-900 via-red-500 to-red-900 animate-gradient-shift bg-[length:400%] p-12 md:justify-center md:items-center">
          <div className="space-y-4">
            <div>
              <h1 className="text-white font-bold text-3xl tracking-tight">
                A simplicidade do maior banco
              </h1>
              <p className="text-white/80 font-medium tracking-tight text-lg">
                Veja você mesmo que nós somos a melhor opção para você.
              </p>
            </div>
            <Image
              src={demonstration}
              alt="Demonstração do sistema"
              className="w-[850px] rounded-2xl"
            />
          </div>
        </div>
      </div>
    </>
  );
}
