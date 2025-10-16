import React, { useState, useEffect, useCallback, useMemo } from "react";
import Swal from "sweetalert2";
import ModalDetalles from "./ModalDetalles";
import { useNavigate } from 'react-router-dom';
import './Paneltrabajos.css';

const API_URL = "http://localhost:3001";

const ESTADO_OPTIONS = [
  { value: "pendiente", label: "Pendiente" },
  { value: "enRevision", label: "En Revisión" },
  { value: "revisionTerminada", label: "En Reparacion" },
  { value: "terminado", label: "Listo para Entrega" },
  { value: "entregado", label: "Entregado" },
];

const getEstadoLabel = (value) => {
  return ESTADO_OPTIONS.find(o => o.value === value)?.label || value;
};

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
  const [filtroEstado, setFiltroEstado] = useState("todos");

  const navigate = useNavigate();

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

  const serviciosActivos = servicios.filter(
    (servicio) => !servicio.fechaSalida && servicio.estado !== "entregado"
  );

  const serviciosOrdenados = serviciosActivos.sort(
    (a, b) => new Date(b.fechaEntrada) - new Date(a.fechaEntrada)
  );

  const conteosEstado = useMemo(() => {
    const counts = {
      todos: serviciosActivos.length,
      pendiente: 0,
      enRevision: 0,
      enReparacion: 0,
      listoParaEntrega: 0,
    };

    serviciosActivos.forEach(servicio => {
      if (servicio.estado === "pendiente") counts.pendiente++;
      else if (servicio.estado === "enRevision") counts.enRevision++;
      else if (servicio.estado === "revisionTerminada") counts.enReparacion++;
      else if (servicio.estado === "terminado") counts.listoParaEntrega++;
    });

    return counts;
  }, [serviciosActivos]);

  const serviciosFiltrados = serviciosOrdenados.filter((s) => {
    const query = searchQuery.toLowerCase();
    const clienteNombre = getClienteName(s.clienteId, clientes).toLowerCase();
    const coincideBusqueda =
      s.id.toString().includes(query) || clienteNombre.includes(query);

    let coincideFiltro = true;
    if (filtroEstado !== "todos") {
      switch (filtroEstado) {
        case "pendiente":
          coincideFiltro = s.estado === "pendiente";
          break;
        case "enRevision":
          coincideFiltro = s.estado === "enRevision";
          break;
        case "enReparacion":
          coincideFiltro = s.estado === "revisionTerminada";
          break;
        case "listoParaEntrega":
          coincideFiltro = s.estado === "terminado";
          break;
        default:
          coincideFiltro = true;
          break;
      }
    }
    return coincideBusqueda && coincideFiltro;
  });

  const handleVerDetalles = (servicio) => {
    setServicioSeleccionado(servicio);
    setModalOpen(true);
  };

  // 🟢 Nueva función para enviar mensaje WhatsApp de forma segura
  const enviarWhatsApp = async (clienteId, mensaje) => {
    try {
      const cliente = clientes.find(c => c.id === clienteId);
      if (!cliente || !cliente.telefono) {
        console.warn("Cliente sin número de teléfono");
        return;
      }

      const phoneNumber = cliente.telefono; // formato internacional (ej: 549381XXXXXXX)

      const res = await fetch("/api/send-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, message: mensaje }),
      });

      const data = await res.json();
      if (data.success) {
        console.log("✅ WhatsApp enviado correctamente");
      } else {
        console.error("❌ Error al enviar WhatsApp:", data.error);
      }
    } catch (err) {
      console.error("Error conectando con API:", err);
    }
  };

  const handleGuardarEdicion = async (idServicio, datosEditados) => {
  try {
    const res = await fetch(`${API_URL}/servicios/${idServicio}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datosEditados),
    });
    if (!res.ok) throw new Error("Error al guardar la edición");

    Swal.fire("Actualizado", `Servicio ${idServicio} editado.`, "success");
    cargarDatos();
    setModalOpen(false);

    // <-- PASO 4 IMPLEMENTADO AQUÍ
    if (datosEditados.estado === "terminado") {
      const servicio = servicios.find(s => s.id === idServicio);
      const cliente = clientes.find(c => c.id === servicio.clienteId);

      const mensaje = `Hola ${cliente?.nombreCompleto || "cliente"} 👋, tu equipo ya está listo para retirar en nuestro local. ¡Gracias por confiar en nosotros! 😊`;

      await enviarWhatsApp(servicio.clienteId, mensaje);
    }

  } catch (error) {
    console.error("Error al guardar edición:", error);
    Swal.fire("Error", "No se pudo guardar la edición.", "error");
  }
};


  if (isLoading) return <div className="panel-loading">Cargando Panel de Trabajo...</div>;

  return (
    <div className="panel-trabajo-container">
      {/* 🔽 Filtros de estado */}
      <div className="filtros-container">
        <button className={`filtro-btn ${filtroEstado === "todos" ? "activo" : ""}`} onClick={() => setFiltroEstado("todos")}>📋 Todos ({conteosEstado.todos})</button>
        <button className={`filtro-btn ${filtroEstado === "pendiente" ? "activo" : ""}`} onClick={() => setFiltroEstado("pendiente")}>⏱️ Pendientes ({conteosEstado.pendiente})</button>
        <button className={`filtro-btn ${filtroEstado === "enRevision" ? "activo" : ""}`} onClick={() => setFiltroEstado("enRevision")}>🧰 En Revisión ({conteosEstado.enRevision})</button>
        <button className={`filtro-btn ${filtroEstado === "enReparacion" ? "activo" : ""}`} onClick={() => setFiltroEstado("enReparacion")}>🔨 En Reparación ({conteosEstado.enReparacion})</button>
        <button className={`filtro-btn ${filtroEstado === "listoParaEntrega" ? "activo" : ""}`} onClick={() => setFiltroEstado("listoParaEntrega")}>🎁 Listo para Entrega ({conteosEstado.listoParaEntrega})</button>
      </div>

      {/* 🔎 Buscador */}
      <div className="panel-buscador">
        <input
          type="text"
          placeholder="Buscar por cliente o ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* 🔽 Lista */}
      <div className="servicios-lista">
        {serviciosFiltrados.length === 0 ? (
          <p className="mensaje-vacio">🎉 ¡No hay trabajos con el filtro/búsqueda actual! 🎉</p>
        ) : (
          serviciosFiltrados.map((servicio) => {
            const clienteNombre = getClienteName(servicio.clienteId, clientes);
            const estadoLabel = getEstadoLabel(servicio.estado);
            const esPrioridad =
              servicio.estado === "terminado" ||
              servicio.estado === "revisionTerminada";

            return (
              <div key={servicio.id} className={`tarjeta-servicio ${esPrioridad ? "prioridad-entrega" : ""}`}>
                <div className="info-resumen">
                  <p>
                    <strong>ID:</strong> {servicio.id},{" "}
                    <strong>Cliente:</strong> {clienteNombre},{" "}
                    <strong>Estado:</strong>{" "}
                    <span className={`estado-badge estado-${servicio.estado}`}>
                      {estadoLabel}
                    </span>
                  </p>
                </div>

                <div className="acciones">
                  <button className="btn-detalles" onClick={() => handleVerDetalles(servicio)} title="Ver y Editar Detalles">☰</button>
                  <button className="btn-entregar" onClick={() => handleEntregarServicio(servicio.id)} title="Marcar como Entregado">✅</button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <ModalDetalles
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        servicio={servicioSeleccionado}
        clientes={clientes}
        onSave={handleGuardarEdicion}
      />
    </div>
  );
};

export default PanelTrabajo;
