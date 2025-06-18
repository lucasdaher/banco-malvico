import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import pool from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const tokenCookie = (await cookies()).get("Authorization");
    if (!tokenCookie) {
      return NextResponse.json(
        { message: "Usuário não autorizado." },
        { status: 401 }
      );
    }
    const payload = await verifyToken(tokenCookie.value);
    if (!payload || payload.tipo_usuario !== "CLIENTE") {
      return NextResponse.json({ message: "Acesso negado." }, { status: 403 });
    }

    const { valor } = await request.json();
    if (!valor || typeof valor !== "number" || valor <= 0) {
      return NextResponse.json(
        { message: "O valor do depósito deve ser um número positivo." },
        { status: 400 }
      );
    }

    const [contaRows]: any = await pool.query(
      "SELECT id_conta FROM conta WHERE id_cliente = (SELECT id_cliente FROM cliente WHERE id_usuario = ?) LIMIT 1",
      [payload.id]
    );

    if (contaRows.length === 0) {
      return NextResponse.json(
        { message: "Conta do cliente não encontrada." },
        { status: 404 }
      );
    }
    const id_conta = contaRows[0].id_conta;

    await pool.query(
      "INSERT INTO transacao (id_conta_origem, tipo_transacao, valor, descricao) VALUES (?, ?, ?, ?)",
      [id_conta, "DEPOSITO", valor, "Depósito realizado pelo cliente"]
    );

    return NextResponse.json(
      { message: "Depósito realizado com sucesso." },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Erro ao realizar depósito:", error);

    // Emite erro de limite diário
    if (error.sqlState === "45000") {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { message: "Erro interno do servidor ao processar o depósito." },
      { status: 500 }
    );
  }
}
