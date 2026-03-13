// Ejemplo de uso del SelectorDireccion en el componente Clientes

import React, { useState } from 'react';
import SelectorDireccion, { DireccionSeleccionada } from './SelectorDireccion';

const EjemploUso: React.FC = () => {
  const [direccion, setDireccion] = useState<DireccionSeleccionada>({
    provincia: '',
    canton: '',
    distrito: '',
    otrasSenas: ''
  });

  const handleDireccionChange = (nuevaDireccion: DireccionSeleccionada) => {
    setDireccion(nuevaDireccion);
    console.log('Dirección actualizada:', nuevaDireccion);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Aquí puedes enviar la dirección al backend
    const direccionCompleta = `${direccion.provincia}, ${direccion.canton}, ${direccion.distrito}. ${direccion.otrasSenas}`;
    console.log('Dirección completa:', direccionCompleta);
    
    // O enviar cada campo por separado
    const dataParaEnviar = {
      // otros campos del cliente...
      provincia: direccion.provincia,
      canton: direccion.canton,
      distrito: direccion.distrito,
      otras_senas: direccion.otrasSenas,
      // dirección completa concatenada
      direccion_completa: direccionCompleta
    };
    
    console.log('Datos para enviar:', dataParaEnviar);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Otros campos del formulario */}
      
      <SelectorDireccion
        value={direccion}
        onChange={handleDireccionChange}
        required={true}
        incluirOtrasSenas={true}
      />
      
      <button type="submit">Guardar</button>
    </form>
  );
};

export default EjemploUso;

/* 
 * INSTRUCCIONES DE USO:
 * 
 * 1. Importar el componente:
 *    import SelectorDireccion, { DireccionSeleccionada } from './SelectorDireccion';
 * 
 * 2. Crear estado para la dirección:
 *    const [direccion, setDireccion] = useState<DireccionSeleccionada>({
 *      provincia: '',
 *      canton: '',
 *      distrito: '',
 *      otrasSenas: ''
 *    });
 * 
 * 3. Usar el componente:
 *    <SelectorDireccion
 *      value={direccion}
 *      onChange={(dir) => setDireccion(dir)}
 *      required={true}
 *      incluirOtrasSenas={true}
 *    />
 * 
 * 4. Props disponibles:
 *    - value: DireccionSeleccionada (opcional) - valor inicial
 *    - onChange: (direccion: DireccionSeleccionada) => void - callback cuando cambia
 *    - required: boolean (opcional, default: false) - campos requeridos
 *    - className: string (opcional) - clase CSS personalizada
 *    - incluirOtrasSenas: boolean (opcional, default: true) - mostrar campo otras señas
 * 
 * 5. Para obtener dirección completa como string:
 *    const direccionCompleta = `${direccion.provincia}, ${direccion.canton}, ${direccion.distrito}. ${direccion.otrasSenas}`;
 * 
 * 6. Para actualizar la base de datos, considera agregar estos campos a tu modelo:
 *    - provincia: TEXT
 *    - canton: TEXT
 *    - distrito: TEXT
 *    - otras_senas: TEXT
 *    - direccion_completa: TEXT (opcional, para búsquedas)
 */
