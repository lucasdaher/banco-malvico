const bcrypt = require("bcrypt");

// A senha que queremos usar para os nossos usuários de teste
const password = "teste123";

// O "custo" do hash. 10 é um valor padrão e seguro.
const saltRounds = 10;

console.log("Gerando hash para a senha:", password);

bcrypt.hash(password, saltRounds, function (err, hash) {
  if (err) {
    console.error("Ocorreu um erro ao gerar o hash:", err);
    return;
  }

  console.log("\n============================================================");
  console.log("Hash Bcrypt Gerado com Sucesso!");
  console.log("Use este hash no seu banco de dados:");
  console.log(hash);
  console.log("============================================================\n");
});
