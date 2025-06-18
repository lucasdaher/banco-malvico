import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import pool from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const tokenCookie = (await cookies()).get("Authorization");
    if (!tokenCookie) {
      return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
    }
    const payload = await verifyToken(tokenCookie.value);
    if (!payload || payload.tipo_usuario !== "FUNCIONARIO") {
      return NextResponse.json({ message: "Acesso negado." }, { status: 403 });
    }

    const { numero_conta, valor } = await request.json();

    if (!numero_conta || !valor || valor <= 0) {
      return NextResponse.json(
        { message: "Número da conta e valor (positivo) são obrigatórios." },
        { status: 400 }
      );
    }

    const [contaRows]: any = await pool.query(
      "SELECT id_conta FROM conta WHERE numero_conta = ?",
      [numero_conta]
    );
    if (contaRows.length === 0) {
      return NextResponse.json(
        { message: "Conta não encontrada." },
        { status: 404 }
      );
    }
    const id_conta = contaRows[0].id_conta;

    await pool.query(
      "INSERT INTO transacao (id_conta_origem, tipo_transacao, valor, descricao) VALUES (?, ?, ?, ?)",
      [
        id_conta,
        "DEPOSITO",
        valor,
        `Depósito realizado pelo funcionário ${payload.id}`,
      ]
    );

    return NextResponse.json({
      message: `Depósito de ${valor} realizado com sucesso na conta ${numero_conta}.`,
    });
  } catch (error: any) {
    console.error("Erro ao realizar depósito:", error);

    if (error.sqlState === "45000") {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { message: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
