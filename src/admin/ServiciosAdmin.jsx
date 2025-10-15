import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import Select from "react-select";
import { QRCodeSVG } from "qrcode.react";
import { generarComprobantePDF } from "../utils/generarComprobante";
import "./ServiciosAdmin.css";

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
  { value: "entregado", label: "Entregado" },
];

const URL_BASE_PUBLICA = "http://localhost:5173"; // Cambia por tu URL pública

function ServiciosAdmin() {
  const initialState = {
    clienteId: null,
    marcaProducto: "",
    tipoServicio: TIPO_SERVICIO_OPTIONS[0].value,
    detalles: "",
    presupuesto: { items: [{ descripcion: "", costo: 0 }], subtotal: 0, total: 0 },
    estado: ESTADO_OPTIONS[0].value,
    fechaEntrada: new Date().toISOString(),
    fechaSalida: null,
  };

  const [formData, setFormData] = useState(initialState);
  const [clientes, setClientes] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showListaServicios, setShowListaServicios] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState(null);
  const [showBudgetId, setShowBudgetId] = useState(null);

  useEffect(() => {
    fetch("http://localhost:3001/clientes")
      .then(res => res.json())
      .then(data => {
        const options = data.map(c => ({ value: c.id, label: c.nombreCompleto }));
        setClientes(options);
      })
      .catch(console.error);

    fetch("http://localhost:3001/servicios")
      .then(res => res.json())
      .then(data => setServicios(data))
      .catch(console.error);
  }, []);

  const calcularTotal = (items) => {
    const subtotal = items.reduce((sum, i) => sum + Number(i.costo || 0), 0);
    return { subtotal, total: subtotal };
  };

  const handlePresupuestoChange = (index, e, isEdit = false) => {
    const { name, value } = e.target;
    const targetData = isEdit ? editData : formData;
    const setTargetData = isEdit ? setEditData : setFormData;

    const newItems = targetData.presupuesto.items.map((item, i) =>
      i === index ? { ...item, [name]: name === "costo" ? Number(value) : value } : item
    );
    const { subtotal, total } = calcularTotal(newItems);
    setTargetData({ ...targetData, presupuesto: { items: newItems, subtotal, total } });
  };

  const addPresupuestoItem = (isEdit = false) => {
    const targetData = isEdit ? editData : formData;
    const setTargetData = isEdit ? setEditData : setFormData;

    const newItems = [...targetData.presupuesto.items, { descripcion: "", costo: 0 }];
    const { subtotal, total } = calcularTotal(newItems);
    setTargetData({ ...targetData, presupuesto: { items: newItems, subtotal, total } });
  };

  const removePresupuestoItem = (index, isEdit = false) => {
    const targetData = isEdit ? editData : formData;
    const setTargetData = isEdit ? setEditData : setFormData;

    const newItems = targetData.presupuesto.items.filter((_, i) => i !== index);
    const { subtotal, total } = calcularTotal(newItems);
    setTargetData({ ...targetData, presupuesto: { items: newItems, subtotal, total } });
  };

  const handleClienteSelect = (selectedOption) => {
    setClienteSeleccionado(selectedOption);
    setFormData(prev => ({ ...prev, clienteId: selectedOption.value }));
  };

  const handleGeneralChange = (e, isEdit = false) => {
    const { name, value } = e.target;
    const setTargetData = isEdit ? setEditData : setFormData;
    const targetData = isEdit ? editData : formData;
    setTargetData({ ...targetData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.clienteId) {
      Swal.fire("Atención", "Debe seleccionar un cliente.", "warning");
      return;
    }

    const dataToSend = { ...formData, fechaEntrada: new Date().toISOString() };

    try {
      // Crear servicio
      const resServicio = await fetch("http://localhost:3001/servicios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });
      if (!resServicio.ok) throw new Error("Error al crear servicio");
      const nuevoServicio = await resServicio.json();

      // Obtener cliente actual
      const resCliente = await fetch(`http://localhost:3001/clientes/${formData.clienteId}`);
      const clienteActual = await resCliente.json();

      // Actualizar lista y limpiar
      setServicios(prev => [...prev, nuevoServicio]);
      setFormData(initialState);
      setClienteSeleccionado(null);

      // Popup "Descargar comprobante / Cerrar"
      Swal.fire({
        title: "Servicio creado",
        text: `ID ${nuevoServicio.id} registrado y asociado al cliente.`,
        icon: "success",
        showCancelButton: true,
        cancelButtonText: "Cerrar",
        confirmButtonText: "Descargar comprobante",
      }).then(async (result) => {
        if (result.isConfirmed) {
          const urlSeguimiento = `${URL_BASE_PUBLICA}/seguimiento/${nuevoServicio.id}`;
          const doc = await generarComprobantePDF(nuevoServicio, clienteActual, urlSeguimiento);
          doc.save(`Comprobante_Servicio_${nuevoServicio.id}.pdf`);
        }
      });
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  const handleEditClick = (id) => {
    const serviceToEdit = servicios.find(s => s.id === id);
    if (serviceToEdit) {
      setEditId(id);
      const cloned = JSON.parse(JSON.stringify(serviceToEdit));
      setEditData(cloned);
    }
  };

  const handleSaveEdit = async () => {
    const dataToSave = JSON.parse(JSON.stringify(editData));
    try {
      const res = await fetch(`http://localhost:3001/servicios/${dataToSave.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSave),
      });
      if (!res.ok) throw new Error("Error al guardar cambios");
      const updated = await res.json();
      setServicios(prev => prev.map(s => s.id === updated.id ? updated : s));
      setEditId(null);
      setEditData(null);
      Swal.fire("Actualizado", `Servicio ${updated.id} guardado.`, "success");
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  const handleDeleteServicio = async (id) => {
    const confirm = await Swal.fire({
      title: "¿Eliminar servicio?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });
    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch(`http://localhost:3001/servicios/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar servicio");
      setServicios(prev => prev.filter(s => s.id !== id));
      Swal.fire("Eliminado", "El servicio fue eliminado correctamente.", "success");
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  const toggleBudget = (id) => setShowBudgetId(showBudgetId === id ? null : id);

  const serviciosFiltrados = servicios.filter(s => {
    const query = searchQuery.toLowerCase();
    const cliente = clientes.find(c => c.value === s.clienteId)?.label || "";
    return s.id.toString().includes(query) || s.marcaProducto.toLowerCase().includes(query) || s.tipoServicio.toLowerCase().includes(query) || cliente.toLowerCase().includes(query);
  });

  return (
    <div className="servicios-full">
      <div className="servicios-container">
        <h2>Creación de Nuevo Servicio 🛠️</h2>

        {/* Formulario nuevo servicio */}
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
              {TIPO_SERVICIO_OPTIONS.map(o => (<option key={o.value} value={o.value}>{o.label}</option>))}
            </select>

            <label>Detalles:</label>
            <textarea name="detalles" value={formData.detalles} onChange={handleGeneralChange} rows="3" />

            <label>Fecha de Entrada:</label>
            <input type="date" name="fechaEntrada" value={formData.fechaEntrada.split('T')[0]} onChange={handleGeneralChange} required />
          </fieldset>

          <fieldset className="presupuesto-section">
            <legend>Presupuesto</legend>
            {formData.presupuesto.items.map((item, i) => (
              <div key={i} className="presupuesto-item">
                <input type="text" name="descripcion" placeholder="Descripción" value={item.descripcion} onChange={e => handlePresupuestoChange(i, e)} />
                <input type="number" name="costo" placeholder="Costo" value={item.costo} onChange={e => handlePresupuestoChange(i, e)} />
                <button type="button" onClick={() => removePresupuestoItem(i)} className="btn-remove-item">&times;</button>
              </div>
            ))}
            <button type="button" onClick={() => addPresupuestoItem()}>+ Agregar ítem</button>
            <p>Total: ${formData.presupuesto.total.toFixed(2)}</p>
          </fieldset>

          <button type="submit" className="btn-primary-servicio">Registrar Nuevo Servicio 🚀</button>
        </form>

        {/* Lista de servicios */}
        <button className="btn-toggle-lista-servicios" onClick={() => setShowListaServicios(!showListaServicios)}>
          {showListaServicios ? "Ocultar Servicios" : "Mostrar Servicios"}
        </button>

        {showListaServicios && (
          <>
            <input type="text" placeholder="Buscar..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            <div className="servicios-lista-cards">
              {serviciosFiltrados.map(s => {
                const clienteNombre = clientes.find(c => c.value === s.clienteId)?.label || "Cliente desconocido";
                const isEditing = editId === s.id;
                const isBudgetOpen = showBudgetId === s.id;
                const qrUrl = `${URL_BASE_PUBLICA}/seguimiento/${s.id}`;

                return (
                  <div key={s.id} className={`servicio-card ${isEditing ? 'editando' : ''}`}>
                    <div className="qr-info-header">
                      <h4>ID: {s.id}</h4>
                      <QRCodeSVG value={qrUrl} size={80} />
                    </div>

                    {isEditing ? (
                      <>
                        <label>Marca Producto:</label>
                        <input type="text" name="marcaProducto" value={editData.marcaProducto} onChange={e => handleGeneralChange(e, true)} />
                        <label>Tipo:</label>
                        <select name="tipoServicio" value={editData.tipoServicio} onChange={e => handleGeneralChange(e, true)}>
                          {TIPO_SERVICIO_OPTIONS.map(o => (<option key={o.value} value={o.value}>{o.label}</option>))}
                        </select>
                        <label>Estado:</label>
                        <select name="estado" value={editData.estado} onChange={e => handleGeneralChange(e, true)}>
                          {ESTADO_OPTIONS.map(o => (<option key={o.value} value={o.value}>{o.label}</option>))}
                        </select>

                        <fieldset className="presupuesto-section">
                          {editData.presupuesto.items.map((item, i) => (
                            <div key={i} className="presupuesto-item">
                              <input type="text" name="descripcion" placeholder="Descripción" value={item.descripcion} onChange={e => handlePresupuestoChange(i, e, true)} />
                              <input type="number" name="costo" placeholder="Costo" value={item.costo} onChange={e => handlePresupuestoChange(i, e, true)} />
                              <button type="button" onClick={() => removePresupuestoItem(i, true)} className="btn-remove-item">&times;</button>
                            </div>
                          ))}
                          <button type="button" onClick={() => addPresupuestoItem(true)}>+ Agregar ítem</button>
                          <p>Total: ${editData.presupuesto.total.toFixed(2)}</p>
                        </fieldset>

                        <button onClick={handleSaveEdit}>Guardar</button>
                        <button onClick={() => setEditId(null)}>Cancelar</button>
                      </>
                    ) : (
                      <>
                        <p><strong>Cliente:</strong> {clienteNombre}</p>
                        <p><strong>Marca:</strong> {s.marcaProducto}</p>
                        <p><strong>Tipo:</strong> {s.tipoServicio}</p>
                        <p><strong>Estado:</strong> {s.estado}</p>

                        <button onClick={() => toggleBudget(s.id)}>
                          {isBudgetOpen ? "Ocultar Presupuesto" : `Total Presupuesto: $${s.presupuesto.total.toFixed(2)}`}
                        </button>

                        {isBudgetOpen && (
                          <div>
                            {s.presupuesto.items.map((item, i) => (
                              <p key={i}>{item.descripcion}: ${item.costo.toFixed(2)}</p>
                            ))}
                          </div>
                        )}

                      <div className="acciones-servicio">
  <button 
    onClick={() => handleEditClick(s.id)} 
    className="btn-edit-servicio"
  >
    Editar
  </button>

  <button 
    onClick={() => handleDeleteServicio(s.id)} 
    className="btn-delete-servicio"
  >
    Eliminar
  </button>

  <button 
    onClick={async () => {
      const clienteData = clientes.find(c => c.value === s.clienteId) || { nombreCompleto: "Cliente" };
      const doc = await generarComprobantePDF(s, clienteData, qrUrl);
      doc.save(`Comprobante_Servicio_${s.id}.pdf`);
    }} 
    className="btn-download-comprobante"
  >
    Descargar Comprobante
  </button>
</div>

                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ServiciosAdmin;
