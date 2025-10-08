import React, { useState, useEffect, useMemo } from 'react';
import './EstadisticasAdmin.css'; 
// Si App.css tiene estilos globales o resets, asegúrate de que esté importado donde corresponde (ej. index.js o App.js)

// =================================================================
// 1. CONSTANTES Y FUNCIONES DE UTILIDAD
// =================================================================

// Asignación de colores fijos para los 4 tipos de servicio definidos
const SERVICE_COLORS = {
    'celulares': '#4CAF50',    
    'computadora': '#2196F3',  
    'parlantes': '#FF9800',    
    'otros': '#9C27B0',        
};

const KNOWN_SERVICE_TYPES = ['celulares', 'computadora', 'parlantes', 'otros'];


/**
 * Formatea un número para usar separador de miles (punto) y decimales (coma).
 */
const formatCurrency = (value) => {
    if (value === null || value === undefined || isNaN(Number(value))) return '$0,00';
    // Se usa 'es-AR' para formato local (Argentina) con $ y ,/.
    return new Intl.NumberFormat('es-AR', { 
        style: 'currency', 
        currency: 'ARS', 
        minimumFractionDigits: 2 
    }).format(Number(value));
};


/**
 * Procesa la lista de servicios para calcular las métricas clave, y agrupa
 * los servicios entregados por mes para el detalle al hacer clic.
 */
