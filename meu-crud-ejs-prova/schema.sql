

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Criação da tabela de usuários (login por CPF)
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL
);

-- 2. Criação da tabela de Grupos de Atendimento
CREATE TABLE IF NOT EXISTS grupos_clientes (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT
);

CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    cpf VARCHAR(14) NOT NULL,
    email VARCHAR(150),
    telefone VARCHAR(20),
    grupo_id INT REFERENCES grupos_clientes(id) ON DELETE RESTRICT
);


INSERT INTO usuarios (nome, cpf, senha)
VALUES ('Administrador', '12345678900', '$2b$10$0V90v6CHkERUdc6HPSt30eweqhJh6FJ6R45.QTT.8u31htipPxoUe')
ON CONFLICT (cpf) DO NOTHING;

-- 5. Inserção de grupos padrão para testes iniciais
INSERT INTO grupos_clientes (nome, descricao) VALUES
('Convênio Bronze',     'Clientes com plano de convênio básico'),
('Particular Especial', 'Atendimento particular com benefícios'),
('Programa Neonatal',   'Acompanhamento de recém-nascidos'),
('Atendimento Social',  'Atendimento com apoio social')
ON CONFLICT DO NOTHING;

-- 6. Inserção de clientes de teste vinculados aos grupos
INSERT INTO clientes (nome, cpf, email, telefone, grupo_id) VALUES
('Maria Silva',  '111.111.111-11', 'maria@email.com', '(11) 90000-0001', 1),
('João Santos',  '222.222.222-22', 'joao@email.com',  '(11) 90000-0002', 2),
('Ana Oliveira', '333.333.333-33', 'ana@email.com',   '(11) 90000-0003', 3)
ON CONFLICT DO NOTHING;