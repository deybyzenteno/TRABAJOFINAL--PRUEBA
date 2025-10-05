import React, { useState, useEffect } from 'react';
// Asumiendo que las opciones de estado vienen de un archivo de configuración o del componente padre
const ESTADO_OPTIONS = [
    { value: "pendiente", label: "Pendiente" },
    { value: "enRevision", label: "En Revisión" },
    { value: "revisionTerminada", label: "En Reparacion" },
    { value: "terminado", label: "Listo para Entrega" },
    { value: "entregado", label: "Entregado" },
];
const TIPO_SERVICIO_OPTIONS = [
    { value: "celulares", label: "Celulares" },
    { value: "computadora", label: "Computadora" },
    { value: "parlantes", label: "Parlantes" },
    { value: "otros", label: "Otros" },
];

// Función Helper para calcular el total del presupuesto (copiada de tu ServiciosAdmin)
const calcularTotal = (items) => {
    const subtotal = items.reduce((sum, item) => sum + Number(item.costo || 0), 0);
    return { subtotal, iva: 0, total: subtotal };
};

const ModalDetalles = ({ isOpen, onClose, servicio, clientes, onSave }) => {
    const [editData, setEditData] = useState(null);

    // Sincronizar los datos del servicio en el estado de edición local
    useEffect(() => {
        if (servicio) {
            // Clonación profunda de los datos para no modificar el estado original
            setEditData(JSON.parse(JSON.stringify(servicio))); 
        }
    }, [servicio]);

    if (!isOpen || !editData) return null;

    // Manejo de cambios generales (marcaProducto, detalles, estado, tipoServicio)
    const handleGeneralChange = (e) => {
        const { name, value } = e.target;
        // Convierte las fechas a formato de cadena YYYY-MM-DDT... si son dates
        const newValue = (name === "fechaEntrada" || name === "fechaSalida") 
                         ? (value ? new Date(value).toISOString() : null)
                         : value;
        
        setEditData(prev => ({ ...prev, [name]: newValue }));
    };

    // Manejo de cambios del presupuesto
    const handlePresupuestoChange = (index, e) => {
        const { name, value } = e.target;
        const newItems = editData.presupuesto.items.map((item, i) =>
            i === index ? { ...item, [name]: name === "costo" ? Number(value) : value } : item
        );
        const { subtotal, iva, total } = calcularTotal(newItems);
        setEditData(prev => ({ ...prev, presupuesto: { items: newItems, subtotal, iva, total } }));
    };

    const addPresupuestoItem = () => {
        const newItems = [...editData.presupuesto.items, { descripcion: "", costo: 0 }];
        const { subtotal, iva, total } = calcularTotal(newItems);
        setEditData(prev => ({ ...prev, presupuesto: { items: newItems, subtotal, iva, total } }));
    };

    const removePresupuestoItem = (index) => {
        const newItems = editData.presupuesto.items.filter((_, i) => i !== index);
        const { subtotal, iva, total } = calcularTotal(newItems);
        setEditData(prev => ({ ...prev, presupuesto: { items: newItems, subtotal, iva, total } }));
    };


    const handleSubmit = (e) => {
        e.preventDefault();
        
        // LÓGICA DE FECHA DE SALIDA/ENTREGA AUTOMÁTICA (similar a tu ServiciosAdmin)
        const dataToSave = JSON.parse(JSON.stringify(editData));
        if (dataToSave.estado === 'entregado' && !dataToSave.fechaSalida) {
            dataToSave.fechaSalida = new Date().toISOString(); 
        }
        
        // Llamar a la función de guardado del componente padre
        onSave(servicio.id, dataToSave); 
    };

    const clienteActual = clientes.find(c => c.id === editData.clienteId) || {};
    
    // Formatear las fechas para el input[type=date]
    const formatToDateInput = (dateString) => {
        return dateString ? dateString.split('T')[0] : '';
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-content">
                <h3>Editar Servicio ID: {editData.id}</h3>
                <form onSubmit={handleSubmit} className="modal-form">
                    
                    <fieldset>
                        <legend>Datos Principales</legend>
                        <label>Cliente:</label>
                        <select name="clienteId" value={editData.clienteId} onChange={handleGeneralChange}>
                            {clientes.map(c => (
                                <option key={c.id} value={c.id}>{c.nombreCompleto}</option>
                            ))}
                        </select>
                        
                        <label>Marca del Producto:</label>
                        <input type="text" name="marcaProducto" value={editData.marcaProducto} onChange={handleGeneralChange} required />
                        
                        <label>Tipo de Equipo:</label>
                        <select name="tipoServicio" value={editData.tipoServicio} onChange={handleGeneralChange}>
                            {TIPO_SERVICIO_OPTIONS.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
                        </select>
                        
                        <label>Detalles:</label>
                        <textarea name="detalles" value={editData.detalles} onChange={handleGeneralChange} rows="3" />
                    </fieldset>

                    <fieldset>
                        <legend>Estado y Fechas</legend>
                        <label>Estado:</label>
                        <select name="estado" value={editData.estado} onChange={handleGeneralChange}>
                            {ESTADO_OPTIONS.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
                        </select>
                        
                        <label>Fecha de Entrada:</label>
                        <input 
                            type="date" 
                            name="fechaEntrada" 
                            value={formatToDateInput(editData.fechaEntrada)} 
                            onChange={handleGeneralChange} 
                            required 
                        />

                        <label>Fecha de Salida (Entregado):</label>
                        <input 
                            type="date" 
                            name="fechaSalida" 
                            value={formatToDateInput(editData.fechaSalida)} 
                            onChange={handleGeneralChange} 
                        />
                    </fieldset>
                    
                    <fieldset className="presupuesto-section">
                        <legend>Presupuesto</legend>
                        {editData.presupuesto?.items?.map((item, i) => (
                            <div key={i} className="presupuesto-item">
                                <input type="text" name="descripcion" placeholder="Descripción" value={item.descripcion} onChange={(e) => handlePresupuestoChange(i, e)} />
                                <input type="number" name="costo" placeholder="Costo" value={item.costo} onChange={(e) => handlePresupuestoChange(i, e)} />
                                <button type="button" onClick={() => removePresupuestoItem(i)}>&times;</button>
                            </div>
                        ))}
                        <button type="button" onClick={addPresupuestoItem}>+ Agregar ítem</button>
                        <div className="presupuesto-resumen">
                            <p>Subtotal: ${editData.presupuesto?.subtotal?.toFixed(2) || '0.00'}</p>
                            <p>Total: **${editData.presupuesto?.total?.toFixed(2) || '0.00'}**</p>
                        </div>
                    </fieldset>
                    
                    <div className="modal-actions">
                        <button type="submit" className="btn-guardar">💾 Guardar Cambios</button>
                        <button type="button" onClick={onClose} className="btn-cancelar">Cerrar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ModalDetalles;