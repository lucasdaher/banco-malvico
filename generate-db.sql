-- =================================================================
-- Criação de banco de dados
-- =================================================================
CREATE DATABASE IF NOT EXISTS banco_malvader;
USE banco_malvader;

-- =================================================================
-- Criação de tabelas padrões
-- =================================================================
CREATE TABLE usuario (
    id_usuario INT AUTO_INCREMENT UNIQUE PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cpf VARCHAR(11) UNIQUE NOT NULL,
    data_nascimento DATE NOT NULL,
    telefone VARCHAR(15) NOT NULL,
    email VARCHAR(100) NOT NULL,
    tipo_usuario ENUM('FUNCIONARIO', 'CLIENTE') NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    otp_ativo VARCHAR(6),
    otp_expiracao DATETIME
);

CREATE TABLE auditoria (
    id_auditoria INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT,
    acao VARCHAR(50) NOT NULL,
    data_hora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    detalhes TEXT,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

CREATE TABLE funcionario (
    id_funcionario INT AUTO_INCREMENT UNIQUE PRIMARY KEY,
    id_usuario INT NOT NULL,
    codigo_funcionario VARCHAR(20) UNIQUE NOT NULL,
    cargo ENUM('ESTAGIARIO', 'ATENDENTE', 'GERENTE') NOT NULL,
    id_supervisor INT,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
    FOREIGN KEY (id_supervisor) REFERENCES funcionario(id_funcionario)
);

CREATE TABLE cliente (
    id_cliente INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    score_credito DECIMAL(5,2) DEFAULT 0,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

CREATE TABLE endereco (
    id_endereco INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    cep VARCHAR(10) NOT NULL,
    local VARCHAR(100) NOT NULL,
    numero_casa INT NOT NULL,
    bairro VARCHAR(50) NOT NULL,
    cidade VARCHAR(50) NOT NULL,
    estado CHAR(2) NOT NULL,
    complemento VARCHAR(50),
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

CREATE TABLE agencia (
    id_agencia INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL,
    codigo_agencia VARCHAR(10) UNIQUE NOT NULL,
    endereco_texto VARCHAR(255)
);

CREATE TABLE conta (
    id_conta INT AUTO_INCREMENT PRIMARY KEY,
    numero_conta VARCHAR(20) UNIQUE NOT NULL,
    id_agencia INT NOT NULL,
    id_cliente INT NOT NULL,
    tipo_conta ENUM('POUPANCA', 'CORRENTE', 'INVESTIMENTO') NOT NULL,
    saldo DECIMAL(15,2) NOT NULL DEFAULT 0,
    data_abertura DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('ATIVA', 'ENCERRADA', 'BLOQUEADA') NOT NULL DEFAULT 'ATIVA',
    FOREIGN KEY (id_agencia) REFERENCES agencia(id_agencia),
    FOREIGN KEY (id_cliente) REFERENCES cliente(id_cliente)
);

CREATE TABLE conta_poupanca (
    id_conta_poupanca INT AUTO_INCREMENT PRIMARY KEY,
    id_conta INT UNIQUE NOT NULL,
    taxa_rendimento DECIMAL(5,2) NOT NULL,
    ultimo_rendimento DATETIME,
    FOREIGN KEY (id_conta) REFERENCES conta(id_conta)
);

CREATE TABLE conta_corrente (
    id_conta_corrente INT AUTO_INCREMENT PRIMARY KEY,
    id_conta INT UNIQUE NOT NULL,
    limite DECIMAL(15,2) NOT NULL DEFAULT 0,
    data_vencimento DATE NOT NULL,
    taxa_manutencao DECIMAL(5,2) NOT NULL DEFAULT 0,
    FOREIGN KEY (id_conta) REFERENCES conta(id_conta)
);

CREATE TABLE conta_investimento (
    id_conta_investimento INT AUTO_INCREMENT PRIMARY KEY,
    id_conta INT UNIQUE NOT NULL,
    perfil_risco ENUM('BAIXO', 'MEDIO', 'ALTO') NOT NULL,
    valor_minimo DECIMAL(15,2) NOT NULL,
    taxa_rendimento_base DECIMAL(5,2) NOT NULL,
    FOREIGN KEY (id_conta) REFERENCES conta(id_conta)
);

CREATE TABLE transacao (
    id_transacao INT AUTO_INCREMENT PRIMARY KEY,
    id_conta_origem INT,
    id_conta_destino INT,
    tipo_transacao ENUM('DEPOSITO', 'SAQUE', 'TRANSFERENCIA', 'TAXA', 'RENDIMENTO') NOT NULL,
    valor DECIMAL(15,2) NOT NULL,
    data_hora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    descricao VARCHAR(100),
    FOREIGN KEY (id_conta_origem) REFERENCES conta(id_conta),
    FOREIGN KEY (id_conta_destino) REFERENCES conta(id_conta)
);

CREATE TABLE relatorio (
    id_relatorio INT AUTO_INCREMENT PRIMARY KEY,
    id_funcionario INT NOT NULL,
    tipo_relatorio VARCHAR(50) NOT NULL,
    data_geracao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    conteudo TEXT NOT NULL,
    FOREIGN KEY (id_funcionario) REFERENCES funcionario(id_funcionario)
);

--
-- Criação de índices para buscas
--
CREATE INDEX idx_numero_conta ON conta(numero_conta);
CREATE INDEX idx_data_hora_transacao ON transacao(data_hora);
CREATE INDEX idx_cep_endereco ON endereco(cep);

-- =================================================================
-- Criação de triggers
-- =================================================================
DELIMITER $$

CREATE TRIGGER tg_atualizar_saldo_after_insert_transacao
AFTER INSERT ON transacao
FOR EACH ROW
BEGIN
    IF NEW.tipo_transacao IN ('DEPOSITO', 'RENDIMENTO') THEN
        UPDATE conta SET saldo = saldo + NEW.valor WHERE id_conta = NEW.id_conta_origem;
    ELSEIF NEW.tipo_transacao IN ('SAQUE', 'TAXA') THEN
        UPDATE conta SET saldo = saldo - NEW.valor WHERE id_conta = NEW.id_conta_origem;
    ELSEIF NEW.tipo_transacao = 'TRANSFERENCIA' THEN
        UPDATE conta SET saldo = saldo - NEW.valor WHERE id_conta = NEW.id_conta_origem;
        UPDATE conta SET saldo = saldo + NEW.valor WHERE id_conta = NEW.id_conta_destino;
    END IF;
END$$

DELIMITER ;

DELIMITER $$

CREATE TRIGGER tg_limite_deposito_before_insert_transacao
BEFORE INSERT ON transacao
FOR EACH ROW
BEGIN
    DECLARE total_depositado_hoje DECIMAL(15,2);

    IF NEW.tipo_transacao = 'DEPOSITO' THEN
        SELECT SUM(valor) INTO total_depositado_hoje
        FROM transacao
        WHERE id_conta_origem = NEW.id_conta_origem
          AND tipo_transacao = 'DEPOSITO'
          AND DATE(data_hora) = DATE(NOW());

        IF (IFNULL(total_depositado_hoje, 0) + NEW.valor) > 10000.00 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Erro: Limite diário de depósito (R$ 10.000,00) excedido.';
        END IF;
    END IF;
END$$

DELIMITER ;

DELIMITER $$
CREATE TRIGGER trg_audita_transacao
AFTER INSERT ON transacao
FOR EACH ROW
BEGIN
    DECLARE v_id_usuario INT;

    SELECT c.id_usuario INTO v_id_usuario
    FROM conta co
    JOIN cliente c ON co.id_cliente = c.id_cliente
    WHERE co.id_conta = NEW.id_conta_origem;

    INSERT INTO auditoria (id_usuario, acao, detalhes)
    VALUES (v_id_usuario,
            UPPER(NEW.tipo_transacao),
            JSON_OBJECT(
                'valor', NEW.valor,
                'descricao', NEW.descricao,
                'conta_origem', NEW.id_conta_origem,
                'conta_destino', NEW.id_conta_destino
            )
    );
END$$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER trg_audita_abertura_conta
AFTER INSERT ON conta
FOR EACH ROW
BEGIN
    DECLARE v_id_usuario INT;

    SELECT id_usuario INTO v_id_usuario
    FROM cliente
    WHERE id_cliente = NEW.id_cliente;

    INSERT INTO auditoria (id_usuario, acao, detalhes)
    VALUES (v_id_usuario,
            'ABERTURA_CONTA',
            JSON_OBJECT(
                'id_conta_criada', NEW.id_conta,
                'tipo_conta', NEW.tipo_conta,
                'numero_conta', NEW.numero_conta,
                'saldo_inicial', NEW.saldo
            )
    );
END$$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER trg_audita_alteracao_usuario
AFTER UPDATE ON usuario
FOR EACH ROW
BEGIN
    IF OLD.telefone <> NEW.telefone OR OLD.email <> NEW.email THEN
        INSERT INTO auditoria (id_usuario, acao, detalhes)
        VALUES (NEW.id_usuario,
                'ALTERACAO_DADOS_USUARIO',
                JSON_OBJECT(
                    'campo_alterado',
                        CASE
                            WHEN OLD.telefone <> NEW.telefone THEN 'telefone'
                            WHEN OLD.email <> NEW.email THEN 'email'
                            ELSE 'multiplos'
                        END,
                    'valor_antigo', JSON_OBJECT('telefone', OLD.telefone, 'email', OLD.email),
                    'valor_novo', JSON_OBJECT('telefone', NEW.telefone, 'email', NEW.email)
                )
        );
    END IF;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE calcular_score_credito(IN p_id_cliente INT)
BEGIN
    DECLARE total_trans DECIMAL(15,2);
    DECLARE media_trans DECIMAL(15,2);

    SELECT SUM(valor), AVG(valor) INTO total_trans, media_trans
    FROM transacao t
    JOIN conta c ON t.id_conta_origem = c.id_conta
    WHERE c.id_cliente = p_id_cliente AND t.tipo_transacao IN ('DEPOSITO', 'SAQUE');

    UPDATE cliente SET score_credito = LEAST(100, (IFNULL(total_trans, 0) / 1000) + (IFNULL(media_trans, 0) / 100))
    WHERE id_cliente = p_id_cliente;
END$$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER trg_atualiza_score_credito
AFTER INSERT ON transacao
FOR EACH ROW
BEGIN
    DECLARE v_id_cliente INT;

    IF NEW.tipo_transacao IN ('DEPOSITO', 'SAQUE') THEN

        SELECT id_cliente INTO v_id_cliente
        FROM conta
        WHERE id_conta = NEW.id_conta_origem;

        IF v_id_cliente IS NOT NULL THEN
            CALL calcular_score_credito(v_id_cliente);
        END IF;

    END IF;
END$$
DELIMITER ;

-- =================================================================
-- Criação de stored procedures
-- =================================================================

DELIMITER $$

CREATE PROCEDURE sp_gerar_otp(IN p_id_usuario INT)
BEGIN
    DECLARE v_novo_otp VARCHAR(6);
    SET v_novo_otp = LPAD(FLOOR(RAND() * 1000000), 6, '0');

    UPDATE usuario
    SET otp_ativo = v_novo_otp,
        otp_expiracao = NOW() + INTERVAL 5 MINUTE
    WHERE id_usuario = p_id_usuario;

    SELECT v_novo_otp AS otp;
END$$

DELIMITER ;

DELIMITER $$

CREATE PROCEDURE sp_calcular_score_credito(IN p_id_cliente INT)
BEGIN
    DECLARE v_saldo_medio DECIMAL(15,2);
    DECLARE v_transacoes_positivas INT;
    DECLARE v_novo_score DECIMAL(5,2);

    SELECT IFNULL(AVG(saldo), 0) INTO v_saldo_medio FROM conta WHERE id_cliente = p_id_cliente;

    SELECT COUNT(*) INTO v_transacoes_positivas
    FROM transacao t
    JOIN conta c ON t.id_conta_destino = c.id_conta
    WHERE c.id_cliente = p_id_cliente AND t.tipo_transacao IN ('DEPOSITO', 'TRANSFERENCIA');

    SET v_novo_score = LEAST(999.99, (v_saldo_medio / 100) + (v_transacoes_positivas * 2));

    UPDATE cliente SET score_credito = v_novo_score WHERE id_cliente = p_id_cliente;
END$$

DELIMITER ;

DELIMITER $$

CREATE PROCEDURE sp_alterar_senha(IN p_id_usuario INT, IN p_novo_hash VARCHAR(255))
BEGIN
    UPDATE usuario
    SET senha_hash = p_novo_hash
    WHERE id_usuario = p_id_usuario;
END$$

DELIMITER ;

-- =================================================================
-- Criação de views
-- =================================================================
CREATE OR REPLACE VIEW vw_resumo_contas AS
SELECT
    c.id_cliente,
    u.nome AS nome_cliente,
    u.cpf,
    COUNT(co.id_conta) AS total_contas,
    SUM(co.saldo) AS saldo_total_consolidado,
    MAX(cli.score_credito) as score_de_credito
FROM cliente c
JOIN usuario u ON c.id_usuario = u.id_usuario
JOIN conta co ON c.id_cliente = co.id_cliente
JOIN cliente cli ON c.id_cliente = cli.id_cliente
GROUP BY c.id_cliente, u.nome, u.cpf;

CREATE OR REPLACE VIEW vw_movimentacoes_recentes AS
SELECT
    t.id_transacao,
    c_origem.numero_conta AS conta_origem,
    u_origem.nome AS cliente_origem,
    t.tipo_transacao,
    t.valor,
    t.data_hora,
    c_destino.numero_conta AS conta_destino,
    u_destino.nome AS cliente_destino,
    t.descricao
FROM transacao t
LEFT JOIN conta c_origem ON t.id_conta_origem = c_origem.id_conta
LEFT JOIN cliente cl_origem ON c_origem.id_cliente = cl_origem.id_cliente
LEFT JOIN usuario u_origem ON cl_origem.id_usuario = u_origem.id_usuario
LEFT JOIN conta c_destino ON t.id_conta_destino = c_destino.id_conta
LEFT JOIN cliente cl_destino ON c_destino.id_cliente = cl_destino.id_cliente
LEFT JOIN usuario u_destino ON cl_destino.id_usuario = u_destino.id_usuario
WHERE t.data_hora >= NOW() - INTERVAL 90 DAY;

CREATE OR REPLACE VIEW vw_clientes_inadimplentes AS
SELECT
    u.nome AS nome_cliente,
    u.cpf,
    co.numero_conta,
    co.saldo,
    co.tipo_conta,
    co.status
FROM conta co
JOIN cliente c ON co.id_cliente = c.id_cliente
JOIN usuario u ON c.id_usuario = u.id_usuario
WHERE co.saldo < 0
ORDER BY co.saldo ASC;

-- =================================================================
-- Criação de contas
-- =================================================================

-- Conta funcionário
USE banco_malvader;

INSERT INTO usuario (
    nome,
    cpf,
    data_nascimento,
    telefone,
    email,
    tipo_usuario,
    senha_hash
) VALUES (
    'Willio Malvissimo',
    '12345678901', -- cpf para login
    '1995-08-22',
    '61977776666',
    'novo.funcionario@malvader.com',
    'FUNCIONARIO',
    '$2b$10$uv9PdId2q1K6jCpG7aae3.tzgo7OhXR.qKSMiTRUaK1IcA95/mfYS' -- senha para login: teste123
);

-- A função LAST_INSERT_ID() pega o último ID gerado por um AUTO_INCREMENT.
-- Armazenamos esse ID em uma variável para usar nas próximas inserções.
SET @id_novo_usuario = LAST_INSERT_ID();

INSERT INTO funcionario (
    id_usuario,
    codigo_funcionario,
    cargo
) VALUES (
    @id_novo_usuario,
    'F002',
    'ATENDENTE' -- deve ser um dos valores do ENUM: 'ESTAGIARIO', 'ATENDENTE', 'GERENTE'
);

INSERT INTO endereco (
    id_usuario,
    cep,
    local,
    numero_casa,
    bairro,
    cidade,
    estado
) VALUES (
    @id_novo_usuario,
    '72111222',
    'Avenida Comercial',
    1020,
    'Taguatinga Centro',
    'Taguatinga',
    'DF'
);
SELECT 'Funcionário criado com sucesso.' AS resultado;

--

ALTER TABLE conta
ADD COLUMN id_funcionario_abertura INT,
ADD FOREIGN KEY (id_funcionario_abertura) REFERENCES funcionario(id_funcionario);

CREATE OR REPLACE VIEW vw_relatorio_movimentacoes AS
SELECT
    t.id_transacao,
    t.data_hora,
    t.tipo_transacao,
    t.valor,
    t.descricao,
    u.nome AS nome_cliente,
    u.cpf,
    co.numero_conta,
    ag.nome AS nome_agencia,
    ag.id_agencia
FROM transacao t
JOIN conta co ON t.id_conta_origem = co.id_conta
JOIN cliente c ON co.id_cliente = c.id_cliente
JOIN usuario u ON c.id_usuario = u.id_usuario
JOIN agencia ag ON co.id_agencia = ag.id_agencia;

CREATE OR REPLACE VIEW vw_clientes_inadimplentes AS
SELECT
    u.nome AS nome_cliente,
    u.cpf,
    co.numero_conta,
    co.saldo
FROM conta co
JOIN cliente c ON co.id_cliente = c.id_cliente
JOIN usuario u ON c.id_usuario = u.id_usuario
WHERE co.saldo < 0
ORDER BY co.saldo ASC;

CREATE OR REPLACE VIEW vw_desempenho_funcionarios AS
SELECT
    f.id_funcionario,
    u.nome AS nome_funcionario,
    f.cargo,
    COUNT(c.id_conta) AS contas_abertas_total,
    COUNT(CASE WHEN MONTH(c.data_abertura) = MONTH(CURDATE()) AND YEAR(c.data_abertura) = YEAR(CURDATE()) THEN 1 END) AS contas_abertas_mes
FROM funcionario f
JOIN usuario u ON f.id_usuario = u.id_usuario
LEFT JOIN conta c ON f.id_funcionario = c.id_funcionario_abertura
GROUP BY f.id_funcionario, u.nome, f.cargo;

CREATE OR REPLACE VIEW vw_relatorio_movimentacoes AS
SELECT
    t.id_transacao,
    t.data_hora,
    t.tipo_transacao,
    t.valor,
    t.descricao,
    u.nome AS nome_cliente,
    u.cpf,
    co.numero_conta,
    ag.nome AS nome_agencia,
    ag.id_agencia
FROM transacao t
JOIN conta co ON t.id_conta_origem = co.id_conta
JOIN cliente c ON co.id_cliente = c.id_cliente
JOIN usuario u ON c.id_usuario = u.id_usuario
JOIN agencia ag ON co.id_agencia = ag.id_agencia;


ALTER TABLE conta
ADD COLUMN id_funcionario_abertura INT,
ADD CONSTRAINT fk_funcionario_abertura
FOREIGN KEY (id_funcionario_abertura) REFERENCES funcionario(id_funcionario);

CREATE OR REPLACE VIEW vw_desempenho_funcionarios AS
SELECT
    f.id_funcionario,
    u.nome AS nome_funcionario,
    f.cargo,
    IFNULL(COUNT(c.id_conta), 0) AS contas_abertas_total,
    IFNULL(SUM(CASE WHEN MONTH(c.data_abertura) = MONTH(CURDATE()) AND YEAR(c.data_abertura) = YEAR(CURDATE()) THEN 1 ELSE 0 END), 0) AS contas_abertas_mes
FROM funcionario f
JOIN usuario u ON f.id_usuario = u.id_usuario
LEFT JOIN conta c ON f.id_funcionario = c.id_funcionario_abertura
GROUP BY f.id_funcionario, u.nome, f.cargo;
