import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session";
import pool from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();

    (await cookies()).delete("Authorization");

    if (session) {
      await pool.query(
        "INSERT INTO auditoria (id_usuario, acao) VALUES (?, 'LOGOUT')",
        [session.id]
      );
    }

    return NextResponse.json({ message: "Logout realizado." }, { status: 200 });
  } catch (error) {
    console.error("Erro ao fazer logout:", error);
    return NextResponse.json(
      { message: "Erro interno ao tentar fazer logout." },
      { status: 500 }
    );
  }
}
