#!/bin/bash
# Carga la base completa forzando UTF-8 (evita tildes rotas como "preparaciÃ³n").
echo "Cargando /sql/botica_belen.sql"
mysql --default-character-set=utf8mb4 -uroot -p"$MYSQL_ROOT_PASSWORD" < /sql/botica_belen.sql || exit 1
