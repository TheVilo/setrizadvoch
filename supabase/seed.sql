-- ============================================
-- Seed dáta — Lidl akcie pre testovanie
-- Spusti AFTER migrations
-- ============================================

insert into sale_items (chain, raw_name, sale_price, base_price, unit, valid_from, valid_to) values
('lidl', 'Kuracie prsia', 4.99, 6.49, 'kg', current_date, current_date + 6),
('lidl', 'Losos porcie', 6.99, 9.49, 'kg', current_date, current_date + 6),
('lidl', 'Ryža basmati 1kg', 1.29, 1.79, 'ks', current_date, current_date + 6),
('lidl', 'Červená paprika', 0.99, 1.49, 'kg', current_date, current_date + 6),
('lidl', 'Smotana na varenie 200ml', 0.79, 0.99, 'ks', current_date, current_date + 6),
('lidl', 'Syr Eidam 45% 400g', 2.49, 3.29, 'ks', current_date, current_date + 6),
('lidl', 'Vajcia M 10ks', 1.89, 2.49, 'ks', current_date, current_date + 6),
('lidl', 'Brokolica', 1.29, 1.79, 'ks', current_date, current_date + 6),
('lidl', 'Bravčová krkovička', 5.49, 7.49, 'kg', current_date, current_date + 6),
('lidl', 'Cestoviny penne 500g', 0.69, 0.99, 'ks', current_date, current_date + 6),
('lidl', 'Paradajky cherry 250g', 1.19, 1.59, 'ks', current_date, current_date + 6),
('lidl', 'Grécky jogurt 400g', 0.99, 1.39, 'ks', current_date, current_date + 6),
('lidl', 'Olivový olej 500ml', 3.99, 5.49, 'ks', current_date, current_date + 6),
('lidl', 'Mozzarella 125g', 0.89, 1.29, 'ks', current_date, current_date + 6),
('lidl', 'Špenát čerstvý 200g', 1.49, 1.99, 'ks', current_date, current_date + 6);

-- Potvrď
select count(*) as pocet_akcii, chain from sale_items group by chain;
