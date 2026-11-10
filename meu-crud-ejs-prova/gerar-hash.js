// Uso: node gerar-hash.js [senha]
// Para também gravar/atualizar o usuário: node gerar-hash.js --salvar [cpf] [senha]
import bcrypt from 'bcrypt';

const args = process.argv.slice(2);
const salvarNoBanco = args[0] === '--salvar';
if (salvarNoBanco) args.shift();

const cpf = salvarNoBanco ? args[0] || '12345678900' : null;
const senha = salvarNoBanco ? args[1] || '123456' : args[0] || '123456';
const hash = await bcrypt.hash(senha, 10);
console.log(hash);

if (salvarNoBanco) {
  const { pool } = await import('./db.js');
  try {
    await pool.query(
      `INSERT INTO usuarios (nome, cpf, senha) VALUES ($1, $2, $3)
       ON CONFLICT (cpf) DO UPDATE SET senha = EXCLUDED.senha`,
      ['Operador', cpf, hash]
    );
    console.log(`Usuário gravado! CPF: ${cpf}`);
  } finally {
    await pool.end();
  }
}
