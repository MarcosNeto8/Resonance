-- Ressonância: dados de exemplo (execute depois de schema.sql)
INSERT INTO usuario (nome_exibicao, email) VALUES
 ('Ana Souza','ana@exemplo.com'),('Bruno Lima','bruno@exemplo.com'),('Carla Dias','carla@exemplo.com');
INSERT INTO genero (nome) VALUES ('Rock'),('Pop'),('Hip Hop'),('MPB'),('Eletrônica'),('Jazz');
INSERT INTO artista (nome, pais) VALUES
 ('The Beatles','Reino Unido'),('Michael Jackson','Estados Unidos'),('Kendrick Lamar','Estados Unidos'),
 ('Milton Nascimento','Brasil'),('Daft Punk','França'),('Miles Davis','Estados Unidos'),
 ('Radiohead','Reino Unido'),('Elis Regina','Brasil');
INSERT INTO artista_genero (id_artista, id_genero) VALUES
 (1,1),(1,2),(2,2),(3,3),(3,6),(4,4),(5,5),(6,6),(7,1),(7,5),(8,4),(8,6);
INSERT INTO album (id_artista, titulo, ano) VALUES
 (1,'Abbey Road',1969),(2,'Thriller',1982),(3,'To Pimp a Butterfly',2015),(4,'Clube da Esquina',1972),
 (5,'Random Access Memories',2013),(6,'Kind of Blue',1959),(7,'OK Computer',1997),(8,'Elis & Tom',1974);
INSERT INTO faixa (id_album, titulo, numero, duracao_seg) VALUES
 (1,'Come Together',1,259),(1,'Something',2,183),(2,'Billie Jean',6,294),(6,'So What',1,545);
-- Cada resenha avalia exatamente um item: artista, álbum OU faixa
INSERT INTO resenha (id_usuario, id_album, nota, texto) VALUES
 (1,1,4.5,'Lado B perfeito. As harmonias seguram a gente até o fim.'),
 (1,7,5.0,'Obra-prima do rock alternativo, cada faixa se completa.'),
 (1,2,2.0,'Conhecido demais, mas não me conquistou.'),
 (2,1,5.0,'Clássico absoluto, não envelhece.'),
 (2,6,5.0,'O disco de jazz para quem quer começar.'),
 (3,4,4.5,'Arranjos inventivos e muita emoção.'),
 (3,3,4.0,'Denso, político e musicalmente ousado.'),
 (3,5,3.5,'Bonito, mas irregular no meio.');
INSERT INTO resenha (id_usuario, id_faixa, nota, texto) VALUES (2,3,4.5,'Linha de baixo inesquecível.');
INSERT INTO resenha (id_usuario, id_artista, nota, texto) VALUES (3,8,5.0,'Uma das maiores vozes do Brasil.');
INSERT INTO curtida_resenha (id_usuario, id_resenha) VALUES (2,1),(3,1),(1,4),(1,6),(2,6);
-- Perfil musical de Ana (mesma conta feita no protótipo em C: nota - 2,5 vezes o peso do gênero)
INSERT INTO afinidade_genero (id_usuario, id_genero, peso) VALUES
 (1,1,3.9500),(1,2,0.5500),(1,3,-0.1000),(1,4,0.0000),(1,5,0.6500),(1,6,0.0000);
