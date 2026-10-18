-- Ressonância: consultas de exemplo (execute depois de schema.sql e dados.sql)
-- 1) Inserir a resenha de um álbum
INSERT INTO resenha (id_usuario, id_album, nota, texto)
VALUES (1, 1, 4.5, 'Harmonias impecáveis e arranjos inventivos.');

-- 2) Ranking de álbuns por nota média (mínimo de 2 resenhas)
SELECT a.titulo, ar.nome AS artista,
       ROUND(AVG(r.nota), 2) AS nota_media, COUNT(*) AS total
FROM resenha r
JOIN album a    ON a.id_album = r.id_album
JOIN artista ar ON ar.id_artista = a.id_artista
WHERE r.visibilidade = 'publica'
GROUP BY a.titulo, ar.nome
HAVING COUNT(*) >= 2
ORDER BY nota_media DESC
LIMIT 10;

-- 3) Resenhas salvas no perfil de um usuário (mais recentes primeiro)
SELECT r.data_publicacao, r.nota, r.texto, a.titulo
FROM resenha r
JOIN album a ON a.id_album = r.id_album
WHERE r.id_usuario = 1
ORDER BY r.data_publicacao DESC;

-- 4) Gêneros mais bem avaliados por um usuário (insumo do perfil musical)
SELECT g.nome, ROUND(AVG(r.nota), 2) AS media_nota, COUNT(*) AS total
FROM resenha r
JOIN album a           ON a.id_album = r.id_album
JOIN artista_genero ag ON ag.id_artista = a.id_artista
JOIN genero g          ON g.id_genero = ag.id_genero
WHERE r.id_usuario = 1
GROUP BY g.nome
ORDER BY media_nota DESC;
