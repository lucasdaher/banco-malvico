import { NextResponse, NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import pool from "@/lib/db";

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const data_inicio = searchParams.get("data_inicio");
    const data_fim = searchParams.get("data_fim");

    let query =
      "SELECT * FROM transacao WHERE (id_conta_origem = ? OR id_conta_destino = ?)";
    const params: (string | number)[] = [id_conta, id_conta];

    if (data_inicio) {
      query += " AND DATE(data_hora) >= ?";
      params.push(data_inicio);
    }

    if (data_fim) {
      query += " AND DATE(data_hora) <= ?";
      params.push(data_fim);
    }

    query += " ORDER BY data_hora DESC";

    const [transacoes] = await pool.query(query, params);

    return NextResponse.json(transacoes);
  } catch (error: any) {
    console.error("Erro ao buscar extrato:", error);
    return NextResponse.json(
      { message: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
