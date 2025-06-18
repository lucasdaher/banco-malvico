"use client";

import {
  LayoutDashboard,
  Banknote,
  ArrowLeftRight,
  Receipt,
  Users,
  UserPlus,
  FileText,
  LogOut,
  PanelLeftClose,
  BanknoteArrowDown,
  Files,
  Plus,
} from "lucide-react";
import { Button } from "../ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";
import iconMalvoWhite from "@/assets/malvo-icon-white.svg";
import logoMalvoWhite from "@/assets/malvo-logo-white.svg";

import card from "@/assets/cartao.svg";
import { useEffect, useState } from "react";
import { DadosConta, Transacao } from "@/types/models";
import { getDadosConta, getExtrato } from "@/services/cliente-service";
import { formatarMoeda } from "@/utils/utils";
import { useSession } from "@/providers/session-provider";

type MenuItem = {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
};

export const clientMenuItems: MenuItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/cliente/dashboard",
  },
  {
    id: "deposito",
    label: "Depósito",
    icon: Banknote,
    path: "/cliente/deposito",
  },
  {
    id: "saque",
    label: "Saque",
    icon: BanknoteArrowDown,
    path: "/cliente/saque",
  },
  {
    id: "transferencia",
    label: "Transferência",
    icon: ArrowLeftRight,
    path: "/cliente/transferencia",
  },
  { id: "extrato", label: "Extrato", icon: Receipt, path: "/cliente/extrato" },
  {
    id: "relatorios",
    label: "Relatórios",
    icon: Files,
    path: "/cliente/relatorios",
  },
];

const employeeMenuItems: MenuItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/funcionario/dashboard",
  },
  {
    id: "clientes",
    label: "Gerenciar Clientes",
    icon: Users,
    path: "/funcionario/clientes",
  },
  {
    id: "abrir-conta",
    label: "Abrir Conta",
    icon: UserPlus,
    path: "/funcionario/abrir-conta",
  },
  {
    id: "cadastrar",
    label: "Cadastrar Funcionário",
    icon: Plus,
    path: "/funcionario/cadastrar",
  },
  {
    id: "relatorios",
    label: "Relatórios",
    icon: FileText,
    path: "/funcionario/relatorios",
  },
];

interface SidebarProps {
  isEmployee?: boolean;
  isExpanded: boolean;
  toggleSidebar: () => void;
}

export const Sidebar = ({
  isEmployee = false,
  isExpanded,
  toggleSidebar,
}: SidebarProps) => {
  const menuItems = isEmployee ? employeeMenuItems : clientMenuItems;

  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout");
      router.push("/signin");
    } catch (error) {
      toast("Tente novamente!", {
        description: "Não foi possível realizar logout.",
      });
    }
  };

  const [conta, setConta] = useState<DadosConta | null>(null);
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const carregarDadosIniciais = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [dadosConta, dadosTransacoes] = await Promise.all([
          getDadosConta(),
          getExtrato(),
        ]);
        setConta(dadosConta);
        setTransacoes(dadosTransacoes);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    carregarDadosIniciais();
  }, []);

  const { user } = useSession();

  return (
    <aside
      className={`
        h-screen flex flex-col text-zinc-50 bg-red-500 pt-4
        transition-all duration-300 ease-in-out
        fixed top-0 left-0 z-10

        ${isExpanded ? "w-64" : "w-20"}
      `}
    >
      <div
        className={`${
          isExpanded
            ? "p-4 pb-2 flex justify-between items-center"
            : "p-0 py-4 flex flex-col gap-8 justify-between items-center"
        } `}
      >
        <h1
          className={`
            font-bold text-xl overflow-hidden transition-all duration-300
            animate-in fade-in
          `}
        >
          {isExpanded ? (
            <Link href="/cliente/dashboard">
              <Image
                src={logoMalvoWhite}
                alt="Icone do Banco Malvader versão branco"
                className={`${isExpanded ? "w-44" : "w-0"}`}
              />
            </Link>
          ) : (
            <Link href="/cliente/dashboard">
              <Image
                src={iconMalvoWhite}
                alt="Icone do Banco Malvader versão branco"
                className={`${
                  isExpanded ? "w-0" : "w-9"
                } hover:scale-110 hover:animate-wiggle transition-transform duration-200 ease-in-out`}
              />
            </Link>
          )}
        </h1>
        <button
          onClick={toggleSidebar}
          className="rounded-lg hover:scale-105 cursor-pointer"
        >
          <PanelLeftClose
            className={`
              text-zinc-50 w-5 h-5 transform transition-transform duration-300
              ${isExpanded ? "" : "rotate-180"}
            `}
          />
        </button>
      </div>
      <div
        className={`${
          isExpanded ? "relative w-full max-w-lg" : "hidden"
        } px-4 text-white`}
      >
        {user?.tipo_usuario === "CLIENTE" && (
          <span className="text-sm font-medium tracking-tight text-red-200">
            {conta?.tipo_conta === "CORRENTE"
              ? "Conta Corrente"
              : "Conta Poupança"}{" "}
            ∙ {conta?.numero_conta}
          </span>
        )}
      </div>

      {/* Navegação Principal */}
      <nav className="flex flex-col justify-between h-full mt-6 bg-zinc-900/90 backdrop-blur-3xl rounded-t-3xl">
        <ul className="space-y-2 px-3 pt-2">
          {menuItems.map((item) => (
            <li key={item.id}>
              <Link
                href={item.path}
                className={`
                  flex ${
                    isExpanded ? "items-center" : "justify-center items-center"
                  } rounded-full px-4 py-2
                  hover:bg-white hover:text-red-500 group
                  transition-colors duration-200 mt-2
                  `}
              >
                <item.icon className="w-5 h-5 group-hover:animate-wiggle-more group-hover:scale-105 group-hover:text-red-500 transition-colors duration-200 ease-in-out" />
                {isExpanded && (
                  <span
                    className={`
                    ml-4 font-medium overflow-hidden whitespace-nowrap
                    transition-all duration-300
                  `}
                  >
                    {item.label}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
        {/* Cartão na sidebar */}
        {user?.tipo_usuario === "CLIENTE" && (
          <div
            className={`${isExpanded ? "relative w-full max-w-lg" : "hidden"}`}
          >
            <Image src={card} alt="Cartão" className="block w-full h-auto" />

            <div className="absolute inset-0 flex flex-col items-start justify-center px-8">
              <h1 className="text-white text-base font-normal tracking-tight text-left">
                {user?.nome}
              </h1>
              <p className="text-white mt-7 text-sm">4762 ∙∙∙∙ ∙∙∙∙ 8372</p>
              <span className="tracking-tight text-lg font-bold mt-1">
                {formatarMoeda(conta?.saldo ?? 0)}
              </span>
            </div>
          </div>
        )}
      </nav>

      <footer className="py-6 px-3 bg-zinc-900/90 backdrop-blur-3xl">
        <Button
          variant="destructive"
          className="w-full rounded-full bg-red-600/20 text-red-600 hover:bg-red-600/40 hover:text-red-500 cursor-pointer"
          onClick={handleLogout}
        >
          {isExpanded && (
            <span
              className={`
                    ml-4 font-medium overflow-hidden whitespace-nowrap
                    transition-all duration-300
                  `}
            >
              Finalizar sessão
            </span>
          )}
          <LogOut />
        </Button>
      </footer>
    </aside>
  );
};
