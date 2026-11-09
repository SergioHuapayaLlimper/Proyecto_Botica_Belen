#!/bin/bash
# Carga los scripts SQL forzando UTF-8 (evita tildes rotas como "preparaciÃ³n").
for f in /sql/01_estructura.sql /sql/02_catalogo_200.sql /sql/03_datos_demo.sql; do
  echo "Cargando $f"
  mysql --default-character-set=utf8mb4 -uroot -p"$MYSQL_ROOT_PASSWORD" < "$f" || exit 1
done
