import { NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcrypt";
import { sendOtpEmail } from "@/lib/email";

export async function POST(request: Request) {
  let userIdParaAuditoria: number | null = null;
  try {
    const { cpf, senha } = await request.json();

    /**
     * Faz a busca pelo CPF do usuário
     */
    const [userRows]: any = await pool.query(
      "SELECT id_usuario, senha_hash, email FROM usuario WHERE cpf = ?",
      [cpf]
    );

    /**
     * Quando usuário não for encontrado, significa que o CPF é inválido
     */
    if (userRows.length === 0) {
      await pool.query(
        "INSERT INTO auditoria (acao, detalhes) VALUES ('LOGIN_FALHA', ?)",
        [
          JSON.stringify({
            cpf_tentativa: cpf,
            motivo: "Usuário não encontrado",
          }),
        ]
      );
      return NextResponse.json(
        { message: "Nenhum usuário encontrado com este CPF." },
        { status: 404 }
      );
    }

    const user = userRows[0];
    userIdParaAuditoria = user.id_usuario;

    if (!user.email) {
      return NextResponse.json(
        { message: "O usuário não possui e-mail cadastrado." },
        { status: 404 }
      );
    }

    /**
     * Compara a senha enviada pela senha registrada utilizando o bcrypt
     */
    const isPasswordValid = await bcrypt.compare(senha, user.senha_hash);

    if (!isPasswordValid) {
      // TODO: Registrar falha na auditoria (senha incorreta)
      // TODO: Implementar lógica de bloqueio por 3 tentativas
      return NextResponse.json(
        { message: "A senha está incorreta." },
        { status: 401 }
      );
    }

    /**
     * Chama a procedure que gera o OTP
     */
    const [otpResult]: any = await pool.query("CALL sp_gerar_otp(?)", [
      user.id_usuario,
    ]);
    const otp = otpResult[0][0].otp;

    if (!otp) {
      throw new Error("Não foi possível gerar o código OTP.");
    }

    await sendOtpEmail({ to: user.email, otp: otp });

    await pool.query(
      "INSERT INTO auditoria (id_usuario, acao) VALUES (?, 'LOGIN_ETAPA1_SUCESSO')",
      [userIdParaAuditoria]
    );

    /**
     * Avança para a etapa de OTP
     */
    await pool.query(
      "INSERT INTO auditoria (id_usuario, acao, detalhes) VALUES (?, 'LOGIN_FALHA', ?)",
      [userIdParaAuditoria, JSON.stringify({ motivo: "Senha incorreta" })]
    );
    return NextResponse.json({
      message: "Senha válida. Por favor, insira o OTP.",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
