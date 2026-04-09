-- VexxyRep — Export DB locale
-- À coller dans l'éditeur SQL de Railway

-- Catégories
INSERT INTO categories (id, label, sort_order) VALUES ('shoes', 'Shoes', 1) ON CONFLICT (id) DO UPDATE SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order;
INSERT INTO categories (id, label, sort_order) VALUES ('pantalons', 'Pantalons', 2) ON CONFLICT (id) DO UPDATE SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order;
INSERT INTO categories (id, label, sort_order) VALUES ('shorts', 'Shorts', 3) ON CONFLICT (id) DO UPDATE SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order;
INSERT INTO categories (id, label, sort_order) VALUES ('vestes', 'Vestes', 3) ON CONFLICT (id) DO UPDATE SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order;
INSERT INTO categories (id, label, sort_order) VALUES ('hoodies', 'Hoodies', 4) ON CONFLICT (id) DO UPDATE SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order;
INSERT INTO categories (id, label, sort_order) VALUES ('tshirts', 'T-Shirts', 5) ON CONFLICT (id) DO UPDATE SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order;
INSERT INTO categories (id, label, sort_order) VALUES ('accessoires', 'Accessoires', 6) ON CONFLICT (id) DO UPDATE SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order;
INSERT INTO categories (id, label, sort_order) VALUES ('autre', 'Autres', 7) ON CONFLICT (id) DO UPDATE SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order;
INSERT INTO categories (id, label, sort_order) VALUES ('ensembles', 'Ensembles', 8) ON CONFLICT (id) DO UPDATE SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order;

-- Produits
TRUNCATE products RESTART IDENTITY CASCADE;

INSERT INTO products (name, category_id, brand, image, link, price) VALUES ('Nike Mind 001', 'shoes', 'Nike', 'images/1775681620957.png', 'https://litbuy.shop/lit/ydTmqxUY', '30$');
INSERT INTO products (name, category_id, brand, image, link, price) VALUES ('Air Max 95 Corteiz', 'shoes', 'Nike', 'images/1775687754612.png', 'https://litbuy.shop/lit/dSHmOOsf', '35$');
INSERT INTO products (name, category_id, brand, image, link, price) VALUES ('Hoodie Denim Tears', 'hoodies', 'Denim Tears', 'https://img.alicdn.com/bao/uploaded/i4/2218012957985/O1CN01rzcw8w28rBarG8aLz_!!2218012957985.png', 'https://litbuy.shop/lit/XDjpViAh', '45$');
INSERT INTO products (name, category_id, brand, image, link, price) VALUES ('Short Nike Running', 'shorts', 'Nike', 'images/1775749507764.png', 'https://litbuy.shop/lit/vvl95Di', '5$');
INSERT INTO products (name, category_id, brand, image, link, price) VALUES ('Chaussettes Nike', 'autre', 'Nike', 'https://cbu01.alicdn.com/img/ibank/O1CN01n0JEmz2FKqnruFRl1_!!2216400058862-0-cib.jpg', 'https://litbuy.shop/lit/fiCxURLy', '2,5$');
INSERT INTO products (name, category_id, brand, image, link, price) VALUES ('Boxers Calvin Klein', 'autre', 'Calvin Klein', 'https://cbu01.alicdn.com/img/ibank/O1CN01xU59ON237Jsy2Um3o_!!2219471787208-0-cib.jpg', 'https://litbuy.shop/lit/OUQCqaP', '1$');
INSERT INTO products (name, category_id, brand, image, link, price) VALUES ('Saucony Omni 9', 'shoes', 'Saucony', 'images/1775749665027.png', 'https://litbuy.shop/lit/gL94Q3Zc', '25$');
INSERT INTO products (name, category_id, brand, image, link, price) VALUES ('Doudoune Moncler Maya', 'vestes', 'Moncler', 'https://www.24s.com/static/images/V3DOFVHsjOPMTNo4fN4jCf6uD1M=/fit-in/555x625/4781fa38fce647ef9236f86bf53b2e24', 'https://litbuy.shop/lit/wix7P2XQ', '45$');
INSERT INTO products (name, category_id, brand, image, link, price) VALUES ('T-Shirt Stone Island', 'tshirts', 'Stone Island', 'images/1775749350465.png', 'https://litbuy.shop/lit/qWtE7D5H', '8$');
INSERT INTO products (name, category_id, brand, image, link, price) VALUES ('Pull Stone Island', 'hoodies', 'Stone Island', 'https://boutique-michelnoel.fr/28711-large_default/sweat-stone-island-6100021-0029-noir-heavy-fleece-53-organic.jpg', 'https://litbuy.shop/lit/Q6Udn4SJ', '30$');
INSERT INTO products (name, category_id, brand, image, link, price) VALUES ('T-Shirt Essentials', 'tshirts', 'Essentials', 'https://dimension-stores.com/cdn/shop/files/Essentials_T-Shirt_Blanc-3.jpg?v=1746455825&width=3094', 'https://litbuy.shop/lit/nROAPdxF', '11$');
INSERT INTO products (name, category_id, brand, image, link, price) VALUES ('Montre Tissot', 'accessoires', 'Tissot', 'https://si.geilicdn.com/weidian1420898802-79f30000018db1b251920a207569_1170_1163.jpg', 'https://litbuy.shop/lit/Ir2BXA9y', '30$');
INSERT INTO products (name, category_id, brand, image, link, price) VALUES ('Veste Mertra', 'vestes', 'Mertra', 'https://si.geilicdn.com/wdseller1940384309-589b000001998b7c8f9f0a230215_1320_1320.jpg', 'https://litbuy.shop/lit/de5lwjeG', '35$');
INSERT INTO products (name, category_id, brand, image, link, price) VALUES ('Veste Beta LT Arc''teryx', 'vestes', 'Arc''teryx', 'images/1775749724360.png', 'https://litbuy.shop/lit/F6ciuAWj', '35$');
INSERT INTO products (name, category_id, brand, image, link, price) VALUES ('T-Shirt Stussy', 'tshirts', 'Stussy', 'https://cbu01.alicdn.com/img/ibank/O1CN014zxKcp1J7nxXLGgXx_!!2217532530982-0-cib.jpg', 'https://litbuy.shop/lit/KYm1krnT', '6$');
INSERT INTO products (name, category_id, brand, image, link, price) VALUES ('Nike Tech', 'ensembles', 'Nike', 'https://contents.mediadecathlon.com/m26867880/kcc0ef8ed1a05b540325b2e84112667e9/picture.jpg', 'https://litbuy.shop/lit/CUmtZmul', '25$');
INSERT INTO products (name, category_id, brand, image, link, price) VALUES ('B30 Dior', 'shoes', 'Dior', 'images/1775749706876.png', 'https://litbuy.shop/lit/CvGYSdew', '30$');
INSERT INTO products (name, category_id, brand, image, link, price) VALUES ('T-Shirt CDG', 'tshirts', 'CDG', 'https://cbu01.alicdn.com/img/ibank/8619063630_1646574665.jpg', 'https://litbuy.shop/lit/0b1BNHpJt', '6$');
INSERT INTO products (name, category_id, brand, image, link, price) VALUES ('Cagoule Nike Pro', 'autre', 'Nike', 'images/1775749523637.png', 'https://litbuy.shop/lit/9oXw6frJ', '6$');
