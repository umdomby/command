yarn add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner

Шаг 1: Исправь политику в MinIO на правильную public
Перезапусти create-bucket с правильной командой:
# Bash
cd ~/projects/prod/docker-s3
docker-compose down create-bucket  # останови старый, если есть
docker-compose up --force-recreate create-bucket
Или вручную:
# Bash
docker exec -it minio mc anonymous set download myminio/proofs
Или ещё лучше — полная public политика:
# Bash
docker exec -it minio mc policy set public myminio/proofs
Рекомендую эту команду (самая надёжная):
# Bash
docker exec -it minio sh -c "
mc alias set myminio http://localhost:9000 minioadmin minioadmin123 &&
mc anonymous set public myminio/proofs
"


yarn add adm-zip
yarn add -D @types/adm-zip

Create Bucket

# DELETE BUCKET
docker run --rm \
--entrypoint /bin/sh \
minio/mc \
-c "
mc alias set myminio http://host.docker.internal:9000 minioadmin minioadmin123 &&
mc rb --force myminio/arduliveimg &&
echo 'Бакет arduliveimg удалён нахуй!'
"


http://192.168.1.121:9001/browser/111
http://192.168.1.121:9001/browser/
http://192.168.1.121:9001/minio-console/


http://192.168.1.121:9001/
