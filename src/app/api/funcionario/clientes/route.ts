// /app/api/funcionario/clientes/route.ts

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import pool from "@/lib/db";
import * as jose from "jose";
import bcrypt from "bcrypt";
import { verifyToken } from "@/lib/auth";

/**
 * Rota GET para buscar a lista de todos os clientes.
 * Usada na página de "Gerenciar Clientes" do funcionário.
 */
export async function GET() {
  try {
    const tokenCookie = (await cookies()).get("Authorization");
    if (!tokenCookie) {
      return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
    }
    const payload = await verifyToken(tokenCookie.value);
    if (!payload || payload.tipo_usuario !== "FUNCIONARIO") {
      return NextResponse.json({ message: "Acesso negado." }, { status: 403 });
    }

    const [rows] = await pool.query(
      "SELECT * FROM vw_resumo_contas ORDER BY nome_cliente ASC"
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Erro ao buscar clientes:", error);
    return NextResponse.json(
      { message: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}

/**
 * Rota POST para criar um novo cliente e sua primeira conta.
 * Usada no formulário de "Abertura de Conta".
 */
export async function POST(request: Request) {
  const connection = await pool.getConnection();
  try {
    const tokenCookie = (await cookies()).get("Authorization");
    if (!tokenCookie) {
      throw new Error("Não autorizado.");
    }
    const payload = await verifyToken(tokenCookie.value);
    if (!payload || payload.tipo_usuario !== "FUNCIONARIO") {
      throw new Error("Acesso negado.");
    }

    const {
      nome,
      cpf,
      data_nascimento,
      telefone,
      email,
      senha,
      endereco,
      tipo_conta,
      saldo_inicial,
      // Conta Corrente
      limite,
      data_vencimento,
      taxa_manutencao,
      // Conta Poupança
      taxa_rendimento,
      // Conta Investimento
      perfil_risco,
      valor_minimo,
      taxa_rendimento_base,
    } = await request.json();

    await connection.beginTransaction();

    const senha_hash = await bcrypt.hash(senha, 10);
    const [userResult]: any = await connection.query(
      "INSERT INTO usuario (nome, cpf, data_nascimento, telefone, email, tipo_usuario, senha_hash) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [nome, cpf, data_nascimento, telefone, email, "CLIENTE", senha_hash]
    );
    const id_usuario = userResult.insertId;

    const [clientResult]: any = await connection.query(
      "INSERT INTO cliente (id_usuario) VALUES (?)",
      [id_usuario]
    );
    const id_cliente = clientResult.insertId;

    await connection.query(
      "INSERT INTO endereco (id_usuario, cep, local, numero_casa, bairro, cidade, estado) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        id_usuario,
        endereco.cep,
        endereco.local,
        endereco.numero_casa,
        endereco.bairro,
        endereco.cidade,
        endereco.estado,
      ]
    );

    const numero_conta = `${Math.floor(
      10000 + Math.random() * 90000
    )}-${Math.floor(Math.random() * 10)}`;
    const [contaResult]: any = await connection.query(
      "INSERT INTO conta (numero_conta, id_agencia, id_cliente, tipo_conta, saldo) VALUES (?, ?, ?, ?, ?)",
      [numero_conta, 1, id_cliente, tipo_conta.toUpperCase(), saldo_inicial]
    );
    const id_conta = contaResult.insertId;

    const tipoContaUpper = tipo_conta.toUpperCase();

    if (tipoContaUpper === "CORRENTE") {
      if (
        limite === undefined ||
        !data_vencimento ||
        taxa_manutencao === undefined
      ) {
        throw new Error(
          "Para Conta Corrente, os campos específicos são obrigatórios."
        );
      }
      await connection.query(
        "INSERT INTO conta_corrente (id_conta, limite, data_vencimento, taxa_manutencao) VALUES (?, ?, ?, ?)",
        [id_conta, limite, data_vencimento, taxa_manutencao]
      );
    } else if (tipoContaUpper === "POUPANCA") {
      if (taxa_rendimento === undefined) {
        throw new Error(
          "Para Conta Poupança, a taxa de rendimento é obrigatória."
        );
      }
      await connection.query(
        "INSERT INTO conta_poupanca (id_conta, taxa_rendimento) VALUES (?, ?)",
        [id_conta, taxa_rendimento]
      );
    } else if (tipoContaUpper === "INVESTIMENTO") {
      if (
        !perfil_risco ||
        valor_minimo === undefined ||
        taxa_rendimento_base === undefined
      ) {
        throw new Error(
          "Para Conta Investimento, todos os campos específicos são obrigatórios."
        );
      }
      await connection.query(
        "INSERT INTO conta_investimento (id_conta, perfil_risco, valor_minimo, taxa_rendimento_base) VALUES (?, ?, ?, ?)",
        [id_conta, perfil_risco, valor_minimo, taxa_rendimento_base]
      );
    }

    await connection.commit();

    return NextResponse.json(
      {
        message: "Cliente e conta criados com sucesso!",
        id_cliente: id_cliente,
      },
      { status: 201 }
    );
  } catch (error: any) {
    await connection.rollback();
    console.error("Erro ao criar cliente:", error);

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
