package pe.upn.boticabelen.service;

import java.math.BigDecimal;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.upn.boticabelen.dto.Respuestas.*;
import pe.upn.boticabelen.repository.DashboardConsultaRepository;
import pe.upn.boticabelen.util.Negocio;
import pe.upn.boticabelen.util.Parametros;

/** Resumen de ventas y reporte (solo Admin). */
@Service
@Transactional(readOnly = true)
public class DashboardService {

    private final DashboardConsultaRepository consultas;

    public DashboardService(DashboardConsultaRepository consultas) {
        this.consultas = consultas;
    }

    public DashboardDto resumen(String desde, String hasta) {
        Negocio.Rango r = Negocio.rangoFechas(desde, hasta);
        return new DashboardDto(r.desde(), r.hasta(), consultas.kpis(r), consultas.ventasPorDia(r), consultas.porEstado(r),
                consultas.metodosPago(r), consultas.ventasMensuales(), consultas.topProductos(r), consultas.stockBajo());
    }

    public ReporteDto reporte(String desde, String hasta, String estado, String producto) {
        Negocio.Rango r = Negocio.rangoFechas(desde, hasta);
        List<PedidoReporteDto> pedidos = consultas.reporte(r, estado, Parametros.entero(producto, 0));
        List<PedidoReporteDto> validos = pedidos.stream().filter(p -> !Negocio.anulado(p.estadoPedido())).toList();

        BigDecimal monto = validos.stream().map(PedidoReporteDto::total).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal igv = validos.stream().map(PedidoReporteDto::igv).reduce(BigDecimal.ZERO, BigDecimal::add);
        long entregados = pedidos.stream().filter(p -> Negocio.ENTREGADO.equals(p.estadoPedido())).count();
        long anulados = pedidos.size() - validos.size();

        return new ReporteDto(r.desde(), r.hasta(), pedidos,
                new TotalesReporteDto(pedidos.size(), Negocio.redondear(monto), Negocio.redondear(igv), entregados, anulados));
    }
}
