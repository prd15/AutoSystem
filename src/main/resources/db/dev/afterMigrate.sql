-- Seed de demonstracao (perfil dev). Callback afterMigrate: roda apos as migrations.
-- Idempotente: so popula quando a base esta vazia. Atende o escopo (>=10 veiculos, >=3 vendas):
-- 15 veiculos, 5 clientes, 4 vendas.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM veiculos) THEN

        INSERT INTO veiculos (marca, modelo, ano, cor, quilometragem, preco, placa, status) VALUES
            ('Honda',      'Civic EXL',        2021, 'Prata',    42300, 129900.00, 'RKA2B31', 'disponivel'),
            ('Toyota',     'Corolla XEI',      2022, 'Branco',   31000, 142500.00, 'BRA1C23', 'disponivel'),
            ('Volkswagen', 'Nivus Highline',   2023, 'Cinza',    18500, 138000.00, 'GHI4D56', 'disponivel'),
            ('Chevrolet',  'Onix Premier',     2022, 'Preto',    27400,  98500.00, 'JKL5E78', 'disponivel'),
            ('Hyundai',    'HB20 Diamond',     2021, 'Vermelho', 39900,  84900.00, 'MNO6F90', 'disponivel'),
            ('Jeep',       'Renegade Longitude',2020,'Branco',   61200, 112000.00, 'PQR7G12', 'reservado'),
            ('Fiat',       'Pulse Impetus',    2023, 'Cinza',    15200, 116900.00, 'STU8H34', 'reservado'),
            ('Renault',    'Kwid Zen',         2022, 'Laranja',  22100,  62900.00, NULL,      'disponivel'),
            ('Nissan',     'Kicks SV',         2021, 'Prata',    48700, 105000.00, 'VWX9J56', 'disponivel'),
            ('Ford',       'Ranger XLT',       2019, 'Preto',    88000, 189900.00, NULL,      'disponivel'),
            ('Toyota',     'Hilux SRV',        2020, 'Prata',    72000, 245000.00, 'YZA0K78', 'disponivel'),
            ('Volkswagen', 'T-Cross Comfort',  2022, 'Azul',     25600, 124900.00, NULL,      'disponivel'),
            ('Chevrolet',  'Tracker LTZ',      2023, 'Branco',   12300, 139900.00, 'BCD1L90', 'disponivel'),
            ('Honda',      'City Touring',     2022, 'Cinza',    33400, 109900.00, NULL,      'disponivel'),
            ('Fiat',       'Argo Trekking',    2021, 'Vermelho', 41500,  76900.00, 'EFG2M13', 'disponivel');

        INSERT INTO clientes (nome, cpf, telefone, email) VALUES
            ('Marina Alves Ribeiro',  '48211390027', '(34) 99999-0001', 'marina@exemplo.com'),
            ('Rodrigo Pacheco Lima',  '31584200960', '(34) 99999-0002', 'rodrigo@exemplo.com'),
            ('Camila Souza Andrade',  '10520070028', '(34) 99999-0003', NULL),
            ('Felipe Nunes Carvalho', '15350946056', '(34) 99999-0004', 'felipe@exemplo.com'),
            ('Aline Barbosa Rocha',   '04998529017', '(34) 99999-0005', NULL);

        -- 4 vendas: marca os veiculos como vendido e registra a venda
        UPDATE veiculos SET status = 'vendido'
            WHERE placa IN ('RKA2B31', 'GHI4D56', 'JKL5E78', 'MNO6F90');

        INSERT INTO vendas (veiculo_id, cliente_id, vendedor, valor_venda, data_venda)
        SELECT v.id, c.id, d.vendedor, d.valor, d.data
        FROM (VALUES
            ('RKA2B31', '48211390027', 'Alan Ferreira',  125000.00, DATE '2026-09-03'),
            ('GHI4D56', '31584200960', 'Bruna Costa',    135000.00, DATE '2026-09-07'),
            ('JKL5E78', '10520070028', 'Carlos Menezes',  95000.00, DATE '2026-08-22'),
            ('MNO6F90', '15350946056', 'Alan Ferreira',   83000.00, DATE '2026-09-10')
        ) AS d(placa, cpf, vendedor, valor, data)
        JOIN veiculos v ON v.placa = d.placa
        JOIN clientes c ON c.cpf = d.cpf;

    END IF;
END $$;
