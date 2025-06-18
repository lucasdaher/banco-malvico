import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import pool from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function POST(request: Request) {
  const connection = await pool.getConnection();
  try {
    const tokenCookie = (await cookies()).get("Authorization");
    if (!tokenCookie) throw new Error("Não autorizado.");
    const payload = await verifyToken(tokenCookie.value);
    if (!payload || payload.tipo_usuario !== "CLIENTE")
      throw new Error("Acesso negado.");

    const { numero_conta_destino, valor } = await request.json();
    if (!numero_conta_destino || !valor || valor <= 0) {
      throw new Error(
        "Número da conta de destino e valor (positivo) são obrigatórios."
      );
    }

    await connection.beginTransaction();

    const [origemRows]: any = await connection.query(
      "SELECT id_conta, saldo FROM conta WHERE id_cliente = (SELECT id_cliente FROM cliente WHERE id_usuario = ?) LIMIT 1 FOR UPDATE",
      [payload.id]
    );
    if (origemRows.length === 0)
      throw new Error("Conta de origem não encontrada.");
    const contaOrigem = origemRows[0];

    if (contaOrigem.saldo < valor) throw new Error("Saldo insuficiente.");

    const [destinoRows]: any = await connection.query(
      'SELECT id_conta FROM conta WHERE numero_conta = ? AND status = "ATIVA" FOR UPDATE',
      [numero_conta_destino]
    );
    if (destinoRows.length === 0)
      throw new Error("Conta de destino não encontrada ou inativa.");
    const contaDestino = destinoRows[0];

    if (contaOrigem.id_conta === contaDestino.id_conta)
      throw new Error("Não é possível transferir para a mesma conta.");

    await connection.query(
      'INSERT INTO transacao (id_conta_origem, id_conta_destino, tipo_transacao, valor, descricao) VALUES (?, ?, "TRANSFERENCIA", ?, ?)',
      [
        contaOrigem.id_conta,
        contaDestino.id_conta,
        valor,
        `Transferência para conta ${numero_conta_destino}`,
      ]
    );

    await connection.commit();
    return NextResponse.json({
      message: "Transferência realizada com sucesso.",
    });
  } catch (error: any) {
    await connection.rollback();
    console.error("Erro na transferência:", error);
    return NextResponse.json(
      { message: error.message || "Erro interno do servidor." },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}
