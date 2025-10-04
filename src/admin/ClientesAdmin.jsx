import { useState, useEffect } from "react";
import "./clientes.css";
import Swal from "sweetalert2";

// ------------------------------------------------------------------
// COMPONENTE MODAL DE SERVICIOS
// ------------------------------------------------------------------
const ServiciosModal = ({ cliente, servicios, onClose }) => {
    if (!cliente) return null;

    // Función auxiliar para renderizar el detalle de cada servicio
    const renderServicioDetalle = (s) => (
        <div key={s.id} className="servicio-item-modal">
            <p><strong>ID Servicio:</strong> {s.id}</p>
            <p><strong>Tipo:</strong> {s.tipoServicio}</p>
            <p><strong>Estado:</strong> <span className={`estado-${s.estado}`}>{s.estado?.toUpperCase()}</span></p>
            <p><strong>Fecha Entrada:</strong> {new Date(s.fechaEntrada).toLocaleDateString()}</p>
            <p><strong>Detalles:</strong> {s.detalles}</p>
            <p><strong>Presupuesto Total:</strong> ${s.presupuesto?.total || 'N/A'}</p>
            <div className="modal-acciones">
                 <button className="btn-ver-detalle-servicio">Ver Detalles (Futuro Link)</button>
            </div>
        </div>
    );
    
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={onClose}>&times;</button>
                
                <h3 className="modal-titulo">Servicios de {cliente.nombreCompleto}</h3>
                
                <div className="modal-body">
                    {servicios.length === 0 ? (
                        <p className="no-servicios-modal">Este cliente no tiene servicios registrados.</p>
                    ) : (
                        <div className="servicios-lista-modal">
                            {servicios.map(renderServicioDetalle)}
                        </div>
                    )}
                </div>
                
            </div>
        </div>
    );
};
// ------------------------------------------------------------------


