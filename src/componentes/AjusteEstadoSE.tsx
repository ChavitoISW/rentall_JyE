import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import Menu from './Menu';
import Footer from './Footer';
import Spinner from './Spinner';
import styles from '../styles/AjusteInventario.module.css';
import {
  EstadoSolicitudEquipo,
  EstadoSolicitudEquipoLabels,
} from '../types/solicitudEquipo';

interface SEResumen {
  id_solicitud_equipo: number;
  numero_solicitud_equipo: string;
  nombre_cliente: string;
  fecha_inicio: string;
  fecha_vencimiento: string;
  estado_solicitud_equipo: number;
  numero_contrato?: string;
}

const ESTADO_COLORES: Record<number, string> = {
  1: '#607D8B',
  2: '#2196F3',
  3: '#FF9800',
  4: '#4CAF50',
  5: '#FF5722',
  6: '#9E9E9E',
  7: '#F44336',
  8: '#B71C1C',
  9: '#9C27B0',
};

const AjusteEstadoSE: React.FC = () => {
  const router = useRouter();
  const { usuario } = useAuth();

  const [solicitudes, setSolicitudes] = useState<SEResumen[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [nuevoEstado, setNuevoEstado] = useState<number>(-1);
  const [motivo, setMotivo] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (usuario && usuario.usuario_rol !== 1) {
      router.push('/');
      return;
    }
    fetchSolicitudes();
  }, [usuario, router]);

  const fetchSolicitudes = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/ajuste-estado-se');
      if (res.ok) {
        const result = await res.json();
        setSolicitudes(Array.isArray(result.data) ? result.data : []);
      }
    } catch (e) {
      setErrorMessage('Error al cargar solicitudes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (se: SEResumen) => {
    setEditingId(se.id_solicitud_equipo);
    setNuevoEstado(se.estado_solicitud_equipo);
    setMotivo('');
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleCancel = () => {
    setEditingId(null);
    setNuevoEstado(-1);
    setMotivo('');
    setErrorMessage('');
  };

  const handleSave = async (se: SEResumen) => {
    if (nuevoEstado === -1) {
      setErrorMessage('Debe seleccionar un estado');
      return;
    }
    if (!motivo.trim()) {
      setErrorMessage('Debe ingresar un motivo para el ajuste');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await fetch('/api/ajuste-estado-se', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_solicitud_equipo: se.id_solicitud_equipo,
          estado_solicitud_equipo: nuevoEstado,
          motivo: motivo.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMessage(`SE ${se.numero_solicitud_equipo} actualizada a "${EstadoSolicitudEquipoLabels[nuevoEstado as EstadoSolicitudEquipo]}"`);
        setEditingId(null);
        setNuevoEstado(-1);
        setMotivo('');
        await fetchSolicitudes();
        setTimeout(() => setSuccessMessage(''), 4000);
      } else {
        setErrorMessage(data.error || 'Error al actualizar estado');
      }
    } catch (e) {
      setErrorMessage('Error al guardar cambio');
    } finally {
      setIsLoading(false);
    }
  };

  if (!usuario || usuario.usuario_rol !== 1) return null;

  const filtered = solicitudes.filter(se =>
    se.numero_solicitud_equipo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    se.nombre_cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (se.numero_contrato || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const estadoOptions = Object.entries(EstadoSolicitudEquipoLabels).map(([val, label]) => ({
    value: Number(val),
    label,
  }));

  return (
    <div className={styles.container}>
      <Menu />
      <main className={styles.main}>
        <div className={styles.header}>
          <h1>Ajuste Manual de Estado de SE</h1>
          <button className={styles.btnRefresh} onClick={fetchSolicitudes} disabled={isLoading}>
            🔄 Actualizar
          </button>
        </div>

        {successMessage && (
          <div style={{
            background: '#e8f5e9', color: '#2e7d32', border: '1px solid #a5d6a7',
            borderRadius: '8px', padding: '1rem', marginBottom: '1rem', fontWeight: 600,
          }}>
            ✅ {successMessage}
          </div>
        )}
        {errorMessage && (
          <div style={{
            background: '#ffebee', color: '#c62828', border: '1px solid #ef9a9a',
            borderRadius: '8px', padding: '1rem', marginBottom: '1rem', fontWeight: 600,
          }}>
            ⚠️ {errorMessage}
          </div>
        )}

        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Buscar por SE, contrato o cliente..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          <span style={{ color: 'white', fontSize: '0.9rem' }}>
            {filtered.length} registro(s)
          </span>
        </div>

        {isLoading ? (
          <Spinner />
        ) : (
          <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #e0e0e0' }}>
                  <th style={thStyle}># SE</th>
                  <th style={thStyle}>Contrato</th>
                  <th style={thStyle}>Cliente</th>
                  <th style={thStyle}>Fecha Inicio</th>
                  <th style={thStyle}>Fecha Vencimiento</th>
                  <th style={thStyle}>Estado Actual</th>
                  <th style={thStyle}>Nuevo Estado</th>
                  <th style={thStyle}>Motivo</th>
                  <th style={thStyle}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                      No se encontraron registros
                    </td>
                  </tr>
                ) : filtered.map(se => {
                  const isEditing = editingId === se.id_solicitud_equipo;
                  const colorActual = ESTADO_COLORES[se.estado_solicitud_equipo] || '#607D8B';
                  return (
                    <tr key={se.id_solicitud_equipo} style={{
                      borderBottom: '1px solid #f0f0f0',
                      background: isEditing ? '#fffde7' : 'white',
                    }}>
                      <td style={tdStyle}><strong>{se.numero_solicitud_equipo}</strong></td>
                      <td style={tdStyle}>{se.numero_contrato || '—'}</td>
                      <td style={tdStyle}>{se.nombre_cliente}</td>
                      <td style={tdStyle}>{formatFecha(se.fecha_inicio)}</td>
                      <td style={tdStyle}>{formatFecha(se.fecha_vencimiento)}</td>
                      <td style={tdStyle}>
                        <span style={{
                          padding: '3px 10px', borderRadius: '12px', fontSize: '0.8rem',
                          fontWeight: 600, background: colorActual + '22', color: colorActual,
                          border: `1px solid ${colorActual}`,
                        }}>
                          {EstadoSolicitudEquipoLabels[se.estado_solicitud_equipo as EstadoSolicitudEquipo] || `Estado ${se.estado_solicitud_equipo}`}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        {isEditing ? (
                          <select
                            value={nuevoEstado}
                            onChange={e => setNuevoEstado(Number(e.target.value))}
                            style={{
                              padding: '6px 10px', borderRadius: '6px', border: '1px solid #ccc',
                              fontSize: '0.85rem', width: '100%', minWidth: '160px',
                            }}
                          >
                            {estadoOptions.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        ) : (
                          <span style={{ color: '#bbb', fontSize: '0.85rem' }}>—</span>
                        )}
                      </td>
                      <td style={tdStyle}>
                        {isEditing ? (
                          <input
                            type="text"
                            placeholder="Motivo del ajuste..."
                            value={motivo}
                            onChange={e => setMotivo(e.target.value)}
                            style={{
                              padding: '6px 10px', borderRadius: '6px', border: '1px solid #ccc',
                              fontSize: '0.85rem', width: '100%', minWidth: '180px',
                            }}
                          />
                        ) : (
                          <span style={{ color: '#bbb', fontSize: '0.85rem' }}>—</span>
                        )}
                      </td>
                      <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                        {isEditing ? (
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              onClick={() => handleSave(se)}
                              style={btnGuardar}
                            >
                              ✔ Guardar
                            </button>
                            <button
                              onClick={handleCancel}
                              style={btnCancelar}
                            >
                              ✕ Cancelar
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEdit(se)}
                            style={btnEditar}
                          >
                            ✏️ Editar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

const formatFecha = (f?: string) => {
  if (!f) return '—';
  const part = f.includes('T') ? f.split('T')[0] : f;
  const [y, m, d] = part.split('-');
  return `${d}/${m}/${y}`;
};

const thStyle: React.CSSProperties = {
  padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.85rem',
  fontWeight: 700, color: '#444', whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  padding: '0.75rem 1rem', fontSize: '0.875rem', verticalAlign: 'middle',
};

const btnEditar: React.CSSProperties = {
  padding: '6px 14px', background: '#1976D2', color: 'white',
  border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem',
};

const btnGuardar: React.CSSProperties = {
  padding: '6px 14px', background: '#388E3C', color: 'white',
  border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem',
};

const btnCancelar: React.CSSProperties = {
  padding: '6px 14px', background: '#757575', color: 'white',
  border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem',
};

export default AjusteEstadoSE;
