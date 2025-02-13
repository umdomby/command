SELECT setval(pg_get_serial_sequence('"Product"', 'id'), coalesce(max(id)+1, 1), false) FROM "Product";
SELECT setval(pg_get_serial_sequence('"ProductItem"', 'id'), coalesce(max(id)+1, 1), false) FROM "ProductItem";
SELECT setval(pg_get_serial_sequence('"GameRecords"', 'id'), coalesce(max(id)+1, 1), false) FROM "GameRecords";
SELECT setval(pg_get_serial_sequence('"GameCreateTime"', 'id'), coalesce(max(id)+1, 1), false) FROM "GameCreateTime";
SELECT setval(pg_get_serial_sequence('"CarModel"', 'id'), coalesce(max(id)+1, 1), false) FROM "CarModel";

SELECT setval(pg_get_serial_sequence('"Bet"', 'id'), coalesce(max(id)+1, 1), false) FROM "Bet";
SELECT setval(pg_get_serial_sequence('"BetParticipant"', 'id'), coalesce(max(id)+1, 1), false) FROM "BetParticipant";


SELECT setval(pg_get_serial_sequence('"Bet3"', 'id'), coalesce(max(id)+1, 1), false) FROM "Bet3";
SELECT setval(pg_get_serial_sequence('"BetParticipant3"', 'id'), coalesce(max(id)+1, 1), false) FROM "BetParticipant3";

npx prisma generate