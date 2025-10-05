import React, { useState, useEffect, useCallback } from "react";
import Swal from "sweetalert2";

// Importar el Modal que crearemos en la siguiente sección
import ModalDetalles from "./ModalDetalles"; 
import './Paneltrabajos.css';

// URL BASE de json-server
const API_URL = "http://localhost:3001"; 

// Opciones de estado para visualización (tomadas de tu ServiciosAdmin.jsx)
const ESTADO_OPTIONS = [
    { value: "pendiente", label: "Pendiente" },
    { value: "enRevision", label: "En Revisión" },
    { value: "revisionTerminada", label: "Revisión Terminada" },
    { value: "terminado", label: "Listo para Entrega" },
    { value: "entregado", label: "Entregado" },
];

// Función para obtener el Label del estado
const getEstadoLabel = (value) => {
    return ESTADO_OPTIONS.find(o => o.value === value)?.label || value;
};

// Función para obtener el nombre del cliente
const getClienteName = (clienteId, clientes) => {
    return clientes.find(c => c.id === clienteId)?.nombreCompleto || "Cliente Desconocido";
};

const PanelTrabajo = () => {
    const [servicios, setServicios] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    const [modalOpen, setModalOpen] = useState(false);
    const [servicioSeleccionado, setServicioSeleccionado] = useState(null);

    // --- CARGA INICIAL DE DATOS ---
    const cargarDatos = useCallback(async () => {
        setIsLoading(true);
        try {
            const [serviciosRes, clientesRes] = await Promise.all([
                fetch(`${API_URL}/servicios`),
                fetch(`${API_URL}/clientes`),
            ]);

            const [serviciosData, clientesData] = await Promise.all([
                serviciosRes.json(),
                clientesRes.json(),
            ]);

            setServicios(serviciosData);
            setClientes(clientesData);
        } catch (error) {
            console.error("Error al cargar datos del panel:", error);
            Swal.fire("Error", "No se pudieron cargar los servicios o clientes.", "error");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        cargarDatos();
    }, [cargarDatos]);

    // --- LÓGICA DE FILTRADO Y ORDENACIÓN ---
    
    // 1. FILTRAR: Solo servicios activos (donde fechaSalida es null o estado no es 'entregado')
    const serviciosActivos = servicios.filter(servicio => 
        !servicio.fechaSalida && servicio.estado !== 'entregado'
    );

    // 2. ORDENAR: LIFO (el más reciente en fechaEntrada primero)
    const serviciosOrdenados = serviciosActivos.sort((a, b) => 
        new Date(b.fechaEntrada) - new Date(a.fechaEntrada) 
    );
    
    // 3. BUSCADOR: Filtrar la lista ordenada
    const serviciosFiltrados = serviciosOrdenados.filter(s => {
        const query = searchQuery.toLowerCase();
        const clienteNombre = getClienteName(s.clienteId, clientes).toLowerCase();
        return (
            s.id.toString().includes(query) ||
            s.marcaProducto.toLowerCase().includes(query) ||
            s.tipoServicio.toLowerCase().includes(query) ||
            clienteNombre.includes(query)
        );
    });


    // --- MANEJO DE ACCIONES ---

    // ABRIR MODAL DE DETALLES/EDICIÓN (Botón ☰)
    const handleVerDetalles = (servicio) => {
        setServicioSeleccionado(servicio);
        setModalOpen(true);
    };
    
    // GUARDAR EDICIÓN DEL MODAL
    const handleGuardarEdicion = async (idServicio, datosEditados) => {
        try {
            const res = await fetch(`${API_URL}/servicios/${idServicio}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(datosEditados),
            });
            if (!res.ok) throw new Error("Error al guardar la edición");
            
            Swal.fire("Actualizado", `Servicio ${idServicio} editado.`, "success");
            cargarDatos(); // Recarga para actualizar el panel
            setModalOpen(false);
        } catch (error) {
            console.error("Error al guardar edición:", error);
            Swal.fire("Error", "No se pudo guardar la edición.", "error");
        }
    };


    // ACCIÓN CLAVE: Botón Tilde (Marcar como Entregado) ✅
    const handleEntregarServicio = async (idServicio) => {
        const confirm = await Swal.fire({
            title: "¿Confirmar Entrega?",
            text: "El servicio se marcará como 'Entregado' y se moverá al Historial.",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Sí, Entregar",
            cancelButtonText: "Cancelar",
        });

        if (!confirm.isConfirmed) return;

        const fechaSalida = new Date().toISOString();
        const datosActualizados = {
            fechaSalida: fechaSalida, 
            estado: 'entregado' 
        };
        
        try {
            // Petición PATCH a la API
            const res = await fetch(`${API_URL}/servicios/${idServicio}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(datosActualizados),
            });
            
            if (!res.ok) throw new Error("Error en la petición al servidor.");

            Swal.fire("¡Entregado!", `El servicio ${idServicio} se ha entregado y fue al historial.`, "success");
            cargarDatos(); // Recargar para que el servicio desaparezca de la lista
            
        } catch (error) {
            console.error("Error al completar la entrega:", error);
            Swal.fire("Error", "No se pudo completar la entrega.", "error");
        }
    };
    
    // --- RENDERIZADO ---

    if (isLoading) return <div className="panel-loading">Cargando Panel de Trabajo...</div>;

    return (
        <div className="panel-trabajo-container">
            <h1>Panel de Trabajo 💼</h1>
            <p className="panel-subtitulo">
                Servicios Pendientes o en Proceso (Excluye estado 'Entregado'). 
                **Total Activos: {serviciosFiltrados.length}**
            </p>

            <div className="panel-buscador">
                <input
                    type="text"
                    placeholder="Buscar por cliente, ID o producto..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            
            <div className="servicios-lista">
                {serviciosFiltrados.length === 0 ? (
                    <p className="mensaje-vacio">🎉 ¡No hay trabajos pendientes! Todo al día. 🎉</p>
                ) : (
                    serviciosFiltrados.map(servicio => {
                        const clienteNombre = getClienteName(servicio.clienteId, clientes);
                        const estadoLabel = getEstadoLabel(servicio.estado);
                        
                        // Resaltado de servicios listos para entregar (Terminado o Revisión Terminada)
                        const esPrioridad = servicio.estado === 'terminado' || servicio.estado === 'revisionTerminada';

                        return (
                            <div 
                                key={servicio.id} 
                                className={`tarjeta-servicio ${esPrioridad ? 'prioridad-entrega' : ''}`}
                            >
                                
                                <div className="info-resumen">
                                    <p className="id-servicio">ID: <strong>{servicio.id}</strong></p>
                                    <p>Cliente: <strong>{clienteNombre}</strong></p>
                                    <p>Producto: {servicio.marcaProducto}</p>
                                    <p>Estado: 
                                        <span className={`estado-badge estado-${servicio.estado}`}>
                                            {estadoLabel}
                                        </span>
                                    </p>
                                </div>

                                <div className="acciones">
                                    {/* Botón ☰: Abre el modal para ver y editar todos los campos */}
                                    <button 
                                        className="btn-detalles" 
                                        onClick={() => handleVerDetalles(servicio)}
                                        title="Ver y Editar Detalles"
                                    >
                                        ☰
                                    </button>

                                    {/* Botón ✅: Marca como entregado y mueve al historial */}
                                    <button 
                                        className="btn-entregar" 
                                        onClick={() => handleEntregarServicio(servicio.id)}
                                        title="Marcar como Entregado"
                                    >
                                        ✅
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
            
            {/* MODAL DE DETALLES Y EDICIÓN */}
            <ModalDetalles
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                servicio={servicioSeleccionado}
                clientes={clientes} // Pasa la lista de clientes para poder cambiarlo en el modal
                onSave={handleGuardarEdicion}
            />
        </div>
    );
};

export default PanelTrabajo;