import "server-only";
import { cookies } from "next/headers";
import * as jose from "jose";

export interface SessionPayload {
  id: number;
  nome: string;
  cpf: string;
  tipo_usuario: "CLIENTE" | "FUNCIONARIO";
  iat: number;
  exp: number;
}

export async function getSession(): Promise<SessionPayload | null> {
  const tokenCookie = (await cookies()).get("Authorization");
  if (!tokenCookie) {
    return null;
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jose.jwtVerify<SessionPayload>(
      tokenCookie.value,
      secret
    );
    return payload;
  } catch (error) {
    console.error("[ERRO]: Token expirado ou não encontrado.");
    return null;
  }
}