function Clientes() {
    const [formData, setFormData] = useState({
        nombreCompleto: "",
        celular: "",
        correo: "",
        direccion: "",
        serviciosRealizados: [], 
    });

    const [clientes, setClientes] = useState([]);
    const [editId, setEditId] = useState(null);
    const [search, setSearch] = useState("");
    const [mostrarLista, setMostrarLista] = useState(false);
    
    // ESTADOS NUEVOS para el Modal
    const [modalOpen, setModalOpen] = useState(false);
    const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
    const [serviciosDetalle, setServiciosDetalle] = useState([]);

    // Cargar clientes al inicio
    useEffect(() => {
        fetch("http://localhost:3001/clientes")
            .then((res) => res.json())
            .then((data) => setClientes(data));
    }, []);
    
    // Función para obtener detalles de los servicios
    const fetchServiciosDetalle = async (idsServicios) => {
        if (!idsServicios || idsServicios.length === 0) {
            setServiciosDetalle([]);
            return;
        }

        try {
            // TRAEMOS TODOS LOS SERVICIOS Y FILTRAMOS EN EL FRONT (para JSON Server)
            const res = await fetch("http://localhost:3001/servicios");
            const todosLosServicios = await res.json();
            
            // Filtramos los servicios que corresponden a los IDs del cliente
            const serviciosFiltrados = todosLosServicios.filter(servicio => 
                idsServicios.includes(servicio.id)
            );
            
            setServiciosDetalle(serviciosFiltrados);
        } catch (error) {
            console.error("Error al cargar detalles de servicios:", error);
            setServiciosDetalle([]);
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "No se pudieron cargar los detalles de los servicios.",
            });
        }
    };

    // Función para abrir el modal
    const handleOpenModal = (cliente) => {
        setClienteSeleccionado(cliente);
        fetchServiciosDetalle(cliente.serviciosRealizados);
        setModalOpen(true);
    };

    // Función para cerrar el modal
    const handleCloseModal = () => {
        setModalOpen(false);
        setClienteSeleccionado(null);
        setServiciosDetalle([]);
    };


    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    // ... (handleSubmit y handleDelete se mantienen iguales) ...
    const handleSubmit = async (e) => {
        e.preventDefault();

        let method = "POST";
        let url = "http://localhost:3001/clientes";
        let successMessage = "Cliente agregado correctamente. ";

        if (editId) {
            method = "PUT";
            url = `http://localhost:3001/clientes/${editId}`;
            successMessage = "Cliente editado correctamente. ";
        }

        try {
            const res = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editId ? formData : {...formData, serviciosRealizados: []}),
            });

            if (!res.ok) throw new Error("Error en la operación del servidor.");

            if (editId) {
                setClientes(
                    clientes.map((c) =>
                        c.id === editId ? { ...formData, id: editId } : c
                    )
                );
                setEditId(null);
            } else {
                const newCliente = await res.json();
                setClientes([...clientes, newCliente]);
            }

            Swal.fire({
                icon: "success",
                title: "¡Éxito!",
                text: successMessage,
                timer: 2500,
                showConfirmButton: false,
            });

            setFormData({ nombreCompleto: "", celular: "", correo: "", direccion: "", serviciosRealizados: [] });
        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "No se pudo realizar la operación: " + error.message,
            });
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: "¿Está seguro de eliminar este cliente?",
            text: "¡Si elimina el cliente, sus servicios registrados quedarán huérfanos!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#EF4444", 
            cancelButtonColor: "#64748b",
            confirmButtonText: "Sí, ¡Eliminar!",
            cancelButtonText: "Cancelar",
        });

        if (result.isConfirmed) {
            try {
                await fetch(`http://localhost:3001/clientes/${id}`, {
                    method: "DELETE",
                });
                setClientes(clientes.filter((c) => c.id !== id));

                Swal.fire({
                    icon: "success",
                    title: "Eliminado",
                    text: "Cliente eliminado correctamente.",
                    timer: 2000,
                    showConfirmButton: false,
                });
            } catch (error) {
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "No se pudo eliminar el cliente.",
                });
            }
        }
    };
    // ... (Fin de handleSubmit y handleDelete) ...

    const handleEdit = (cliente) => {
        setFormData(cliente); 
        setEditId(cliente.id);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const filteredClientes = clientes.filter((c) =>
        c.nombreCompleto.toLowerCase().includes(search.toLowerCase())
    );
    

    return (
        <div className="clientes-full">
            <div className="clientes-container">
                <h2>Gestión de Clientes</h2>

                {/* Formulario */}
                <form className="cliente-form" onSubmit={handleSubmit}>
                    <input
                        type="text"
                        name="nombreCompleto"
                        placeholder="Apellido y Nombre"
                        value={formData.nombreCompleto}
                        onChange={handleChange}
                        required
                    />
                    <input
                        type="text"
                        name="celular"
                        placeholder="Celular"
                        value={formData.celular}
                        onChange={handleChange}
                        required
                    />
                    <input
                        type="email"
                        name="correo"
                        placeholder="Correo"
                        value={formData.correo}
                        onChange={handleChange}
                    />
                    <input
                        type="text"
                        name="direccion"
                        placeholder="Dirección"
                        value={formData.direccion}
                        onChange={handleChange}
                    />
                    <button type="submit" className="btn-primary">
                        {editId ? "Guardar cambios " : "Agregar Cliente +"}
                    </button>
                </form>

                {/* Toggle Lista */}
                <button
                    className="btn-toggle"
                    onClick={() => setMostrarLista(!mostrarLista)}
                >
                    {mostrarLista
                        ? "Ocultar Lista de Clientes ▲"
                        : "Ver Lista de Clientes ▼"}
                </button>

                {/* Lista desplegable */}
                <div
                    className={`clientes-lista-wrapper ${
                        mostrarLista ? "show" : "hide"
                    }`}
                >
                    {mostrarLista && (
                        <div className="clientes-lista">
                            <div className="buscador">
                                <input
                                    type="text"
                                    placeholder="Buscar cliente por nombre..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>

                            {filteredClientes.length === 0 ? (
                                <p className="no-clientes">No hay clientes que coincidan</p>
                            ) : (
                                filteredClientes.map((c) => (
                                    <div key={c.id} className="cliente-card">
                                        {/* Información principal */}
                                        <div className="cliente-info">
                                            <h4>{c.nombreCompleto}</h4>
                                            <p>
                                                <b>Celular:</b> {c.celular}
                                            </p>
                                            <p>
                                                <b>Correo:</b> {c.correo}
                                            </p>
                                            <p>
                                                <b>Dirección:</b> {c.direccion}
                                            </p>
                                        </div>

                                        {/* Botón de Historial (Ahora abre el Modal) */}
                                        <div className="historial-toggle-area">
                                            <button
                                                className="btn-historial"
                                                onClick={() => handleOpenModal(c)}
                                            >
                                                Ver {c.serviciosRealizados.length || 0} Servicios Realizados 👁️
                                            </button>
                                        </div>
                                        
                                        {/* Acciones */}
                                        <div className="acciones">
                                            <button
                                                className="btn-edit"
                                                onClick={() => handleEdit(c)}
                                            >
                                                Editar
                                            </button>
                                            <button
                                                className="btn-delete"
                                                onClick={() => handleDelete(c.id)}
                                            >
                                                Eliminar
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Renderizado del Modal de Servicios */}
            {modalOpen && (
                <ServiciosModal
                    cliente={clienteSeleccionado}
                    servicios={serviciosDetalle}
                    onClose={handleCloseModal}
                />
            )}
        </div>
    );
}

export default Clientes;