import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import pool from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function POST(request: Request) {
  const connection = await pool.getConnection();
  try {
    const tokenCookie = (await cookies()).get("Authorization");
    if (!tokenCookie) {
      return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
    }
    const payload = await verifyToken(tokenCookie.value);
    if (!payload || payload.tipo_usuario !== "CLIENTE") {
      return NextResponse.json({ message: "Acesso negado." }, { status: 403 });
    }

    const { valor } = await request.json();
    if (!valor || valor <= 0) {
      return NextResponse.json(
        { message: "O valor do saque deve ser positivo." },
        { status: 400 }
      );
    }

    await connection.beginTransaction();

    const [contaRows]: any = await connection.query(
      "SELECT id_conta, saldo FROM conta WHERE id_cliente = (SELECT id_cliente FROM cliente WHERE id_usuario = ?) LIMIT 1",
      [payload.id]
    );
    if (contaRows.length === 0) {
      throw new Error("Conta não encontrada.");
    }
    const conta = contaRows[0];

    if (conta.saldo < valor) {
      throw new Error("Saldo insuficiente para realizar o saque.");
    }

    const taxaSaque = 5.0;
    const [saquesMes]: any = await connection.query(
      "SELECT COUNT(*) as total FROM transacao WHERE id_conta_origem = ? AND tipo_transacao = 'SAQUE' AND MONTH(data_hora) = MONTH(NOW()) AND YEAR(data_hora) = YEAR(NOW())",
      [conta.id_conta]
    );

    let valorTotalDebitado = valor;
    if (saquesMes[0].total >= 5) {
      valorTotalDebitado += taxaSaque;
    }

    if (conta.saldo < valorTotalDebitado) {
      throw new Error("Saldo insuficiente para o saque mais a taxa aplicável.");
    }

    await connection.query(
      "INSERT INTO transacao (id_conta_origem, tipo_transacao, valor, descricao) VALUES (?, 'SAQUE', ?, ?)",
      [conta.id_conta, valor, "Saque realizado pelo cliente"]
    );

    if (saquesMes[0].total >= 5) {
      await connection.query(
        "INSERT INTO transacao (id_conta_origem, tipo_transacao, valor, descricao) VALUES (?, 'TAXA', ?, ?)",
        [conta.id_conta, taxaSaque, "Taxa por excesso de saques"]
      );
    }

    await connection.commit();
    return NextResponse.json({ message: "Saque realizado com sucesso." });
  } catch (error: any) {
    await connection.rollback();
    console.error("Erro ao realizar saque:", error);
    return NextResponse.json(
      { message: error.message || "Erro interno do servidor." },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}
