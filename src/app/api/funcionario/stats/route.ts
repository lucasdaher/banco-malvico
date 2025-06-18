import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import pool from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.tipo_usuario !== "FUNCIONARIO") {
      return NextResponse.json({ message: "Acesso negado." }, { status: 403 });
    }

    const query = `
      SELECT
        (SELECT COUNT(*) FROM cliente) as totalClientes,
        (SELECT SUM(saldo) FROM conta) as volumeTotal,
        (SELECT COUNT(*) FROM conta WHERE MONTH(data_abertura) = MONTH(CURDATE()) AND YEAR(data_abertura) = YEAR(CURDATE())) as novasContasMes,
        (SELECT COUNT(*) FROM transacao WHERE DATE(data_hora) = CURDATE()) as transacoesHoje;
    `;

    const [rows]: any = await pool.query(query);

    const stats = {
      totalClientes: Number(rows[0].totalClientes || 0),
      volumeTotal: Number(rows[0].volumeTotal || 0),
      novasContasMes: Number(rows[0].novasContasMes || 0),
      transacoesHoje: Number(rows[0].transacoesHoje || 0),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Erro ao buscar estatísticas do dashboard:", error);
    return NextResponse.json(
      { message: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
