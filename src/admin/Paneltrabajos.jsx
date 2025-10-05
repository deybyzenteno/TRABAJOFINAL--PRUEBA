import React, { useState, useEffect, useCallback } from "react";
import Swal from "sweetalert2";
import ModalDetalles from "./ModalDetalles"; 
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
  const [filtroEstado, setFiltroEstado] = useState("todos"); // 👈 nuevo filtro

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

  const serviciosFiltrados = serviciosOrdenados.filter((s) => {
    const query = searchQuery.toLowerCase();
    const clienteNombre = getClienteName(s.clienteId, clientes).toLowerCase();
    const coincideBusqueda =
      s.id.toString().includes(query) || clienteNombre.includes(query);

    const coincideFiltro =
      filtroEstado === "todos"
        ? true
        : filtroEstado === "enRevision"
        ? s.estado === "enRevision"
        : filtroEstado === "terminado"
        ? s.estado === "terminado" || s.estado === "revisionTerminada"
        : true;

    return coincideBusqueda && coincideFiltro;
  });

  const handleVerDetalles = (servicio) => {
    setServicioSeleccionado(servicio);
    setModalOpen(true);
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
    } catch (error) {
      console.error("Error al guardar edición:", error);
      Swal.fire("Error", "No se pudo guardar la edición.", "error");
    }
  };

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
      fechaSalida,
      estado: "entregado",
    };

    try {
      const res = await fetch(`${API_URL}/servicios/${idServicio}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datosActualizados),
      });

      if (!res.ok) throw new Error("Error en la petición al servidor.");

      Swal.fire("¡Entregado!", `El servicio ${idServicio} fue entregado.`, "success");
      cargarDatos();
    } catch (error) {
      console.error("Error al completar la entrega:", error);
      Swal.fire("Error", "No se pudo completar la entrega.", "error");
    }
  };

  if (isLoading) return <div className="panel-loading">Cargando Panel de Trabajo...</div>;

  return (
    <div className="panel-trabajo-container">
      {/* <h1>Panel de Trabajo 💼</h1>
      <p className="panel-subtitulo">
        Servicios Activos (Pendientes de entrega)
      </p> */}

      {/* 🔽 Filtros de estado */}
      <div className="filtros-container">
        <button
          className={`filtro-btn ${filtroEstado === "todos" ? "activo" : ""}`}
          onClick={() => setFiltroEstado("todos")}
        >
          📋 Todos
        </button>
        <button
          className={`filtro-btn ${filtroEstado === "enRevision" ? "activo" : ""}`}
          onClick={() => setFiltroEstado("enRevision")}
        >
          🧰 En Revisión
        </button>
        <button
          className={`filtro-btn ${filtroEstado === "terminado" ? "activo" : ""}`}
          onClick={() => setFiltroEstado("terminado")}
        >
          ✅ Terminados
        </button>
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
          <p className="mensaje-vacio">🎉 ¡No hay trabajos pendientes! 🎉</p>
        ) : (
          serviciosFiltrados.map((servicio) => {
            const clienteNombre = getClienteName(servicio.clienteId, clientes);
            const estadoLabel = getEstadoLabel(servicio.estado);
            const esPrioridad =
              servicio.estado === "terminado" ||
              servicio.estado === "revisionTerminada";

            return (
              <div
                key={servicio.id}
                className={`tarjeta-servicio ${esPrioridad ? "prioridad-entrega" : ""}`}
              >
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
                  <button
                    className="btn-detalles"
                    onClick={() => handleVerDetalles(servicio)}
                    title="Ver y Editar Detalles"
                  >
                    ☰
                  </button>
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
