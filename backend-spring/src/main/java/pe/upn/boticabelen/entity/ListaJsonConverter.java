package pe.upn.boticabelen.entity;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import java.util.List;

/** Guarda una lista de textos en una columna JSON de MySQL: ["mostrador","pedidos"]. */
@Converter
public class ListaJsonConverter implements AttributeConverter<List<String>, String> {

    private static final ObjectMapper JSON = new ObjectMapper();

    @Override
    public String convertToDatabaseColumn(List<String> lista) {
        try {
            return JSON.writeValueAsString(lista == null ? List.of() : lista);
        } catch (Exception e) {
            throw new IllegalArgumentException("No se pudo convertir la lista a JSON", e);
        }
    }

    @Override
    public List<String> convertToEntityAttribute(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return JSON.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return List.of();
        }
    }
}
