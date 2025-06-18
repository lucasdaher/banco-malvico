# Banco Malvader

O Banco Malvader é uma aplicação de sistema bancário desenvolvida com Next.js, React e TypeScript no front-end, e Node.js com MySQL no back-end.

## Pré-requisitos

Antes de começar, certifique-se de que você tem os seguintes softwares instalados em sua máquina:

- Node.js
- Yarn (ou npm)
- Um servidor de banco de dados MySQL

## Passo a Passo para Execução

1. Configuração do Banco de Dados

- **Crie o banco de dados:** Execute o seguinte comando no seu terminal MySQL para criar o banco de dados:

```sql
CREATE DATABASE IF NOT EXISTS banco_malvader;
```

- Execute o script SQL:

  Utilize o arquivo generate-db.sql para criar todas as tabelas, views, triggers e procedures necessárias. Você pode executar o arquivo de uma vez no seu cliente MySQL preferido. Este script irá:

  - Criar a estrutura de tabelas para usuários, contas, transações, etc..
  - Definir triggers para automatizar tarefas como atualização de saldo e auditoria.
  - Criar views para relatórios como `vw_resumo_contas` e `vw_clientes_inadimplentes`.
  - Inserir um usuário funcionário inicial com a senha `teste123`.

2. Configuração do Ambiente

- **Clone o repositório**:

  ```bash
  git clone <URL_DO_REPOSITORIO>
  cd banco-malvader
  ```

- **Instale as dependências:** Use o Yarn (ou npm) para instalar todas as dependências do projeto listadas no package.json.

  ```bash
  yarn install
  ```

  ou (não recomendado)

  ```bash
  npm install
  ```

- Configure as variáveis de ambiente: Crie um arquivo `.env.local` na raiz do projeto. Este arquivo não deve ser versionado, conforme especificado no `.gitignore`. Adicione as seguintes variáveis, substituindo pelos seus valores:

```
# Configurações do Banco de Dados (src/lib/db.ts)
DB_HOST=localhost
DB_PORT=3306
DB_USER=seu_usuario_mysql
DB_PASSWORD=sua_senha_mysql
DB_DATABASE=banco_malvader

# Chave para JWT
JWT_SECRET=sua_chave_secreta_super_segura

# Credenciais do Gmail para envio de OTP
GMAIL_USER=seu_email@gmail.com
GMAIL_APP_PASSWORD=sua_senha_de_app_do_gmail
```

3. Gerando Hashes de Senha (Opcional)
   Para criar novos usuários de teste com senhas seguras, você pode utilizar o script `generate-hash.js`.

- Execute o script:

  ```bash
  node generate-hash.js
  ```

- **Resultado:** O script irá gerar um hash Bcrypt para a senha teste123. Você pode copiar este hash e inseri-lo diretamente na coluna senha_hash da tabela usuario no seu banco de dados.

4. Executando o Projeto
   Com o banco de dados e o ambiente configurados, você pode iniciar a aplicação.

   - Inicie o servidor de desenvolvimento:

     ```bash
     yarn dev
     ```

     ou

     ```bash
     npm run dev
     ```

   - **Acesse a aplicação:** Abra seu navegador e acesse http://localhost:3000.

   - **Login:** Você pode acessar o sistema utilizando as credenciais do usuário funcionário criado pelo script SQL:

     - **CPF:** `12345678901`
     - **Senha:** `teste123`

     Após o login com CPF e senha, um código OTP (One-Time Password) será enviado para o e-mail configurado, e você será direcionado para a tela de validação.
