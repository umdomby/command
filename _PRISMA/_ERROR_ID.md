SELECT setval(pg_get_serial_sequence('"Product"', 'id'), coalesce(max(id)+1, 1), false) FROM "Product";
SELECT setval(pg_get_serial_sequence('"ProductItem"', 'id'), coalesce(max(id)+1, 1), false) FROM "ProductItem";
SELECT setval(pg_get_serial_sequence('"GameRecords"', 'id'), coalesce(max(id)+1, 1), false) FROM "GameRecords";
SELECT setval(pg_get_serial_sequence('"GameCreateTime"', 'id'), coalesce(max(id)+1, 1), false) FROM "GameCreateTime";