const analyzeServiceData = (services, filterYear, filterMonth) => {
    let filteredServices = services;
    const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;

    // --- APLICAR FILTROS ---
    if (filterYear && filterYear !== 'Todos') {
        filteredServices = filteredServices.filter(s => 
            s.fechaSalida && new Date(s.fechaSalida).getFullYear().toString() === filterYear
        );
    }
    if (filterMonth && filterMonth !== 'Todos') {
        filteredServices = filteredServices.filter(s => 
            s.fechaSalida && (new Date(s.fechaSalida).getMonth() + 1).toString().padStart(2, '0') === filterMonth
        );
    }

    // --- CÁLCULO DE MÉTRICAS GENERALES ---
    const calculableServices = filteredServices.filter(s => s.presupuesto?.total > 0);
    
    const totalRevenue = calculableServices
        .filter(s => s.estado === 'entregado')
        .reduce((sum, s) => sum + s.presupuesto.total, 0);

    const activeServicesCount = filteredServices.filter(s => s.estado !== 'entregado').length;
    const deliveredServicesCount = filteredServices.filter(s => s.estado === 'entregado').length;
    
    // Días Promedio de Servicio
    let totalServiceDays = 0;
    let completedServicesWithDates = 0;

    filteredServices.filter(s => s.estado === 'entregado' && s.fechaEntrada && s.fechaSalida)
        .forEach(s => {
            const entry = new Date(s.fechaEntrada);
            const exit = new Date(s.fechaSalida);
            if (exit >= entry) { 
                const diffTime = Math.abs(exit.getTime() - entry.getTime());
                const diffDays = Math.ceil(diffTime / MILLISECONDS_PER_DAY); 
                totalServiceDays += diffDays;
                completedServicesWithDates += 1;
            }
        });

    const avgServiceDays = completedServicesWithDates > 0 
        ? (totalServiceDays / completedServicesWithDates).toFixed(1)
        : 'N/A';
        
    // --- DATOS PARA GRÁFICO DE BARRAS e Ingresos Mensuales Detallados ---
    const monthlyRevenueMap = {};
    const monthlyServiceDetails = {}; 

    calculableServices
        .filter(s => s.estado === 'entregado' && s.fechaSalida)
        .forEach(s => {
            const date = new Date(s.fechaSalida);
            const yearMonthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`; // Formato YYYY-MM
            const monthLabel = date.toLocaleString('es-ES', { month: 'short', year: '2-digit' }); 

            monthlyRevenueMap[yearMonthKey] = (monthlyRevenueMap[yearMonthKey] || 0) + s.presupuesto.total;

            if (!monthlyServiceDetails[yearMonthKey]) {
                monthlyServiceDetails[yearMonthKey] = {
                    label: monthLabel,
                    revenue: 0,
                    services: []
                };
            }
            monthlyServiceDetails[yearMonthKey].revenue += s.presupuesto.total;
            monthlyServiceDetails[yearMonthKey].services.push({
                id: s.id,
                tipo: s.tipoServicio || 'Otros',
                precio: s.presupuesto.total,
                fecha: s.fechaSalida,
                marca: s.marcaProducto || 'N/A'
            });
        });

    const monthlySalesData = Object.keys(monthlyRevenueMap)
        .sort()
        .map(key => ({
            key, 
            month: monthlyServiceDetails[key].label,
            revenue: monthlyRevenueMap[key],
            details: monthlyServiceDetails[key].services 
        }));

    // --- DATOS PARA GRÁFICO DE TORTA: Distribución por Tipo de Servicio ---
    const serviceTypeDistributionMap = filteredServices.reduce((acc, s) => {
        const tipo = s.tipoServicio?.toLowerCase() || 'otros'; 
        const finalType = KNOWN_SERVICE_TYPES.includes(tipo) ? tipo : 'otros';
        
        acc[finalType] = (acc[finalType] || 0) + 1;
        return acc;
    }, {});

    const totalServicesForPie = Object.values(serviceTypeDistributionMap).reduce((sum, count) => sum + count, 0);

    const serviceTypeDistribution = Object.keys(serviceTypeDistributionMap)
        .map((type) => ({
            type,
            count: serviceTypeDistributionMap[type],
            percentage: totalServicesForPie > 0 ? ((serviceTypeDistributionMap[type] / totalServicesForPie) * 100).toFixed(1) : 0,
            color: SERVICE_COLORS[type] || SERVICE_COLORS['otros'] 
        }))
        .sort((a, b) => b.count - a.count)
        .filter(item => parseFloat(item.percentage) > 0); 
        
    // --- CADENA CONIC-GRADIENT PARA EL GRÁFICO DE TORTA ---
    let currentAngle = 0;
    const gradientSegments = serviceTypeDistribution.map(item => {
        const startAngle = currentAngle;
        const endAngle = currentAngle + (parseFloat(item.percentage) * 3.6); 
        currentAngle = endAngle;
        return `${item.color} ${startAngle}deg ${endAngle}deg`;
    });
    
    const conicGradientCSS = gradientSegments.length > 0 
        ? `conic-gradient(${gradientSegments.join(', ')})`
        : `var(--card-bg)`; 

    return {
        totalRevenue,
        activeServicesCount,
        deliveredServicesCount,
        avgServiceDays,
        monthlySalesData,
        serviceTypeDistribution,
        totalServicesForPie,
        conicGradientCSS
    };
};


// =================================================================
// 2. COMPONENTE PRINCIPAL: EstadisticasAdmin
// =================================================================

const API_URL = 'http://localhost:3001/servicios'; 

function EstadisticasAdmin() {
    const [allServices, setAllServices] = useState([]);
    const [filterYear, setFilterYear] = useState('Todos');
    const [filterMonth, setFilterMonth] = useState('Todos');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Estado para el modal de detalle de servicio
    const [selectedMonthData, setSelectedMonthData] = useState(null); 

    // --- Fetch de Datos ---
    const fetchAllServices = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(API_URL);
            if (!response.ok) {
                throw new Error(`Error al cargar datos: ${response.statusText}`);
            }
            const servicesData = await response.json();
            setAllServices(servicesData);
        } catch (err) {
            console.error("Fallo al obtener datos:", err);
            setError("No se pudieron cargar los datos estadísticos desde la API. Asegúrese que json-server esté corriendo en el puerto 3001.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllServices();
    }, []);

    // --- Lógica de Filtros ---
    const availableYears = useMemo(() => {
        const years = new Set(allServices.map(s => s.fechaSalida && new Date(s.fechaSalida).getFullYear().toString()).filter(Boolean));
        return ['Todos', ...Array.from(years).sort((a,b) => b - a)];
    }, [allServices]);

    const availableMonths = useMemo(() => {
        if (filterYear === 'Todos') return ['Todos'];

        const months = new Set(
            allServices
                .filter(s => s.fechaSalida && new Date(s.fechaSalida).getFullYear().toString() === filterYear)
                .map(s => (new Date(s.fechaSalida).getMonth() + 1).toString().padStart(2, '0'))
                .filter(Boolean)
        );
        const monthNames = Array.from(months)
            .sort((a, b) => parseInt(a) - parseInt(b))
            .map(m => ({ 
                value: m, 
                label: new Date(2000, parseInt(m) - 1, 1).toLocaleString('es-ES', { month: 'long' }) 
            }));
            
        return ['Todos', ...monthNames];
    }, [allServices, filterYear]);

    // --- Cálculo de Estadísticas ---
    const stats = useMemo(() => {
        if (!allServices.length) return null;
        return analyzeServiceData(allServices, filterYear, filterMonth);
    }, [allServices, filterYear, filterMonth]);
    
    // --- Renderizado ---
    if (loading) {
        return <div className="loading-message">Cargando Estadísticas...</div>;
    }

    if (error) {
        return <div className="error-message-full">{error}</div>;
    }

    if (!stats || (stats.totalRevenue === 0 && stats.activeServicesCount === 0 && stats.deliveredServicesCount === 0)) {
         return <div className="no-data-message">No hay datos disponibles para generar estadísticas en el periodo seleccionado.</div>;
    }


    const maxRevenue = Math.max(...stats.monthlySalesData.map(d => d.revenue), 1000); 

    return (
        <div className="estadisticas-admin-page-custom">
            <header className="admin-header">
                <h1 className="title-bold">📊 Panel de Estadísticas</h1>
                <p>Resumen de rendimiento del taller.</p>
            </header>

             {/* --- FILTROS --- */}
            <div className="filters-container">
                <div className="filter-group">
                    <label htmlFor="filterYear">Año:</label>
                    <select 
                        id="filterYear" 
                        value={filterYear} 
                        onChange={(e) => {
                            setFilterYear(e.target.value);
                            setFilterMonth('Todos'); 
                        }}
                    >
                        {availableYears.map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>
                <div className="filter-group">
                    <label htmlFor="filterMonth">Mes:</label>
                    <select 
                        id="filterMonth" 
                        value={filterMonth} 
                        onChange={(e) => setFilterMonth(e.target.value)}
                        disabled={filterYear === 'Todos'} 
                    >
                        {availableMonths.map(month => (
                            <option 
                                key={month.value || month} 
                                value={month.value || month}
                            >
                                {month.label || month}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* --- Key Metrics Grid --- */}
            <div className="stats-cards-grid">
                
                <div className="stat-card revenue-card">
                    <div className="stat-value">{formatCurrency(stats.totalRevenue)}</div>
                    <div className="stat-label">Ingresos Totales (Servicios Entregados)</div>
                    <span className="stat-icon">💰</span>
                </div>

                <div className="stat-card active-services-card">
                    <div className="stat-value">{stats.activeServicesCount}</div>
                    <div className="stat-label">Equipos en Taller (Activos)</div>
                    <span className="stat-icon">🔧</span>
                </div>

                <div className="stat-card delivered-card">
                    <div className="stat-value">{stats.deliveredServicesCount}</div>
                    <div className="stat-label">Total de Servicios Entregados</div>
                    <span className="stat-icon">✅</span>
                </div>

                <div className="stat-card avg-days-card">
                    <div className="stat-value">{stats.avgServiceDays} días</div>
                    <div className="stat-label">Promedio de Días en Servicio</div>
                    <span className="stat-icon">⏳</span>
                </div>
            </div>

            {/* --- Charts Row --- */}
            <div className="stats-charts-row">
                
                {/* Bloque 1: Gráfico de Barras - Ingresos Mensuales */}
                <div className="chart-block monthly-performance">
                    <h2>Ingresos por Mes</h2>
                    <p className="chart-subtitle">Ganancias de servicios entregados por periodo</p>
                    <div className="bar-chart-container">
                        {stats.monthlySalesData.length === 0 ? (
                            <p className="no-chart-data">No hay datos de ingresos para el periodo seleccionado.</p>
                        ) : (
                            stats.monthlySalesData.map((data, index) => (
                                <div 
                                    key={index} 
                                    className="chart-bar" 
                                    style={{ height: `${(data.revenue / maxRevenue) * 90}%` }} 
                                    title={`Total: ${formatCurrency(data.revenue)}. Click para ver detalle.`}
                                    onClick={() => setSelectedMonthData(data)} // **ACCIÓN AL HACER CLIC**
                                >
                                    <span className="bar-value">{formatCurrency(data.revenue).replace('$', '').slice(0, -3)}</span>
                                    <span className="bar-label">{data.month.toUpperCase()}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
                
                {/* Bloque 2: Gráfico de Torta - Distribución por Tipo de Servicio */}
                <div className="chart-block service-type-distribution">
                    <h2>Distribución por Tipo de Servicio</h2>
                    <p className="chart-subtitle">Proporción de equipos por categoría</p>
                    {stats.totalServicesForPie === 0 ? (
                         <p className="no-chart-data">No hay servicios para mostrar en el gráfico de torta.</p>
                    ) : (
                        <div className="pie-chart-container">
                            <div className="pie-chart">
                                <div 
                                    className="conic-pie-chart" 
                                    style={{ background: stats.conicGradientCSS }}
                                ></div>
                            </div>
                            <div className="pie-legend">
                                {stats.serviceTypeDistribution.map((data, index) => (
                                    <div key={index} className="legend-item">
                                        <span className="legend-color" style={{ backgroundColor: data.color }}></span>
                                        <span className="legend-label">
                                            {data.type.charAt(0).toUpperCase() + data.type.slice(1)} ({data.percentage}%)
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* --- MODAL DE DETALLE DE SERVICIOS --- */}
            {selectedMonthData && (
                <MonthlyServiceDetailModal 
                    data={selectedMonthData} 
                    onClose={() => setSelectedMonthData(null)} 
                />
            )}
        </div>
    );
}

// =================================================================
// 3. NUEVO COMPONENTE: Modal de Detalle de Servicios (Clases Únicas)
// =================================================================

const MonthlyServiceDetailModal = ({ data, onClose }) => {
    return (
        <div className="monthly-modal-overlay" onClick={onClose}>
            <div className="monthly-service-detail-modal" onClick={e => e.stopPropagation()}> 
                <div className="monthly-modal-header">
                    <h2>Servicios Entregados en {data.month.toUpperCase()}</h2>
                    <button className="monthly-close-button" onClick={onClose}>&times;</button>
                </div>
                <div className="monthly-modal-summary">
                    <p>Total Ingresos: <strong>{formatCurrency(data.revenue)}</strong></p>
                    <p>Total Servicios: <strong>{data.details.length}</strong></p>
                </div>
                
                <div className="monthly-modal-list-container">
                    {data.details.length === 0 ? (
                        <p className="monthly-no-data-message-modal">No se encontraron servicios entregados para este mes.</p>
                    ) : (
                        <table className="monthly-service-detail-table">
                            <thead>
                                <tr>
                                    <th>ID/Fecha</th>
                                    <th>Tipo</th>
                                    <th>Marca</th>
                                    <th className="monthly-text-right">Precio</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.details.map((service) => (
                                    <tr key={service.id}>
                                        <td>
                                            <span className="monthly-service-id">{service.id.substring(0, 4)}...</span>
                                            <span className="monthly-service-date"> ({new Date(service.fecha).toLocaleDateString('es-AR')})</span>
                                        </td>
                                        <td><span className={`monthly-service-type-tag tag-${service.tipo.toLowerCase()}`}>{service.tipo}</span></td>
                                        <td>{service.marca}</td>
                                        <td className="monthly-text-right">{formatCurrency(service.precio)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EstadisticasAdmin;