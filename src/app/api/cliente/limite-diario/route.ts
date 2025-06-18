import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.tipo_usuario !== "CLIENTE") {
      return NextResponse.json({ message: "Acesso negado." }, { status: 403 });
    }

    const [contaRows]: any = await pool.query(
      "SELECT id_conta FROM conta WHERE id_cliente = (SELECT id_cliente FROM cliente WHERE id_usuario = ?) LIMIT 1",
      [session.id]
    );
    if (contaRows.length === 0) {
      return NextResponse.json(
        { message: "Conta não encontrada." },
        { status: 404 }
      );
    }
    const id_conta = contaRows[0].id_conta;

    const [depositoRows]: any = await pool.query(
      `SELECT SUM(valor) as total_depositado_hoje
       FROM transacao
       WHERE id_conta_origem = ?
       AND tipo_transacao = 'DEPOSITO'
       AND DATE(data_hora) = CURDATE()`,
      [id_conta]
    );

    const totalDepositadoHoje =
      Number(depositoRows[0].total_depositado_hoje) || 0;
    const limiteTotalDiario = 10000;
    const limiteRestante = limiteTotalDiario - totalDepositadoHoje;

    return NextResponse.json({
      limiteTotalDiario,
      totalDepositadoHoje,
      limiteRestante: limiteRestante > 0 ? limiteRestante : 0,
    });
  } catch (error) {
    console.error("Erro ao buscar limite diário:", error);
    return NextResponse.json(
      { message: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
