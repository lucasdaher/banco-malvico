import { NextResponse, NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import pool from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.tipo_usuario !== "FUNCIONARIO") {
      return NextResponse.json({ message: "Acesso negado." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const data_inicio = searchParams.get("data_inicio");
    const data_fim = searchParams.get("data_fim");
    const tipo_transacao = searchParams.get("tipo_transacao");

    let query = "SELECT * FROM vw_relatorio_movimentacoes WHERE 1=1";
    const params: string[] = [];

    if (data_inicio && data_fim) {
      query += " AND DATE(data_hora) BETWEEN ? AND ?";
      params.push(data_inicio, data_fim);
    }
    if (tipo_transacao) {
      query += " AND tipo_transacao = ?";
      params.push(tipo_transacao);
    }
    query += " ORDER BY data_hora DESC";

    const [rows] = await pool.query(query, params);
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Erro na API de movimentações:", error);
    return NextResponse.json(
      { message: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
