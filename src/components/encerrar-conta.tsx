"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, UserX } from "lucide-react";
import { useRouter } from "next/navigation";

import { encerrarContaCliente } from "@/services/funcionario-service";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EncerrarContaDialogProps {
  clienteId: string;
  clienteNome: string;
}

export function EncerrarContaDialog({
  clienteId,
  clienteNome,
}: EncerrarContaDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [gerenteSenha, setGerenteSenha] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!gerenteSenha) {
      toast.error("A senha do gerente é obrigatória para confirmar.");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await encerrarContaCliente(clienteId, {
        gerenteSenha,
        motivo,
      });
      toast.success(response.message);
      setIsOpen(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          onClick={(e) => e.stopPropagation()}
          className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none text-white transition-colors w-full focus:bg-red-500 focus:text-white"
        >
          <UserX className="text-white h-4 w-4" />
          <span>Encerrar Contas do Cliente</span>
        </Button>
      </DialogTrigger>
      <DialogContent
        onCloseAutoFocus={(e) => e.preventDefault()}
        className="sm:max-w-[425px]"
      >
        <DialogHeader>
          <DialogTitle>Encerrar Contas de {clienteNome}</DialogTitle>
          <DialogDescription>
            Esta ação é irreversível e mudará o status de todas as contas do
            cliente para "ENCERRADA". Apenas gerentes podem realizar esta
            operação.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo do Encerramento (Opcional)</Label>
            <Input
              id="motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gerenteSenha">Informe sua senha</Label>
            <Input
              id="gerenteSenha"
              type="password"
              value={gerenteSenha}
              onChange={(e) => setGerenteSenha(e.target.value)}
              required
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar Encerramento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
