import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import pool from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function GET() {
  try {
    const tokenCookie = (await cookies()).get("Authorization");
    if (!tokenCookie) {
      return NextResponse.json(
        { message: "Usuário não autenticado." },
        { status: 401 }
      );
    }

    const payload = await verifyToken(tokenCookie.value);
    if (!payload || !payload.id || payload.tipo_usuario !== "CLIENTE") {
      return NextResponse.json(
        {
          message: "Usuário não autorizado.",
        },
        { status: 403 }
      );
    }

    const [rows]: any = await pool.query(
      `SELECT
          cc.numero_conta,
          cc.saldo,
          cc.tipo_conta,
          cc.status,
          co.limite,
          cp.taxa_rendimento
      FROM conta cc
      LEFT JOIN conta_corrente co ON cc.id_conta = co.id_conta
      LEFT JOIN conta_poupanca cp ON cc.id_conta = cp.id_conta
      WHERE cc.id_cliente = (SELECT id_cliente FROM cliente WHERE id_usuario = ?)`,
      [payload.id]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { message: "Nenhuma conta encontrada para este cliente." },
        { status: 404 }
      );
    }

    const dadosConta = rows[0];
    return NextResponse.json(dadosConta);
  } catch (error) {
    console.error("Erro ao buscar dados da conta:", error);
    return NextResponse.json(
      { message: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
