import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import './ConsultaServicio.css'; // Importamos el CSS

// Opciones de estado mapeadas al flujo del taller
const PASOS = {
    P1_RECIBIDO: 'pendiente', 
    P2_EN_REVISION: 'enRevision', // Etapa de diagnóstico inicial
    P3_DIAGNOSTICO: 'diagnostico', // Diagnóstico finalizado / Presupuesto generado
    P4_REPARACION: 'reparacion', // Reparación activa
    P5_TERMINADO: 'terminado', 
    P6_ENTREGADO: 'entregado' // Estado final, oculto de la línea
};

// Descripciones detalladas para el cliente
const ESTADO_DISPLAY = {
    pendiente: "Equipo Recibido (Esperando ser Revisado)",
    enRevision: "En Revisión Inicial / Diagnóstico", 
    diagnostico: "Diagnóstico Finalizado / Presupuesto Generado",
    presupuestoPendiente: "Presupuesto Generado (Esperando Aprobación del Cliente)", // Estado intermedio
    reparacion: "En Proceso de Reparación Activa",
    revisionTerminada: "Revisión/Reparación Terminada (Control de Calidad)", // Estado intermedio
    terminado: "Listo para Retirar",
    entregado: "Servicio Entregado y Cerrado",
};


function ConsultaServicio() {
    const { id: urlId } = useParams(); 
    const navigate = useNavigate();
    
    const [searchId, setSearchId] = useState(urlId || '');
    const [servicio, setServicio] = useState(null);
    const [cliente, setCliente] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showPresupuestoModal, setShowPresupuestoModal] = useState(false);
    const [showBudgetDetails, setShowBudgetDetails] = useState(false); // <--- NUEVO ESTADO PARA DETALLES

    // Función para obtener los datos de la DB (Simulación con JSON Server)
    const fetchServicio = async (serviceId) => {
        if (!serviceId) return;
        setLoading(true);
        setError(null);
        setServicio(null);
        setCliente(null);

        try {
            // 1. Petición al servicio
            const resServicio = await fetch(`http://localhost:3001/servicios/${serviceId}`);
            if (!resServicio.ok) throw new Error("Servicio no encontrado.");
            const dataServicio = await resServicio.json();
            setServicio(dataServicio);

            // 2. Petición al cliente asociado
            const resCliente = await fetch(`http://localhost:3001/clientes/${dataServicio.clienteId}`);
            if (resCliente.ok) {
                const dataCliente = await resCliente.json();
                setCliente(dataCliente);
            }
            
        } catch (err) {
            setError("No se pudo encontrar el servicio con el ID proporcionado.");
            Swal.fire("Error", "ID de servicio no válido.", "error");
        } finally {
            setLoading(false);
        }
    };
    
    // Efecto para cargar datos si el ID está en la URL
    useEffect(() => {
        if (urlId) {
            setSearchId(urlId);
            fetchServicio(urlId);
        }
    }, [urlId]);

    // Reinicia el estado de showBudgetDetails cada vez que el modal se abre/cierra
    useEffect(() => {
        if (!showPresupuestoModal) {
            setShowBudgetDetails(false); // Cierra los detalles cuando se cierra el modal
        }
    }, [showPresupuestoModal]);


    // Manejador del formulario (botón o tecla Enter)
    const handleSearch = (e) => {
        e.preventDefault();
        
        const finalId = searchId.trim();
        if (!finalId) {
            Swal.fire("Atención", "Ingrese un ID de servicio.", "warning");
            return;
        }

        // Redirige a la URL con el ID
        navigate(`/seguimiento/${finalId}`);
    };
    
    // Lógica para determinar si un paso de la línea de tiempo está activo (4 pasos visibles)
    const isStepActive = (targetStep) => {
        const estadoActual = servicio?.estado;
        if (!estadoActual) return false;

        // 1. Definimos el orden de TODOS los estados (incluyendo intermedios)
        const order = [
            PASOS.P1_RECIBIDO,         
            PASOS.P2_EN_REVISION,      
            PASOS.P3_DIAGNOSTICO,      
            'presupuestoPendiente',    
            PASOS.P4_REPARACION,       
            'revisionTerminada',       
            PASOS.P5_TERMINADO,        
            PASOS.P6_ENTREGADO         
        ];
        
        const currentIndex = order.indexOf(estadoActual);

        // Mapeamos el paso visible (targetStep) a su índice de activación mínimo en el 'order'
        const activationIndexMap = {
            'P1_RECIBIDO': order.indexOf(PASOS.P1_RECIBIDO), // 1. pendiente
            'P2_DIAGNOSTICO': order.indexOf(PASOS.P2_EN_REVISION), // 2. enRevision (Inicio del Diagnóstico)
            'P3_REPARACION': order.indexOf(PASOS.P4_REPARACION), // 3. reparacion (Inicio de la Reparación)
            'P4_TERMINADO': order.indexOf(PASOS.P5_TERMINADO), // 4. terminado (Listo para Retirar)
        };
        
        const targetIndex = activationIndexMap[targetStep];

        return currentIndex >= targetIndex;
    };
    
    // Determinar el ícono principal basado en el estado
    const getStatusIcon = (estado) => {
        if (isStepActive('P4_TERMINADO')) return { icon: "🎁", class: "listo-bg" };
        if (isStepActive('P3_REPARACION')) return { icon: "🔧", class: "reparacion-bg" };
        if (isStepActive('P2_DIAGNOSTICO')) return { icon: "🔬", class: "diagnostico-bg" };
        if (isStepActive('P1_RECIBIDO')) return { icon: "📄", class: "recibido-bg" };
        return { icon: "❓", class: "default-bg" };
    };

    const currentIcon = getStatusIcon(servicio?.estado);


    // Renderizado del componente
    return (
        <div className="consulta-servicio-full">
            <header className="mobile-header">
                <span className="logo">SG Servicio Técnico</span>
                <button className="settings-button">⚙️</button>
            </header>

            <div className="consulta-servicio-container">
                <h1 className="title-bold">Estado de tu Equipo</h1>

                {/* Formulario de Búsqueda (Visible si no hay ID o error) */}
                {(!urlId || error) && (
                    <form onSubmit={handleSearch} className="search-form">
                        <input
                            type="text"
                            placeholder="Ingresa el ID de tu servicio"
                            value={searchId}
                            onChange={(e) => setSearchId(e.target.value)}
                            className="search-input"
                            disabled={loading}
                        />
                        <button 
                            type="submit" 
                            className="search-button"
                            disabled={loading}
                        >
                            {loading ? 'Buscando...' : 'Buscar'}
                        </button>
                    </form>
                )}
                
                {/* Mensajes de Estado */}
                {loading && <div className="status-message">Cargando detalles...</div>}
                {error && <div className="error-message">{error}</div>}
                

                {/* Resultado del Servicio (Si hay datos y no hay error/carga) */}
                {servicio && !loading && !error && (
                    <>
                        <div className="status-icon-container">
                            <div className={`status-icon ${currentIcon.class}`}>
                                <span role="img" aria-label="Status Icon">{currentIcon.icon}</span>
                                {/* Checkmark visible solo si no está Entregado */}
                                {servicio.estado !== PASOS.P6_ENTREGADO && <span className="checkmark-overlay">✅</span>}
                            </div>
                        </div>

                        {/* LINEA DE TIEMPO (PROGRESS BAR) - 4 Pasos Visibles */}
                        <div className="timeline-container four-steps"> 
                            
                            {/* Paso 1: Recibido */}
                            <div className="timeline-step">
                                <div className={`timeline-circle ${isStepActive('P1_RECIBIDO') ? 'active' : ''}`}></div>
                                <span className="timeline-label">Recibido</span>
                            </div>

                            {/* Línea 1 */}
                            <div className={`timeline-line ${isStepActive('P2_DIAGNOSTICO') ? 'line-active' : ''}`}></div>

                            {/* Paso 2: Diagnóstico/Presupuesto */}
                            <div className="timeline-step">
                                <div className={`timeline-circle ${isStepActive('P2_DIAGNOSTICO') ? 'active' : ''}`}>
                                    {isStepActive('P2_DIAGNOSTICO') && <span role="img" aria-label="Microscope">🔬</span>}
                                </div>
                                <span className="timeline-label">Diagnóstico</span>
                            </div>
                            
                            {/* Línea 2 */}
                            <div className={`timeline-line ${isStepActive('P3_REPARACION') ? 'line-active' : ''}`}></div>

                            {/* Paso 3: Reparación Activa */}
                            <div className="timeline-step">
                                <div className={`timeline-circle ${isStepActive('P3_REPARACION') ? 'active' : ''}`}>
                                    {isStepActive('P3_REPARACION') && <span role="img" aria-label="Wrench">🔧</span>}
                                </div>
                                <span className="timeline-label">Reparación</span>
                            </div>

                            {/* Línea 3 */}
                            <div className={`timeline-line ${isStepActive('P4_TERMINADO') ? 'line-active' : ''}`}></div>

                            {/* Paso 4: Terminado (Listo para Retirar) */}
                            <div className="timeline-step">
                                <div className={`timeline-circle ${isStepActive('P4_TERMINADO') ? 'active' : ''}`}>
                                    {isStepActive('P4_TERMINADO') && <span role="img" aria-label="Gift Box">🎁</span>}
                                </div>
                                <span className="timeline-label">Listo Retirar</span>
                            </div>
                        </div>
                        {/* FIN LINEA DE TIEMPO */}


                        <div className="details-box">
                            <p><strong>Cliente:</strong> {cliente?.nombreCompleto || 'N/A'}</p>
                            <p><strong>Equipo:</strong> {servicio.marcaProducto} ({servicio.tipoServicio})</p>
                            <p><strong>N° de Orden:</strong> SG-{servicio.id}</p>
                            {/* El estado detallado siempre muestra el estado real (incluyendo intermedios) */}
                            <p><strong>Estado Actual:</strong> <span className={`current-status-label ${servicio.estado}`}>{ESTADO_DISPLAY[servicio.estado] || servicio.estado}</span></p>
                            <p><strong>Fecha Ingreso:</strong> {new Date(servicio.fechaEntrada).toLocaleDateString()}</p>
                            <p><strong>Presupuesto Total:</strong> ${servicio.presupuesto?.total.toFixed(2) || 'Pendiente'}</p>
                        </div>

                        <div className="action-buttons">
                            {/* El botón "Ver Presupuesto" se muestra si hay un monto cargado o el estado es presupuestoPendiente */}
                            {(servicio.presupuesto?.total > 0 || servicio.estado === 'presupuestoPendiente') && (
                                <button className="btn-primary" onClick={() => setShowPresupuestoModal(true)}>
                                    Ver Presupuesto
                                </button>
                            )}
                            
                            <button className="btn-secondary" onClick={() => Swal.fire('Contacto', cliente?.telefono ? `Llamar a ${cliente.telefono}` : 'Datos de contacto no disponibles', 'info')}>
                                Contactar Taller
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Modal de Presupuesto (Simulado) */}
            {showPresupuestoModal && servicio && (
                <div className="modal-overlay" onClick={() => setShowPresupuestoModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>Detalle del Presupuesto (ID: {servicio.id})</h3>
                        
                        {/* Botón/Flecha para ver/ocultar los ítems del presupuesto */}
                        {servicio.presupuesto?.items?.length > 0 && (
                            <div className="toggle-budget-details">
                                <button 
                                    className="btn-link" 
                                    onClick={() => setShowBudgetDetails(!showBudgetDetails)}
                                >
                                    {showBudgetDetails ? 'Ocultar Detalles ▲' : 'Ver Detalles ▼'}
                                </button>
                            </div>
                        )}

                        {/* Ítems del presupuesto, mostrados solo si showBudgetDetails es true */}
                        {showBudgetDetails && servicio.presupuesto?.items && servicio.presupuesto.items.length > 0 ? (
                            <ul>
                                {servicio.presupuesto.items.map((item, index) => (
                                    <li key={index} className="modal-item">
                                        <span>{item.descripcion}</span>
                                        <span>${item.costo.toFixed(2)}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            !showBudgetDetails && servicio.presupuesto?.total > 0 && ( // Si no se han expandido, pero hay total
                                <p className="budget-summary">Total: ${servicio.presupuesto.total.toFixed(2)}</p>
                            )
                        )}

                        {/* Si no hay ítems y no hay total */}
                        {(!servicio.presupuesto?.items?.length && servicio.presupuesto?.total === 0) && (
                            <p>Detalles del presupuesto pendientes.</p>
                        )}

                        {servicio.presupuesto?.total > 0 && (
                            <div className="modal-total">
                                <strong>Total General: ${servicio.presupuesto.total.toFixed(2)}</strong>
                            </div>
                        )}
                        <button onClick={() => setShowPresupuestoModal(false)} className="btn-secondary">Cerrar</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ConsultaServicio;