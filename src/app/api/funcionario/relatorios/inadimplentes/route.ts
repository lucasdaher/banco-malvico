import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import pool from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.tipo_usuario !== "FUNCIONARIO") {
      return NextResponse.json({ message: "Acesso negado." }, { status: 403 });
    }

    const [rows] = await pool.query("SELECT * FROM vw_clientes_inadimplentes");

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Erro ao gerar relatório de inadimplentes:", error);
    return NextResponse.json(
      { message: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
