SELECT setval(pg_get_serial_sequence('"Product"', 'id'), coalesce(max(id)+1, 1), false) FROM "Product";
SELECT setval(pg_get_serial_sequence('"ProductItem"', 'id'), coalesce(max(id)+1, 1), false) FROM "ProductItem";
SELECT setval(pg_get_serial_sequence('"Bet"', 'id'), coalesce(max(id)+1, 1), false) FROM "Bet";
SELECT setval(pg_get_serial_sequence('"Category"', 'id'), coalesce(max(id)+1, 1), false) FROM "Category";
