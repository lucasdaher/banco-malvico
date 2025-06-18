import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import pool from "@/lib/db";
import bcrypt from "bcrypt";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session || session.tipo_usuario !== "FUNCIONARIO") {
      return NextResponse.json({ message: "Acesso negado." }, { status: 403 });
    }

    const clienteId = params.id;

    const [clienteRows]: any = await pool.query(
      `SELECT
         u.nome AS nome_cliente,
         u.cpf,
         u.data_nascimento,
         u.telefone,
         u.email,
         c.id_cliente,
         c.score_credito
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

/**
 * Rota PUT para atualizar os dados de um cliente com auditoria.
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const connection = await pool.getConnection();
  try {
    const session = await getSession();
    if (!session || session.tipo_usuario !== "FUNCIONARIO") {
      throw new Error("Acesso negado.");
    }

    const { clienteData, funcionarioSenha } = await request.json();
    const clienteIdParaAlterar = params.id;

    const [funcUserRows]: any = await connection.query(
      "SELECT u.senha_hash FROM usuario u JOIN funcionario f ON u.id_usuario = f.id_usuario WHERE f.id_funcionario = (SELECT id_funcionario FROM funcionario WHERE id_usuario = ?)",
      [session.id]
    );
    if (funcUserRows.length === 0)
      throw new Error("Funcionário não encontrado.");

    const isPasswordValid = await bcrypt.compare(
      funcionarioSenha,
      funcUserRows[0].senha_hash
    );
    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "Senha do funcionário incorreta. Alteração não permitida." },
        { status: 403 }
      );
    }

    await connection.beginTransaction();

    const [clienteUserRows]: any = await connection.query(
      "SELECT u.*, e.* FROM cliente c JOIN usuario u ON c.id_usuario = u.id_usuario LEFT JOIN endereco e ON u.id_usuario = e.id_usuario WHERE c.id_cliente = ?",
      [clienteIdParaAlterar]
    );
    if (clienteUserRows.length === 0)
      throw new Error("Cliente a ser alterado não encontrado.");

    const dadosAntigos = clienteUserRows[0];
    const id_usuario_cliente = dadosAntigos.id_usuario;

    await connection.query(
      "UPDATE usuario SET nome = ?, telefone = ?, email = ? WHERE id_usuario = ?",
      [
        clienteData.nome,
        clienteData.telefone,
        clienteData.email,
        id_usuario_cliente,
      ]
    );
    await connection.query(
      "UPDATE endereco SET cep = ?, local = ?, numero_casa = ?, bairro = ?, cidade = ?, estado = ? WHERE id_usuario = ?",
      [
        clienteData.endereco.cep,
        clienteData.endereco.local,
        clienteData.endereco.numero_casa,
        clienteData.endereco.bairro,
        clienteData.endereco.cidade,
        clienteData.endereco.estado,
        id_usuario_cliente,
      ]
    );

    const detalhesAuditoria = {
      acao_realizada_por_id_usuario: session.id,
      cliente_afetado_id_usuario: id_usuario_cliente,
      dados_antigos: {
        nome: dadosAntigos.nome,
        telefone: dadosAntigos.telefone,
        email: dadosAntigos.email,
        endereco: {
          cep: dadosAntigos.cep,
          local: dadosAntigos.local,
          numero_casa: dadosAntigos.numero_casa,
          bairro: dadosAntigos.bairro,
          cidade: dadosAntigos.cidade,
          estado: dadosAntigos.estado,
        },
      },
      dados_novos: clienteData,
    };

    await connection.query(
      "INSERT INTO auditoria (id_usuario, acao, detalhes) VALUES (?, ?, ?)",
      [session.id, "ALTERACAO_DADOS_CLIENTE", JSON.stringify(detalhesAuditoria)]
    );

    await connection.commit();

    return NextResponse.json({
      message: "Dados do cliente atualizados com sucesso!",
    });
  } catch (error: any) {
    await connection.rollback();
    console.error("Erro ao atualizar cliente:", error);
    return NextResponse.json(
      { message: error.message || "Erro interno do servidor." },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}

/**
 * Rota DELETE para encerrar as contas de um cliente.
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const { gerenteSenha, motivo } = await request.json();
    const clienteIdParaEncerrar = params.id;

    const [managerUserRows]: any = await connection.query(
      "SELECT senha_hash FROM usuario WHERE id_usuario = ?",
      [session.id]
    );
    const isPasswordValid = await bcrypt.compare(
      gerenteSenha,
      managerUserRows[0].senha_hash
    );
    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "Senha do gerente incorreta. Operação cancelada." },
        { status: 403 }
      );
    }

    await connection.beginTransaction();

    const [saldoRows]: any = await connection.query(
      "SELECT COUNT(*) as contas_negativas FROM conta WHERE id_cliente = ? AND saldo < 0",
      [clienteIdParaEncerrar]
    );
    if (saldoRows[0].contas_negativas > 0) {
      throw new Error(
        "Não é possível encerrar a conta. Cliente possui saldo devedor."
      );
    }

    await connection.query(
      "UPDATE conta SET status = 'ENCERRADA' WHERE id_cliente = ?",
      [clienteIdParaEncerrar]
    );

    const [clienteUserRows]: any = await connection.query(
      "SELECT id_usuario FROM cliente WHERE id_cliente = ?",
      [clienteIdParaEncerrar]
    );
    const id_usuario_cliente =
      clienteUserRows.length > 0 ? clienteUserRows[0].id_usuario : null;

    const detalhesAuditoria = {
      acao_realizada_por_id_usuario: session.id,
      cliente_afetado_id_usuario: id_usuario_cliente,
      motivo_encerramento: motivo || "Não especificado",
    };
    await connection.query(
      "INSERT INTO auditoria (id_usuario, acao, detalhes) VALUES (?, ?, ?)",
      [
        session.id,
        "ENCERRAMENTO_CONTA_CLIENTE",
        JSON.stringify(detalhesAuditoria),
      ]
    );

    await connection.commit();

    return NextResponse.json({
      message: "Contas do cliente encerradas com sucesso.",
    });
  } catch (error: any) {
    await connection.rollback();
    console.error("Erro ao encerrar conta:", error);
    return NextResponse.json(
      { message: error.message || "Erro interno do servidor." },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}
