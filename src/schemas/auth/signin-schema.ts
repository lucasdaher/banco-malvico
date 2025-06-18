import { z } from "zod";

export const loginSchema = z.object({
  cpf: z
    .string()
    .min(1, "O CPF é obrigatório.")
    .regex(/^\d{11}$/, "O CPF deve conter exatamente 11 dígitos.")
    .transform((val) => val.replace(/\D/g, "")),

  senha: z.string().min(6, "A senha deve ter no mínimo 6 caracteres."),

  tipo_usuario: z.enum(["CLIENTE", "FUNCIONARIO"], {
    errorMap: () => ({ message: "Selecione um tipo de usuário válido." }),
  }),
});

export const otpSchema = z.object({
  otp: z.string().length(6, "O código OTP deve ter exatamente 6 dígitos."),
});

export type TLoginSchema = z.infer<typeof loginSchema>;
export type TOtpSchema = z.infer<typeof otpSchema>;
