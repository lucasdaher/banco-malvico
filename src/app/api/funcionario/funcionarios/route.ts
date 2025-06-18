import { NextResponse } from "next/server";
import { getSession, SessionPayload } from "@/lib/session";
import pool from "@/lib/db";
import bcrypt from "bcrypt";

export async function POST(request: Request) {
  const connection = await pool.getConnection();
  try {
    const session = await getSession();
    if (!session || session.tipo_usuario !== "FUNCIONARIO") {
      throw new Error("Acesso negado.");
    }

    const [managerRows]: any = await connection.query(
      "SELECT cargo FROM funcionario WHERE id_usuario = ?",
      [session.id]
    );

    if (managerRows.length === 0 || managerRows[0].cargo !== "GERENTE") {
      return NextResponse.json(
        { message: "Ação não permitida. Requer permissão de gerente." },
        { status: 403 }
      );
    }

    const { nome, cpf, data_nascimento, telefone, email, senha, cargo } =
      await request.json();

    if (!nome || !cpf || !senha || !cargo) {
      throw new Error("Nome, CPF, senha e cargo são obrigatórios.");
    }

    await connection.beginTransaction();

    const senha_hash = await bcrypt.hash(senha, 10);
    const [userResult]: any = await connection.query(
      "INSERT INTO usuario (nome, cpf, data_nascimento, telefone, email, tipo_usuario, senha_hash) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [nome, cpf, data_nascimento, telefone, email, "FUNCIONARIO", senha_hash]
    );
    const id_usuario = userResult.insertId;

    const codigo_funcionario = `F${String(id_usuario).padStart(4, "0")}`;

    await connection.query(
      "INSERT INTO funcionario (id_usuario, codigo_funcionario, cargo) VALUES (?, ?, ?)",
      [id_usuario, codigo_funcionario, cargo.toUpperCase()]
    );

    await connection.commit();

    return NextResponse.json(
      { message: `Funcionário ${nome} cadastrado com sucesso!` },
      { status: 201 }
    );
  } catch (error: any) {
    await connection.rollback();
    console.error("Erro ao cadastrar funcionário:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        { message: "Erro: CPF ou e-mail já cadastrado." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { message: error.message || "Erro interno do servidor." },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}
