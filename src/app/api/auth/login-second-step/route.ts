import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { cookies } from "next/headers";
import * as jose from "jose";

export async function POST(request: Request) {
  try {
    const { cpf, otp } = await request.json();

    /**
     * Busca o usuário utilizando CPF
     */
    const [userRows]: any = await pool.query(
      "SELECT id_usuario, nome, tipo_usuario, otp_ativo, otp_expiracao FROM usuario WHERE cpf = ?",
      [cpf]
    );

    if (userRows.length === 0) {
      return NextResponse.json(
        { message: "Nenhum usuário encontrado com este CPF." },
        { status: 404 }
      );
    }

    const user = userRows[0];

    const isOtpValid = user.otp_ativo === otp;
    const isOtpExpired = new Date() > new Date(user.otp_expiracao);

    if (!isOtpValid || isOtpExpired) {
      // TODO: Registrar falha na auditoria
      return NextResponse.json(
        { message: "OTP inválido ou expirado." },
        { status: 401 }
      );
    }

    await pool.query(
      "UPDATE usuario SET otp_ativo = NULL, otp_expiracao = NULL WHERE id_usuario = ?",
      [user.id_usuario]
    );

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    if (!secret) {
      throw new Error("A chave secreta JWT não foi definida.");
    }

    const payloadParaToken = {
      id: user.id_usuario,
      nome: user.nome,
      cpf: cpf,
      tipo_usuario: user.tipo_usuario,
    };

    const token = await new jose.SignJWT({
      id: user.id_usuario,
      nome: user.nome,
      cpf: cpf,
      tipo_usuario: user.tipo_usuario,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(secret);

    // Configurar o cookie na resposta
    (await cookies()).set("Authorization", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60, // duração de 1 hora
      path: "/",
    });

    return NextResponse.json({
      message: "Login realizado.",
      user: { tipo_usuario: user.tipo_usuario },
    });
  } catch (error) {
    console.error(error);
    const errorMessage =
      error instanceof Error ? error.message : "Erro interno do servidor.";
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
