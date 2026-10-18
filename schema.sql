-- Ressonância: criação das tabelas (compatível com SQLite e DB Browser for SQLite)
PRAGMA foreign_keys = ON;

CREATE TABLE usuario (
  id_usuario     INTEGER PRIMARY KEY AUTOINCREMENT,
  nome_exibicao  VARCHAR(60)  NOT NULL,
  email          VARCHAR(120) NOT NULL UNIQUE,
  data_cadastro  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ativo          BOOLEAN      NOT NULL DEFAULT TRUE
);
CREATE TABLE artista (
  id_artista  INTEGER PRIMARY KEY AUTOINCREMENT,
  nome        VARCHAR(120) NOT NULL,
  pais        VARCHAR(40),
  mbid        CHAR(36) UNIQUE
);
CREATE TABLE album (
  id_album    INTEGER PRIMARY KEY AUTOINCREMENT,
  id_artista  INTEGER NOT NULL REFERENCES artista (id_artista),
  titulo      VARCHAR(150) NOT NULL,
  ano         SMALLINT CHECK (ano BETWEEN 1900 AND 2100)
);
CREATE TABLE faixa (
  id_faixa     INTEGER PRIMARY KEY AUTOINCREMENT,
  id_album     INTEGER NOT NULL REFERENCES album (id_album) ON DELETE CASCADE,
  titulo       VARCHAR(150) NOT NULL,
  numero       SMALLINT NOT NULL,
  duracao_seg  INTEGER CHECK (duracao_seg > 0)
);
CREATE TABLE genero (
  id_genero  INTEGER PRIMARY KEY AUTOINCREMENT,
  nome       VARCHAR(40) NOT NULL UNIQUE
);
CREATE TABLE artista_genero (
  id_artista  INTEGER NOT NULL REFERENCES artista (id_artista),
  id_genero   INTEGER NOT NULL REFERENCES genero (id_genero),
  PRIMARY KEY (id_artista, id_genero)
);
CREATE TABLE resenha (
  id_resenha       INTEGER PRIMARY KEY AUTOINCREMENT,
  id_usuario       INTEGER NOT NULL REFERENCES usuario (id_usuario),
  id_artista       INTEGER REFERENCES artista (id_artista),
  id_album         INTEGER REFERENCES album (id_album),
  id_faixa         INTEGER REFERENCES faixa (id_faixa),
  nota             NUMERIC(2,1) NOT NULL CHECK (nota BETWEEN 0.5 AND 5.0),
  texto            TEXT NOT NULL,
  visibilidade     VARCHAR(12) NOT NULL DEFAULT 'publica',
  data_publicacao  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK ((CASE WHEN id_artista IS NULL THEN 0 ELSE 1 END
        + CASE WHEN id_album   IS NULL THEN 0 ELSE 1 END
        + CASE WHEN id_faixa   IS NULL THEN 0 ELSE 1 END) = 1)
);
CREATE TABLE curtida_resenha (
  id_usuario  INTEGER NOT NULL REFERENCES usuario (id_usuario),
  id_resenha  INTEGER NOT NULL REFERENCES resenha (id_resenha) ON DELETE CASCADE,
  data        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_usuario, id_resenha)
);
CREATE TABLE afinidade_genero (
  id_usuario     INTEGER NOT NULL REFERENCES usuario (id_usuario),
  id_genero      INTEGER NOT NULL REFERENCES genero (id_genero),
  peso           NUMERIC(5,4) NOT NULL,
  atualizado_em  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_usuario, id_genero)
);
CREATE INDEX idx_resenha_album ON resenha (id_album, data_publicacao DESC);
