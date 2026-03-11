SELECT id, "deviceIds"
FROM "joy_licenses"
WHERE id = 1;


SELECT id, user_id, deviceIds
FROM joy_licenses
WHERE EXISTS (
SELECT 1 FROM unnest(deviceIds) AS elem
WHERE elem->>'hwid' = '79052ee9a2606e62fab56bd670bcc6fd7f2ba36d1c62a734ae43ad606d34b1eb'  -- подставь реальный HWID
);

## id
UPDATE "joy_licenses"
SET "deviceIds" = ARRAY[
jsonb_build_object(
'hwid', '89052ee9a2606e62fab56bd670bcc6fd7f2ba36d1c62a734ae43ad606d34b1eb',
'createdAt', '2025-02-01T00:00:00Z'::timestamptz
)
]::jsonb[]
WHERE id = 1
RETURNING id, "deviceIds";

or

UPDATE "joy_licenses"
SET "deviceIds" = ARRAY[
jsonb_build_object(
'hwid', '89052ee9a2606e62fab56bd670bcc6fd7f2ba36d1c62a734ae43ad606d34b1eb',
'createdAt', ("deviceIds"[1]->>'createdAt')::timestamptz   -- сохраняем дату из старого первого элемента
)
]
WHERE id = 1
RETURNING id, "deviceIds";


## дату
UPDATE "joy_licenses"
SET "deviceIds" = ARRAY[
jsonb_build_object(
'hwid', '89052ee9a2606e62fab56bd670bcc6fd7f2ba36d1c62a734ae43ad606d34b1eb',
'createdAt', '2025-02-01T00:00:00Z'::timestamptz
)
]
WHERE id = 1
RETURNING id, "deviceIds";


## Если в массиве уже несколько элементов и нужно заменить только первый, сохранив остальные
SQLUPDATE "joy_licenses"
SET "deviceIds" = ARRAY[
jsonb_build_object(
'hwid', '89052ee9a2606e62fab56bd670bcc6fd7f2ba36d1c62a734ae43ad606d34b1eb',
'createdAt', '2025-02-01T00:00:00Z'::timestamptz
)
] || ("deviceIds"[2:])   -- добавляем старые элементы начиная со второго
WHERE id = 1
RETURNING id, "deviceIds";

## Если хочешь заменить второй элемент (индекс 2 в массиве)
SQLUPDATE "joy_licenses"
SET "deviceIds" = ARRAY[
"deviceIds"[1],  -- первый элемент оставляем
jsonb_build_object(
'hwid', '89052ee9a2606e62fab56bd670bcc6fd7f2ba36d1c62a734ae43ad606d34b1eb',
'createdAt', '2025-02-01T00:00:00Z'::timestamptz
)
] || ("deviceIds"[3:])   -- остальные начиная с третьего
WHERE id = 1
RETURNING id, "deviceIds";


