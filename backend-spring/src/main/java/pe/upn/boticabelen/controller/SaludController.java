package pe.upn.boticabelen.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.upn.boticabelen.dto.Respuestas.SaludDto;
import pe.upn.boticabelen.repository.SqlNativo;

@RestController
@RequestMapping("/api")
public class SaludController {

    private final SqlNativo sql;
    private final String baseDeDatos;

    public SaludController(SqlNativo sql, @Value("${DB_NAME:botica_belen_db}") String baseDeDatos) {
        this.sql = sql;
        this.baseDeDatos = baseDeDatos;
    }

    @GetMapping("/salud")
    public SaludDto salud() {
        sql.lista("SELECT 1 AS ok");
        return new SaludDto("ok", baseDeDatos);
    }
}
