import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import pool from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session || session.tipo_usuario !== "FUNCIONARIO") {
      return NextResponse.json({ message: "Acesso negado." }, { status: 403 });
    }

    const clienteId = params.id;

    const [clienteRows]: any = await pool.query(
      `SELECT u.nome, u.cpf, u.data_nascimento, u.telefone, u.email, c.id_cliente, c.score_credito
       FROM usuario u
       JOIN cliente c ON u.id_usuario = c.id_usuario
       WHERE c.id_cliente = ?`,
      [clienteId]
    );

    if (clienteRows.length === 0) {
      return NextResponse.json(
        { message: "Cliente não encontrado." },
        { status: 404 }
      );
    }

    const [enderecoRows]: any = await pool.query(
      "SELECT * FROM endereco WHERE id_usuario = (SELECT id_usuario FROM cliente WHERE id_cliente = ?)",
      [clienteId]
    );

    const [contasRows]: any = await pool.query(
      `SELECT
         co.*,
         cc.limite, cc.taxa_manutencao,
         cp.taxa_rendimento,
         ci.perfil_risco, ci.valor_minimo
       FROM conta co
       LEFT JOIN conta_corrente cc ON co.id_conta = cc.id_conta
       LEFT JOIN conta_poupanca cp ON co.id_conta = cp.id_conta
       LEFT JOIN conta_investimento ci ON co.id_conta = ci.id_conta
       WHERE co.id_cliente = ?`,
      [clienteId]
    );

    const clienteDetalhado = {
      ...clienteRows[0],
      endereco: enderecoRows[0] || null,
      contas: contasRows,
    };

    return NextResponse.json(clienteDetalhado);
  } catch (error) {
    console.error("Erro ao buscar detalhes do cliente:", error);
    return NextResponse.json(
      { message: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
