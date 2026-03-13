import React, { useState, useEffect, useRef } from 'react';
import { costaRicaLocations, Provincia, Canton, Distrito } from '../data/costaRicaLocations';

export interface DireccionSeleccionada {
  provincia: string;
  canton: string;
  distrito: string;
  otrasSenas?: string;
}

interface SelectorDireccionProps {
  value?: DireccionSeleccionada;
  onChange: (direccion: DireccionSeleccionada) => void;
  required?: boolean;
  className?: string;
  incluirOtrasSenas?: boolean;
  disabled?: boolean;
}

const SelectorDireccion: React.FC<SelectorDireccionProps> = ({
  value,
  onChange,
  required = false,
  className = '',
  incluirOtrasSenas = true,
  disabled = false
}) => {
  const [provinciaSeleccionada, setProvinciaSeleccionada] = useState<string>('');
  const [cantonSeleccionado, setCantonSeleccionado] = useState<string>('');
  const [distritoSeleccionado, setDistritoSeleccionado] = useState<string>('');
  const [otrasSenas, setOtrasSenas] = useState<string>('');

  const [cantonesDisponibles, setCantonesDisponibles] = useState<Canton[]>([]);
  const [distritosDisponibles, setDistritosDisponibles] = useState<Distrito[]>([]);
  
  const isInitialized = useRef(false);

  // Cargar valores iniciales una sola vez cuando el componente se monta con un value
  useEffect(() => {
    if (!isInitialized.current && value) {
      isInitialized.current = true;
      
      setProvinciaSeleccionada(value.provincia || '');
      setCantonSeleccionado(value.canton || '');
      setDistritoSeleccionado(value.distrito || '');
      setOtrasSenas(value.otrasSenas || '');

      // Cargar cantones si hay provincia
      if (value.provincia) {
        const provincia = costaRicaLocations.find(p => p.nombre === value.provincia);
        if (provincia) {
          setCantonesDisponibles(provincia.cantones);

          // Cargar distritos si hay cantón
          if (value.canton) {
            const canton = provincia.cantones.find(c => c.nombre === value.canton);
            if (canton) {
              setDistritosDisponibles(canton.distritos);
            }
          }
        }
      }
    }
  }, [value]);

  // Actualizar cantones cuando cambia la provincia manualmente
  useEffect(() => {
    if (provinciaSeleccionada) {
      const provincia = costaRicaLocations.find(p => p.nombre === provinciaSeleccionada);
      if (provincia) {
        setCantonesDisponibles(provincia.cantones);
        setDistritosDisponibles([]);
      } else {
        setCantonesDisponibles([]);
        setDistritosDisponibles([]);
      }
    } else {
      setCantonesDisponibles([]);
      setDistritosDisponibles([]);
    }
  }, [provinciaSeleccionada]);

  // Actualizar distritos cuando cambia el cantón manualmente
  useEffect(() => {
    if (cantonSeleccionado && cantonesDisponibles.length > 0) {
      const canton = cantonesDisponibles.find(c => c.nombre === cantonSeleccionado);
      if (canton) {
        setDistritosDisponibles(canton.distritos);
      } else {
        setDistritosDisponibles([]);
      }
    } else {
      setDistritosDisponibles([]);
    }
  }, [cantonSeleccionado, cantonesDisponibles]);

  const handleProvinciaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProvincia = e.target.value;
    setProvinciaSeleccionada(newProvincia);
    setCantonSeleccionado('');
    setDistritoSeleccionado('');
    
    // Notificar inmediatamente
    onChange({
      provincia: newProvincia,
      canton: '',
      distrito: '',
      otrasSenas: otrasSenas
    });
  };

  const handleCantonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCanton = e.target.value;
    setCantonSeleccionado(newCanton);
    setDistritoSeleccionado('');
    
    // Notificar inmediatamente
    onChange({
      provincia: provinciaSeleccionada,
      canton: newCanton,
      distrito: '',
      otrasSenas: otrasSenas
    });
  };

  const handleDistritoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDistrito = e.target.value;
    setDistritoSeleccionado(newDistrito);
    
    // Notificar inmediatamente
    onChange({
      provincia: provinciaSeleccionada,
      canton: cantonSeleccionado,
      distrito: newDistrito,
      otrasSenas: otrasSenas
    });
  };

  const handleOtrasSenasChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newOtrasSenas = e.target.value;
    setOtrasSenas(newOtrasSenas);
    
    // Notificar inmediatamente
    onChange({
      provincia: provinciaSeleccionada,
      canton: cantonSeleccionado,
      distrito: distritoSeleccionado,
      otrasSenas: newOtrasSenas
    });
  };

  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#333' }}>
          Provincia {required && '*'}
        </label>
        <select
          value={provinciaSeleccionada}
          onChange={handleProvinciaChange}
          disabled={disabled}
          required={required}
          style={{
            width: '100%',
            padding: '0.8rem',
            border: '1px solid #ddd',
            borderRadius: '6px',
            fontSize: '1rem',
            outline: 'none',
            backgroundColor: disabled ? '#f5f5f5' : 'white',
            cursor: disabled ? 'not-allowed' : 'pointer'
          }}
        >
          <option value="">Seleccione una provincia</option>
          {costaRicaLocations.map((provincia) => (
            <option key={provincia.id} value={provincia.nombre}>
              {provincia.nombre}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#333' }}>
          Cantón {required && '*'}
        </label>
        <select
          value={cantonSeleccionado}
          onChange={handleCantonChange}
          disabled={disabled || !provinciaSeleccionada}
          required={required}
          style={{
            width: '100%',
            padding: '0.8rem',
            border: '1px solid #ddd',
            borderRadius: '6px',
            fontSize: '1rem',
            outline: 'none',
            backgroundColor: (disabled || !provinciaSeleccionada) ? '#f5f5f5' : 'white',
            cursor: (disabled || !provinciaSeleccionada) ? 'not-allowed' : 'pointer'
          }}
        >
          <option value="">Seleccione un cantón</option>
          {cantonesDisponibles.map((canton) => (
            <option key={canton.id} value={canton.nombre}>
              {canton.nombre}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#333' }}>
          Distrito {required && '*'}
        </label>
        <select
          value={distritoSeleccionado}
          onChange={handleDistritoChange}
          disabled={disabled || !cantonSeleccionado}
          required={required}
          style={{
            width: '100%',
            padding: '0.8rem',
            border: '1px solid #ddd',
            borderRadius: '6px',
            fontSize: '1rem',
            outline: 'none',
            backgroundColor: (disabled || !cantonSeleccionado) ? '#f5f5f5' : 'white',
            cursor: (disabled || !cantonSeleccionado) ? 'not-allowed' : 'pointer'
          }}
        >
          <option value="">Seleccione un distrito</option>
          {distritosDisponibles.map((distrito) => (
            <option key={distrito.id} value={distrito.nombre}>
              {distrito.nombre}
            </option>
          ))}
        </select>
      </div>

      {incluirOtrasSenas && (
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#333' }}>
            Otras Señas {required && '*'}
          </label>
          <textarea
            value={otrasSenas}
            onChange={handleOtrasSenasChange}
            disabled={disabled}
            required={required}
            placeholder="Ej: 200 metros norte de la iglesia, casa color blanco"
            rows={3}
            style={{
              width: '100%',
              padding: '0.8rem',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '1rem',
              fontFamily: 'inherit',
              outline: 'none',
              resize: 'vertical',
              backgroundColor: disabled ? '#f5f5f5' : 'white',
              cursor: disabled ? 'not-allowed' : 'auto'
            }}
          />
        </div>
      )}
    </div>
  );
};

export default SelectorDireccion;
