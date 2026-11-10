import express from 'express';
import session from 'express-session';
import bcrypt from 'bcrypt';
import { pool } from './db.js';
import { verificarAutenticacao } from './middleware/auth.js';

const app = express();

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: 'segredo-pequenos-passos',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 } // 1 hora
  })
);

// ---------- LOGIN / LOGOUT ----------
app.get('/login', (req, res) => {
  res.render('login', { erro: null });
});

app.post('/login', async (req, res) => {
  const { cpf, senha } = req.body;
  try {
    const r = await pool.query('SELECT * FROM usuarios WHERE cpf = $1', [cpf]);
    const usuario = r.rows[0];
    if (usuario && (await bcrypt.compare(senha, usuario.senha))) {
      req.session.usuario = { id: usuario.id, nome: usuario.nome };
      return res.redirect('/clientes');
    }
    res.render('login', { erro: 'CPF ou senha inválidos.' });
  } catch (e) {
    console.error(e);
    res.render('login', { erro: 'Erro ao tentar logar.' });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

app.get('/', (req, res) => res.redirect('/clientes'));

// ---------- GRUPOS (CRUD 1) ----------
app.get('/grupos', verificarAutenticacao, async (req, res) => {
  const r = await pool.query('SELECT * FROM grupos_clientes ORDER BY id');
  res.render('grupos', { grupos: r.rows, editando: null, erro: req.query.erro || null });
});

app.get('/grupos/:id/editar', verificarAutenticacao, async (req, res) => {
  const lista = await pool.query('SELECT * FROM grupos_clientes ORDER BY id');
  const g = await pool.query('SELECT * FROM grupos_clientes WHERE id = $1', [req.params.id]);
  res.render('grupos', { grupos: lista.rows, editando: g.rows[0] || null, erro: null });
});

app.post('/grupos', verificarAutenticacao, async (req, res) => {
  const { nome, descricao } = req.body;
  await pool.query('INSERT INTO grupos_clientes (nome, descricao) VALUES ($1, $2)', [nome, descricao]);
  res.redirect('/grupos');
});

app.post('/grupos/:id/editar', verificarAutenticacao, async (req, res) => {
  const { nome, descricao } = req.body;
  await pool.query('UPDATE grupos_clientes SET nome = $1, descricao = $2 WHERE id = $3', [
    nome,
    descricao,
    req.params.id
  ]);
  res.redirect('/grupos');
});

app.post('/grupos/:id/excluir', verificarAutenticacao, async (req, res) => {
  try {
    await pool.query('DELETE FROM grupos_clientes WHERE id = $1', [req.params.id]);
    res.redirect('/grupos');
  } catch (e) {
    if (e.code === '23503') {
      return res.redirect('/grupos?erro=' + encodeURIComponent('Não é possível excluir: existem clientes neste grupo.'));
    }
    console.error(e);
    res.redirect('/grupos?erro=' + encodeURIComponent('Erro ao excluir grupo.'));
  }
});

// ---------- CLIENTES (CRUD 2) ----------
app.get('/clientes', verificarAutenticacao, async (req, res) => {
  const busca = req.query.busca || '';
  const r = await pool.query(
    `SELECT c.*, g.nome AS grupo_nome
       FROM clientes c
       LEFT JOIN grupos_clientes g ON g.id = c.grupo_id
      WHERE c.nome ILIKE $1
      ORDER BY c.id`,
    [`%${busca}%`]
  );
  res.render('clientes', { clientes: r.rows, busca });
});

app.get('/clientes/novo', verificarAutenticacao, async (req, res) => {
  const g = await pool.query('SELECT * FROM grupos_clientes ORDER BY nome');
  res.render('novo-cliente', { grupos: g.rows });
});

app.post('/clientes', verificarAutenticacao, async (req, res) => {
  const { nome, cpf, email, telefone, grupo_id } = req.body;
  await pool.query(
    'INSERT INTO clientes (nome, cpf, email, telefone, grupo_id) VALUES ($1, $2, $3, $4, $5)',
    [nome, cpf, email, telefone, grupo_id || null]
  );
  res.redirect('/clientes');
});

app.get('/clientes/:id/editar', verificarAutenticacao, async (req, res) => {
  const c = await pool.query('SELECT * FROM clientes WHERE id = $1', [req.params.id]);
  if (!c.rows[0]) return res.redirect('/clientes');
  const g = await pool.query('SELECT * FROM grupos_clientes ORDER BY nome');
  res.render('editar-cliente', { cliente: c.rows[0], grupos: g.rows });
});

app.post('/clientes/:id/editar', verificarAutenticacao, async (req, res) => {
  const { nome, cpf, email, telefone, grupo_id } = req.body;
  await pool.query(
    'UPDATE clientes SET nome=$1, cpf=$2, email=$3, telefone=$4, grupo_id=$5 WHERE id=$6',
    [nome, cpf, email, telefone, grupo_id || null, req.params.id]
  );
  res.redirect('/clientes');
});

app.post('/clientes/:id/excluir', verificarAutenticacao, async (req, res) => {
  await pool.query('DELETE FROM clientes WHERE id = $1', [req.params.id]);
  res.redirect('/clientes');
});

app.listen(3000, () => console.log('Servidor rodando em http://localhost:3000'));
