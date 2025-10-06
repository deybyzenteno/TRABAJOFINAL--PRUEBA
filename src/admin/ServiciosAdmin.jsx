import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import Select from "react-select";
import { QRCodeSVG } from "qrcode.react";
import "./servicios.css";

const TIPO_SERVICIO_OPTIONS = [
    { value: "celulares", label: "Celulares" },
    { value: "computadora", label: "Computadora" },
    { value: "parlantes", label: "Parlantes" },
    { value: "otros", label: "Otros" },
];

const ESTADO_OPTIONS = [
    { value: "pendiente", label: "Pendiente" },
    { value: "enRevision", label: "En Revisión" },
    { value: "revisionTerminada", label: "En Reparacion" },
    { value: "terminado", label: "Terminado" },
    { value: "entregado", label: "Entregado" }, // Estado para formalizar la entrega
];

const URL_BASE_PUBLICA = "http://192.168.1.14:5173"; 

function ServiciosAdmin() {
    const initialState = {
        clienteId: null,
        marcaProducto: "",
        tipoServicio: TIPO_SERVICIO_OPTIONS[0].value,
        detalles: "",
        presupuesto: { items: [{ descripcion: "", costo: 0 }], subtotal: 0, iva: 0, total: 0 },
        estado: ESTADO_OPTIONS[0].value,
        fechaEntrada: new Date().toISOString().split('T')[0], 
        fechaSalida: null,
    };

    const [formData, setFormData] = useState(initialState);
    const [clientes, setClientes] = useState([]);
    const [servicios, setServicios] = useState([]);
    const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
    const [showListaServicios, setShowListaServicios] = useState(false);
    
    // CAMBIO CLAVE: Usamos el ID del servicio que se está editando
    const [editId, setEditId] = useState(null); 
    
    const [editData, setEditData] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    
    // CAMBIO CLAVE: Usamos el ID del servicio cuyo presupuesto está abierto
    const [showBudgetId, setShowBudgetId] = useState(null); 

    // Carga inicial de clientes y servicios
    useEffect(() => {
        // ... (Tu código de carga de clientes y servicios permanece igual)
        fetch("http://localhost:3001/clientes")
            .then((res) => res.json())
            .then((data) => {
                const options = data.map((c) => ({
                    value: c.id,
                    label: c.nombreCompleto,
                }));
                setClientes(options);
            })
            .catch(console.error);

        fetch("http://localhost:3001/servicios")
            .then((res) => res.json())
            .then((data) => setServicios(data))
            .catch(console.error);
    }, []);

    // Helper para calcular totales del presupuesto
    const calcularTotal = (items) => {
        const subtotal = items.reduce((sum, item) => sum + Number(item.costo || 0), 0);
        return { subtotal, iva: 0, total: subtotal };
    };

    // FUNCIÓN: Alternar el presupuesto (Ahora usa el ID)
    const toggleBudget = (id) => {
        setShowBudgetId(showBudgetId === id ? null : id);
    };
    
    // ... (handlePresupuestoChange, addPresupuestoItem, removePresupuestoItem, handleGeneralChange, handleClienteSelect, handleSubmit permanecen iguales ya que no dependen del índice) ...

    // ----------------------------------------
    // Form nuevo servicio (Lógica de Presupuesto)
    // ----------------------------------------
    const handlePresupuestoChange = (index, e) => {
        const { name, value } = e.target;
        const newItems = formData.presupuesto.items.map((item, i) =>
            i === index ? { ...item, [name]: name === "costo" ? Number(value) : value } : item
        );
        const { subtotal, iva, total } = calcularTotal(newItems);
        setFormData({ ...formData, presupuesto: { items: newItems, subtotal, iva, total } });
    };

    const addPresupuestoItem = () => {
        const newItems = [...formData.presupuesto.items, { descripcion: "", costo: 0 }];
        const { subtotal, iva, total } = calcularTotal(newItems);
        setFormData({ ...formData, presupuesto: { items: newItems, subtotal, iva, total } });
    };

    const removePresupuestoItem = (index) => {
        const newItems = formData.presupuesto.items.filter((_, i) => i !== index);
        const { subtotal, iva, total } = calcularTotal(newItems);
        setFormData({ ...formData, presupuesto: { items: newItems, subtotal, iva, total } });
    };

    const handleGeneralChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleClienteSelect = (selectedOption) => {
        setClienteSeleccionado(selectedOption);
        setFormData((prev) => ({ ...prev, clienteId: selectedOption.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.clienteId) {
            Swal.fire("Atención", "Debe seleccionar un cliente.", "warning");
            return;
        }
        
        const clienteId = formData.clienteId; 

        try {
            // 1. CREAR EL SERVICIO
            const resServicio = await fetch("http://localhost:3001/servicios", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            if (!resServicio.ok) throw new Error("Error al crear servicio");
            const nuevoServicio = await resServicio.json();
            
            // 2. OBTENER LOS DATOS ACTUALES DEL CLIENTE
            const resCliente = await fetch(`http://localhost:3001/clientes/${clienteId}`);
            if (!resCliente.ok) throw new Error("Error al obtener datos del cliente");
            const clienteActual = await resCliente.json();

            // 3. ACTUALIZAR EL ARRAY serviciosRealizados del Cliente en la DB
            const nuevosServiciosRealizados = [
                ...(clienteActual.serviciosRealizados || []),
                nuevoServicio.id
            ];
            
            const resUpdateCliente = await fetch(`http://localhost:3001/clientes/${clienteId}`, {
                method: "PATCH", 
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ serviciosRealizados: nuevosServiciosRealizados }),
            });
            
            if (!resUpdateCliente.ok) throw new Error("Error al actualizar el cliente");

            // 4. ACTUALIZAR ESTADOS LOCALES Y NOTIFICAR
            Swal.fire("Servicio creado", `ID ${nuevoServicio.id} registrado y asociado al cliente.`, "success");
            setServicios((prev) => [...prev, nuevoServicio]);
            setFormData(initialState);
            setClienteSeleccionado(null);
            
        } catch (err) {
            console.error("Error en la creación o vinculación del servicio:", err);
            Swal.fire("Error", "No se pudo completar la operación: " + err.message, "error");
        }
    };

    // ----------------------------------------
    // Edición y eliminación
    // ----------------------------------------
    // FUNCIÓN CORREGIDA: Ahora recibe el ID del servicio
    const handleEditClick = (serviceId) => {
        const serviceToEdit = servicios.find(s => s.id === serviceId);
        if (serviceToEdit) {
            setEditId(serviceId); // Establece el ID que se está editando
            // Clonar el objeto para que las ediciones no afecten el estado original
            setEditData(JSON.parse(JSON.stringify(serviceToEdit))); 
            // Ocultar presupuesto si estaba visible al entrar en edición
            setShowBudgetId(null);
        }
    };

    const handleCancelEdit = () => {
        setEditId(null);
        setEditData(null);
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        // Convierte el valor a null si es un campo de fecha vacío (solo para fechaSalida si no es requerido)
        const newValue = (name === "fechaSalida" && value === "") ? null : value; 
        setEditData({ ...editData, [name]: newValue });
    };

    const handleEditPresupuestoChange = (i, e) => {
        const { name, value } = e.target;
        const newItems = editData.presupuesto.items.map((item, idx) =>
            idx === i ? { ...item, [name]: name === "costo" ? Number(value) : value } : item
        );
        const { subtotal, iva, total } = calcularTotal(newItems);
        setEditData({ ...editData, presupuesto: { items: newItems, subtotal, iva, total } });
    };

    const addEditPresupuestoItem = () => {
        const newItems = [...editData.presupuesto.items, { descripcion: "", costo: 0 }];
        const { subtotal, iva, total } = calcularTotal(newItems);
        setEditData({ ...editData, presupuesto: { items: newItems, subtotal, iva, total } });
    };

    const removeEditPresupuestoItem = (i) => {
        const newItems = editData.presupuesto.items.filter((_, idx) => idx !== i);
        const { subtotal, iva, total } = calcularTotal(newItems);
        setEditData({ ...editData, presupuesto: { items: newItems, subtotal, iva, total } });
    };

    const handleSaveEdit = async () => {
        const dataToSave = JSON.parse(JSON.stringify(editData));
        
        if (dataToSave.estado === 'entregado' && !dataToSave.fechaSalida) {
            dataToSave.fechaSalida = new Date().toISOString(); 
        } 
        
        try {
            const res = await fetch(`http://localhost:3001/servicios/${dataToSave.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dataToSave),
            });
            if (!res.ok) throw new Error("Error al guardar cambios");
            const updated = await res.json();
            
            // Reemplaza el servicio en el array original 'servicios' por su ID
            setServicios(prevServicios => prevServicios.map(s => 
                s.id === updated.id ? updated : s
            ));
            
            setEditId(null); // Limpiamos el ID de edición
            setEditData(null);
            Swal.fire("Actualizado", `Servicio ${updated.id} guardado.`, "success");
        } catch (err) {
            Swal.fire("Error", err.message, "error");
        }
    };

    const handleDeleteServicio = async (id) => {
        const confirm = await Swal.fire({
            title: "¿Eliminar servicio?",
            text: "Esta acción no se puede deshacer. También se desvinculará del cliente.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar",
        });
        if (!confirm.isConfirmed) return;

        try {
            const servicioAEliminar = servicios.find(s => s.id === id);
            
            // --- LÓGICA DE DESVINCULACIÓN DEL CLIENTE ---
            if (servicioAEliminar) {
                const clienteId = servicioAEliminar.clienteId;
                
                const resCliente = await fetch(`http://localhost:3001/clientes/${clienteId}`);
                const clienteActual = await resCliente.json();
                
                const nuevosServiciosRealizados = (clienteActual.serviciosRealizados || []).filter(
                    servicioId => servicioId !== id
                );
                
                await fetch(`http://localhost:3001/clientes/${clienteId}`, {
                    method: "PATCH", 
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ serviciosRealizados: nuevosServiciosRealizados }),
                });
            }
            // --- FIN LÓGICA DE DESVINCULACIÓN ---

            // 4. Eliminar el servicio de la DB
            const res = await fetch(`http://localhost:3001/servicios/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Error al eliminar servicio");

            setServicios((prev) => prev.filter((s) => s.id !== id));
            Swal.fire("Eliminado", "El servicio fue eliminado correctamente.", "success");
        } catch (err) {
            console.error("Error al eliminar o desvincular:", err);
            Swal.fire("Error", err.message, "error");
        }
    };

    // ----------------------------------------
    // Filtrado y Ordenamiento
    // ----------------------------------------
    
    // 1. FILTRADO
    const serviciosFiltrados = servicios.filter((s) => {
        const query = searchQuery.toLowerCase();
        const cliente = clientes.find(c => c.value === s.clienteId)?.label || "";
        return (
            s.id.toString().includes(query) ||
            s.marcaProducto.toLowerCase().includes(query) ||
            s.tipoServicio.toLowerCase().includes(query) ||
            cliente.toLowerCase().includes(query)
        );
    });

    // 2. ORDENAMIENTO (Descendente por ID para que el más nuevo esté primero)
    // Usamos el operador spread `...` para clonar el array antes de ordenarlo
    const serviciosOrdenados = [...serviciosFiltrados].sort((a, b) => b.id - a.id);

    return (
        <div className="servicios-full">
            <div className="servicios-container">
                <h2>Creación de Nuevo Servicio 🛠️</h2>

                {/* FORMULARIO NUEVO SERVICIO (sin cambios) */}
                <form className="servicio-form" onSubmit={handleSubmit}>
                    <fieldset className="seccion-form">
                        <legend>Datos del Cliente y Producto</legend>
                        <label>Cliente:</label>
                        <Select 
                            options={clientes} 
                            onChange={handleClienteSelect} 
                            value={clienteSeleccionado} 
                            placeholder="Buscar cliente..." 
                            classNamePrefix="react-select"
                        />
                        <label>Marca del Producto:</label>
                        <input type="text" name="marcaProducto" value={formData.marcaProducto} onChange={handleGeneralChange} required />
                        <label>Tipo de Equipo:</label>
                        <select name="tipoServicio" value={formData.tipoServicio} onChange={handleGeneralChange}>
                            {TIPO_SERVICIO_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                        <label>Detalles:</label>
                        <textarea name="detalles" value={formData.detalles} onChange={handleGeneralChange} rows="3" />
                        
                        <label>Fecha de Entrada:</label>
                        <input 
                            type="date" 
                            name="fechaEntrada" 
                            value={formData.fechaEntrada} 
                            onChange={handleGeneralChange} 
                            required 
                        />
                    </fieldset>

                    <fieldset className="seccion-form presupuesto-section">
                        <legend>Presupuesto</legend>
                        {formData.presupuesto.items.map((item, i) => (
                            <div key={i} className="presupuesto-item">
                                <input type="text" name="descripcion" placeholder="Descripción" value={item.descripcion} onChange={(e) => handlePresupuestoChange(i, e)} />
                                <input type="number" name="costo" placeholder="Costo" value={item.costo} onChange={(e) => handlePresupuestoChange(i, e)} />
                                <button type="button" onClick={() => removePresupuestoItem(i)}>&times;</button>
                            </div>
                        ))}
                        <button type="button" onClick={addPresupuestoItem}>+ Agregar ítem</button>
                        <div className="presupuesto-resumen">
                            <p>Subtotal: ${formData.presupuesto.subtotal.toFixed(2)}</p>
                            <p>Total: ${formData.presupuesto.total.toFixed(2)}</p>
                        </div>
                    </fieldset>

                    <button type="submit" className="btn-primary-servicio">Registrar Nuevo Servicio 🚀</button>
                </form>

                {/* BOTÓN MOSTRAR/OCULTAR SERVICIOS (sin cambios) */}
                <button className="btn-toggle-lista-servicios" onClick={() => setShowListaServicios(!showListaServicios)}>
                    {showListaServicios ? "Ocultar Servicios" : "Mostrar Servicios"}
                </button>

                {/* BUSCADOR (sin cambios) */}
                {showListaServicios && (
                    <div className="buscador-servicios">
                        <input
                            type="text"
                            placeholder="Buscar por ID, cliente, marca o tipo..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                )}

                {/* LISTA DE SERVICIOS */}
                {showListaServicios && (
                    <div className="servicios-lista-wrapper">
                        <div className="servicios-lista-cards">
                            {/* CAMBIO CLAVE: Iteramos sobre serviciosOrdenados */}
                            {serviciosOrdenados.map((s) => {
                                const clienteNombre = clientes.find(c => c.value === s.clienteId)?.label || "Cliente desconocido";
                                
                                // CAMBIO CLAVE: Comparamos s.id con editId
                                const isEditing = editId === s.id; 
                                
                                // CAMBIO CLAVE: Comparamos s.id con showBudgetId
                                const isBudgetOpen = showBudgetId === s.id; 
                                
                                const qrUrl = `${URL_BASE_PUBLICA}/seguimiento/${s.id}`;
                                // console.log(`URL del Servicio ${s.id}: ${qrUrl}`); // Lo comentamos para limpiar la consola

                                return (
                                    <div 
                                        key={s.id} 
                                        className={`servicio-card ${isEditing ? 'editando' : ''}`} 
                                    >
                                        <div className="qr-info-header">
                                            <h4>ID: {s.id}</h4>
                                            <QRCodeSVG value={qrUrl} size={80} /> 
                                        </div>
                                        {/* CAMBIO CLAVE: Ahora preguntamos si el ID es igual al ID de edición */}
                                        {isEditing ? (
                                            <>
                                                {/* MODO EDICIÓN (sigue usando editData, que es correcto) */}
                                                <label>Cliente:</label>
                                                <select name="clienteId" value={editData.clienteId} onChange={handleEditChange}>
                                                    {clientes.map(c => (
                                                        <option key={c.value} value={c.value}>{c.label}</option>
                                                    ))}
                                                </select>
                                                <label>Marca Producto:</label>
                                                <input type="text" name="marcaProducto" value={editData.marcaProducto} onChange={handleEditChange} />
                                                <label>Tipo de Servicio:</label>
                                                <select name="tipoServicio" value={editData.tipoServicio} onChange={handleEditChange}>
                                                    {TIPO_SERVICIO_OPTIONS.map((o) => (
                                                        <option key={o.value} value={o.value}>{o.label}</option>
                                                    ))}
                                                </select>
                                                <label>Detalles:</label>
                                                <textarea name="detalles" value={editData.detalles} onChange={handleEditChange} rows="3" />
                                                <label>Estado:</label>
                                                <select name="estado" value={editData.estado} onChange={handleEditChange}>
                                                    {ESTADO_OPTIONS.map((o) => (
                                                        <option key={o.value} value={o.value}>{o.label}</option>
                                                    ))}
                                                </select>
                                                
                                                <label>Fecha de Entrada:</label>
                                                <input 
                                                    type="date" 
                                                    name="fechaEntrada" 
                                                    value={editData.fechaEntrada ? editData.fechaEntrada.split('T')[0] : ''} 
                                                    onChange={handleEditChange} 
                                                    required
                                                />

                                                <label>Fecha de Salida (Entregado):</label>
                                                <input 
                                                    type="date" 
                                                    name="fechaSalida" 
                                                    value={editData.fechaSalida ? new Date(editData.fechaSalida).toISOString().split('T')[0] : ''} 
                                                    onChange={handleEditChange} 
                                                />
                                                
                                                <fieldset className="presupuesto-section">
                                                    <legend>Presupuesto</legend>
                                                    {editData.presupuesto.items.map((item, idx) => (
                                                        <div key={idx} className="presupuesto-item">
                                                            <input type="text" name="descripcion" placeholder="Descripción" value={item.descripcion} onChange={(e) => handleEditPresupuestoChange(idx, e)} />
                                                            <input type="number" name="costo" placeholder="Costo" value={item.costo} onChange={(e) => handleEditPresupuestoChange(idx, e)} />
                                                            <button type="button" onClick={() => removeEditPresupuestoItem(idx)}>&times;</button>
                                                        </div>
                                                    ))}
                                                    <button type="button" onClick={addEditPresupuestoItem}>+ Agregar ítem</button>
                                                    <div className="presupuesto-resumen">
                                                        <p>Subtotal: ${editData.presupuesto.subtotal.toFixed(2)}</p>
                                                        <p>Total: ${editData.presupuesto.total.toFixed(2)}</p>
                                                    </div>
                                                </fieldset>

                                                <div className="acciones-servicio">
                                                    <button onClick={handleSaveEdit} className="btn-edit-servicio">Guardar</button>
                                                    <button onClick={handleCancelEdit} className="btn-cancel-edit">Cancelar</button>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                {/* MODO VISUALIZACIÓN */}
                                                <p><strong>Cliente:</strong> {clienteNombre}</p>
                                                <p><strong>Marca:</strong> {s.marcaProducto}</p>
                                                <p><strong>Tipo:</strong> {TIPO_SERVICIO_OPTIONS.find(o => o.value === s.tipoServicio)?.label || s.tipoServicio}</p>
                                                <p><strong>Estado:</strong> {ESTADO_OPTIONS.find(o => o.value === s.estado)?.label || s.estado}</p>
                                                
                                                {/* Las fechas deben ser convertidas de nuevo para mostrarse correctamente, usando el formato ISO. */}
                                                <p><strong>Entrada:</strong> {s.fechaEntrada ? new Date(s.fechaEntrada).toLocaleDateString() : 'N/A'}</p>
                                                {s.fechaSalida && (
                                                    <p><strong>Entrega:</strong> {new Date(s.fechaSalida).toLocaleDateString()}</p>
                                                )}
                                                
                                                {/* Botón de Presupuesto Desplegable */}
                                                <button 
                                                    className="btn-toggle-presupuesto"
                                                    // CAMBIO CLAVE: Le pasamos el ID del servicio
                                                    onClick={() => toggleBudget(s.id)} 
                                                >
                                                    <span className="resumen-total">
                                                        Total Presupuesto: <strong>${s.presupuesto.total.toFixed(2)}</strong>
                                                    </span>
                                                    {/* CAMBIO CLAVE: Comparamos s.id con showBudgetId */}
                                                    <span className="toggle-icon">{isBudgetOpen ? '▲' : '▼'}</span>
                                                </button>

                                                {/* Contenido del Presupuesto (Renderizado Condicional) */}
                                                {/* CAMBIO CLAVE: Usamos isBudgetOpen */}
                                                {isBudgetOpen && (
                                                    <fieldset className="presupuesto-oculto-detalle">
                                                        <legend>Detalle Ítems</legend>
                                                        {s.presupuesto.items.map((item, idx) => (
                                                            <p key={idx}>{item.descripcion} <span className="costo-detalle">${item.costo.toFixed(2)}</span></p>
                                                        ))}
                                                    </fieldset>
                                                )}
                                                
                                                <div className="acciones-servicio">
                                                    {/* CAMBIO CLAVE: Le pasamos el ID del servicio */}
                                                    <button onClick={() => handleEditClick(s.id)} className="btn-edit-servicio">Editar</button>
                                                    <button onClick={() => handleDeleteServicio(s.id)} className="btn-delete-servicio">Eliminar</button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        {serviciosFiltrados.length === 0 && <p style={{textAlign: 'center', marginTop: '20px'}}>No se encontraron servicios.</p>}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ServiciosAdmin;