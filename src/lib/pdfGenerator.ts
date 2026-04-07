import PDFDocument from 'pdfkit';
import { Writable } from 'stream';
import path from 'path';
import fs from 'fs';

interface ContratoData {
  id_contrato: number;
  numero_solicitud_equipo: string;
  nombre_cliente: string;
  direccion_cliente?: string;
  direccion_entrega?: string;
  provincia_direccion_entrega?: string;
  empresa_cliente?: string;
  cedula_cliente?: string;
  telefono_cliente?: string;
  nombre_recibe?: string;
  cedula_recibe?: string;
  telefono_recibe?: string;
  fecha_creacion: string;
  fecha_inicio_solicitud?: string;
  fecha_fin_solicitud?: string;
  observaciones?: string;
  subtotal?: number;
  descuento?: number;
  monto_envio?: number;
  iva?: number;
  total?: number;
  valor_estimado_equipo?: number;
  detalles: Array<{
    codigo_equipo?: string;
    nombre_equipo: string;
    cantidad: number;
    precio_unitario?: number;
    subtotal_detalle?: number;
    monto_descuento?: number;
    iva_detalle?: number;
    monto_final?: number;
  }>;
}

export function generarPDFContrato(contratoData: ContratoData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 25, size: 'LETTER' });
    const chunks: Buffer[] = [];

    // Capturar el buffer del PDF
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const margin = 25;
    const usableWidth = pageWidth - (margin * 2);

    // Dibujar borde del documento
    doc.rect(margin, margin, usableWidth, pageHeight - (margin * 2)).stroke();

    // Encabezado principal
    doc
      .fontSize(18)
      .font('Helvetica-Bold')
      .fillColor('#1E40AF')
      .text('MEZCLADORAS J & E', margin + 20, margin + 15, { align: 'left' })
      .fontSize(12)
      .font('Helvetica')
      .fillColor('#081233')
      .text('Propietario Johnny Víquez Loría', margin + 20, margin + 35)
      .fontSize(9)
      .font('Helvetica')
      .fillColor('black')
      .text('Teléfonos: 8851-1774 / 8394-4599', margin + 20, margin + 50)
      .text('Alajuela, Costa Rica', margin + 20, margin + 65)
      .text('Reparación, Venta y alquiler de mezcladoras de concreto y equipos', margin + 20, margin + 80);

    // Logo entre el encabezado y el cuadro de contrato
    const logoPath = path.join(process.cwd(), 'public', 'assets', 'logo.png');
    if (fs.existsSync(logoPath)) {
      const logoWidth = 100;
      const logoHeight = 60;
      const logoX = margin + 235;
      const logoY = margin + 15;
      doc.image(logoPath, logoX, logoY, { width: logoWidth, height: logoHeight });
    }

    // Recuadro "Contrato de Alquiler" en la esquina superior derecha
    const contratoBoxX = pageWidth - margin - 140;
    const contratoBoxY = margin + 10;
    doc.rect(contratoBoxX, contratoBoxY, 130, 75).stroke();
    
    // Formatear fecha de elaboración
    const fechaElaboracion = new Date(contratoData.fecha_creacion);
    const dia = fechaElaboracion.getDate();
    const mes = fechaElaboracion.getMonth() + 1;
    const año = fechaElaboracion.getFullYear();
    
    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .text('Contrato de Alquiler', contratoBoxX + 5, contratoBoxY + 5, { width: 120, align: 'center' })
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#CC0000')
      .text(`Nº ${contratoData.id_contrato}`, contratoBoxX + 5, contratoBoxY + 18, { width: 120, align: 'center' })
      .fillColor('black');
    
    // Cuadritos para día, mes y año
    const cuadritoY = contratoBoxY + 38;
    const cuadritoWidth = 36;
    const cuadritoHeight = 26;
    const espacioCuadritos = 3;
    const anchoTotalCuadritos = (cuadritoWidth * 3) + (espacioCuadritos * 2);
    const startX = contratoBoxX + (130 - anchoTotalCuadritos) / 2;
    
    // Cuadrito Día
    doc.rect(startX, cuadritoY, cuadritoWidth, cuadritoHeight).stroke();
    doc
      .fontSize(7)
      .font('Helvetica')
      .fillColor('#1E40AF')
      .text('Día', startX, cuadritoY + 5, { width: cuadritoWidth, align: 'center' })
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor('black')
      .text(dia.toString(), startX, cuadritoY + 14, { width: cuadritoWidth, align: 'center' });
    
    // Cuadrito Mes
    doc.rect(startX + cuadritoWidth + espacioCuadritos, cuadritoY, cuadritoWidth, cuadritoHeight).stroke();
    doc
      .fontSize(7)
      .font('Helvetica')
      .fillColor('#1E40AF')
      .text('Mes', startX + cuadritoWidth + espacioCuadritos, cuadritoY + 5, { width: cuadritoWidth, align: 'center' })
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor('black')
      .text(mes.toString(), startX + cuadritoWidth + espacioCuadritos, cuadritoY + 14, { width: cuadritoWidth, align: 'center' });
    
    // Cuadrito Año
    doc.rect(startX + (cuadritoWidth * 2) + (espacioCuadritos * 2), cuadritoY, cuadritoWidth, cuadritoHeight).stroke();
    doc
      .fontSize(7)
      .font('Helvetica')
      .fillColor('#1E40AF')
      .text('Año', startX + (cuadritoWidth * 2) + (espacioCuadritos * 2), cuadritoY + 5, { width: cuadritoWidth, align: 'center' })
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor('black')
      .text(año.toString(), startX + (cuadritoWidth * 2) + (espacioCuadritos * 2), cuadritoY + 14, { width: cuadritoWidth, align: 'center' });

    // Línea separadora
    doc.moveTo(margin + 15, margin + 95).lineTo(pageWidth - margin - 15, margin + 95).stroke();

    // Sección de información del cliente
    let currentY = margin + 110;
    
    const nombreCompleto = contratoData.nombre_cliente || '_______________________________________________________________';
    const cedula = contratoData.cedula_cliente || '____________________';
    
    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor('#081233')
      .text('Cliente: ', margin + 20, currentY, { continued: true })
      .font('Helvetica')
      .fillColor('black')
      .text(nombreCompleto, { continued: false, width: 360 });
    
    doc
      .font('Helvetica-Bold')
      .fillColor('#081233')
      .text('Cédula: ', pageWidth - margin - 150, currentY, { continued: true })
      .font('Helvetica')
      .fillColor('black')
      .text(cedula);

    currentY += 15;
    const direccionCliente = contratoData.direccion_cliente || '';
    doc
      .font('Helvetica-Bold')
      .fillColor('#081233')
      .text('Dirección del cliente: ', margin + 20, currentY, { continued: true })
      .font('Helvetica')
      .fillColor('black')
      .text(direccionCliente, { width: usableWidth - 40 });

    const telefono = contratoData.telefono_cliente || '____________________';    
    doc
      .font('Helvetica-Bold')
      .fillColor('#081233')
      .text('Teléfono: ', pageWidth - margin - 150, currentY, { continued: true })
      .font('Helvetica')
      .fillColor('black')
      .text(telefono); 
    
    

    // Sección "Recibí"
    currentY += 25;
    const personaRecibe = contratoData.nombre_recibe || '_____________________________________________________________';
    const valorEstimado = contratoData.valor_estimado_equipo 
      ? `¢ ${contratoData.valor_estimado_equipo.toLocaleString('es-CR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
      : '_______________';
    
    doc
      .font('Helvetica-Bold')
      .fillColor('#081233')
      .text('Persona que recibe: ', margin + 20, currentY, { continued: true })
      .font('Helvetica')
      .fillColor('black')
      .text(personaRecibe, { width: 320 });
    
    doc
      .font('Helvetica-Bold')
      .fillColor('#081233')
      .text('Valor estimado del equipo: ', pageWidth - margin - 230, currentY, { continued: true })
      .font('Helvetica')
      .fillColor('black')
      .text(valorEstimado);

    currentY += 15;
    const cedulaRecibe = contratoData.cedula_recibe || '_____________________________';
    const telefonoRecibe = contratoData.telefono_recibe || '_______________';
    
    doc
      .font('Helvetica-Bold')
      .fillColor('#081233')
      .text('Cédula: ', margin + 20, currentY, { continued: true })
      .font('Helvetica')
      .fillColor('black')
      .text(cedulaRecibe, { width: 180 });
    
    doc
      .font('Helvetica-Bold')
      .fillColor('#081233')
      .text('Teléfono: ', pageWidth - margin - 150, currentY, { continued: true })
      .font('Helvetica')
      .fillColor('black')
      .text(telefonoRecibe);

      currentY += 15;
    const direccionEntrega = contratoData.direccion_entrega || 
      '_______________________________________________________________________________________\n_______________________________________________________________________________________';
    doc
      .font('Helvetica-Bold')
      .fillColor('#081233')
      .text('Dirección de entrega: ', margin + 20, currentY, { continued: true })
      .font('Helvetica')
      .fillColor('black')
      .text(direccionEntrega, { width: usableWidth - 40, lineGap: 2 });

    currentY += 28;
    const observaciones = contratoData.observaciones || '';
    doc
      .font('Helvetica-Bold')
      .fillColor('#081233')
      .text('Observaciones: ', margin + 20, currentY, { continued: true })
      .font('Helvetica')
      .fillColor('black')
      .text(observaciones, { width: usableWidth - 40 });

    // Tabla de equipos
    currentY += 25;
    const tableStartY = currentY;
    
    // Encabezados de la tabla
    const colDescripcion = margin + 20;
    const colDesde = colDescripcion + 240;
    const colHasta = colDesde + 60;
    const colCant = colHasta + 60;
    const colPU = colCant + 40;
    const colPT = colPU + 50;

    doc.rect(margin + 15, currentY, usableWidth - 30, 20).stroke();
    
    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .text('Descripción', colDescripcion, currentY + 5, { width: 230, align: 'center' })
      .text('Desde', colDesde, currentY + 5, { width: 50, align: 'center' })
      .text('Hasta', colHasta, currentY + 5, { width: 50, align: 'center' })
      .text('Cant', colCant, currentY + 5, { width: 35, align: 'center' })
      .text('P/U', colPU, currentY + 5, { width: 45, align: 'center' })
      .text('P/T', colPT, currentY + 5, { width: 45, align: 'center' });

    currentY += 20;

    // Filas de equipos (solo las que tienen datos)
    doc.font('Helvetica');
    const rowHeight = 20;
    const numFilas = contratoData.detalles.length;
    
    for (let i = 0; i < numFilas; i++) {
      doc.rect(margin + 15, currentY, usableWidth - 30, rowHeight).stroke();
      
      // Líneas verticales de columnas
      doc.moveTo(colDesde - 5, currentY).lineTo(colDesde - 5, currentY + rowHeight).stroke();
      doc.moveTo(colHasta - 5, currentY).lineTo(colHasta - 5, currentY + rowHeight).stroke();
      doc.moveTo(colCant - 5, currentY).lineTo(colCant - 5, currentY + rowHeight).stroke();
      doc.moveTo(colPU - 5, currentY).lineTo(colPU - 5, currentY + rowHeight).stroke();
      doc.moveTo(colPT - 5, currentY).lineTo(colPT - 5, currentY + rowHeight).stroke();

      const detalle = contratoData.detalles[i];
      const rowY = currentY + 6;
      
      doc
        .fontSize(8)
        .text(detalle.nombre_equipo, colDescripcion, rowY, { width: 230 })
        .text(contratoData.fecha_inicio_solicitud ? new Date(contratoData.fecha_inicio_solicitud).toLocaleDateString('es-CR') : '', colDesde, rowY, { width: 50, align: 'center' })
        .text(contratoData.fecha_fin_solicitud ? new Date(contratoData.fecha_fin_solicitud).toLocaleDateString('es-CR') : '', colHasta, rowY, { width: 50, align: 'center' })
        .text(detalle.cantidad.toString(), colCant, rowY, { width: 35, align: 'center' })
        .text(detalle.precio_unitario ? `¢ ${detalle.precio_unitario.toLocaleString('es-CR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : '', colPU, rowY, { width: 45, align: 'center' })
        .text(detalle.monto_final ? `¢ ${detalle.monto_final.toLocaleString('es-CR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : '', colPT, rowY, { width: 45, align: 'center' });

      currentY += rowHeight;
    }

    // Sección de totales (disposición horizontal centrada)
    currentY += 15;
    doc.fontSize(9);
    
    // Construir array con los campos a mostrar
    const camposTotales = [];
    
    if (contratoData.subtotal !== undefined) {
      camposTotales.push({
        label: 'Subtotal:',
        value: ` ¢${contratoData.subtotal.toLocaleString('es-CR', { minimumFractionDigits: 2 })}`,
        labelColor: '#081233',
        valueColor: 'black'
      });
    }
    
    if (contratoData.descuento !== undefined && contratoData.descuento > 0) {
      camposTotales.push({
        label: 'Descuento:',
        value: ` ¢${contratoData.descuento.toLocaleString('es-CR', { minimumFractionDigits: 2 })}`,
        labelColor: '#081233',
        valueColor: 'black'
      });
    }
    
    if (contratoData.monto_envio !== undefined && contratoData.monto_envio > 0) {
      camposTotales.push({
        label: 'Envío:',
        value: ` ¢${contratoData.monto_envio.toLocaleString('es-CR', { minimumFractionDigits: 2 })}`,
        labelColor: '#081233',
        valueColor: 'black'
      });
    }
    
    if (contratoData.iva !== undefined && contratoData.iva > 0) {
      camposTotales.push({
        label: 'IVA (13%):',
        value: ` ¢${contratoData.iva.toLocaleString('es-CR', { minimumFractionDigits: 2 })}`,
        labelColor: '#081233',
        valueColor: 'black'
      });
    }
    
    if (contratoData.total !== undefined) {
      camposTotales.push({
        label: 'TOTAL:',
        value: ` ¢${contratoData.total.toLocaleString('es-CR', { minimumFractionDigits: 2 })}`,
        labelColor: '#1E40AF',
        valueColor: '#CC0000'
      });
    }
    
    // Calcular el ancho total aproximado del contenido
    const espacioEntreCampos = 20;
    let anchoTotal = 0;
    camposTotales.forEach((campo, index) => {
      doc.font('Helvetica-Bold');
      const anchoLabel = doc.widthOfString(campo.label);
      doc.font('Helvetica');
      const anchoValue = doc.widthOfString(campo.value);
      anchoTotal += anchoLabel + anchoValue;
      if (index < camposTotales.length - 1) {
        anchoTotal += espacioEntreCampos;
      }
    });
    
    // Posición inicial centrada
    let currentX = margin + ((usableWidth - anchoTotal) / 2);
    
    // Renderizar cada campo
    camposTotales.forEach((campo, index) => {
      doc
        .font('Helvetica-Bold')
        .fillColor(campo.labelColor)
        .text(campo.label, currentX, currentY, { continued: true })
        .font('Helvetica')
        .fillColor(campo.valueColor)
        .text(campo.value, { continued: false });
      
      doc.font('Helvetica-Bold');
      const anchoLabel = doc.widthOfString(campo.label);
      doc.font('Helvetica');
      const anchoValue = doc.widthOfString(campo.value);
      currentX += anchoLabel + anchoValue + espacioEntreCampos;
    });
    
    currentY += 15;

    // TÉRMINOS Y CONDICIONES
    currentY += 10;
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('#1E40AF')
      .text('TÉRMINOS Y CONDICIONES:', margin + 20, currentY)
      .fillColor('black');

    currentY += 15;
    
    // Extraer provincia de dirección de entrega (antes de la primera coma)
    const provinciaDireccionEntrega = contratoData.direccion_entrega 
      ? contratoData.direccion_entrega.split(',')[0].trim() 
      : '_________________________';
    
    const terminos = `El presente contrato de alquiler de mezcladoras de concreto, se regirá por las siguientes cláusulas y condiciones:

DENOMINACIONES:
Propietario - Arrendador: Johnny Viques Loría, mayor, casado, empresario, cédula 2-469-410, vecino de Tuetal de Alajuela, 300 metros Este de la escuela.
Cliente - Arrendatario: Aquella persona que arrienda una mezcladora de concreto o algún equipo para construcción y que por consiguiente queda sujeto a las presentes cláusulas y demás dispocisiones de ley en relación a su condición de arrendatario. Nombre, apellidos, dirección exacta y cédula de identidad).

CONDICIONES:
1.- El arrendador se compromete a entregar todos los equipos en perfectas condiciones para ser usados según los requerimientos de trabajo, garantizado el perfecto funcionamiento de los mismos. Para efectos de lo anterior, el arrendatario deberá probar los mismos antes de que el responsable abandone el lugar donde se entregue la mezcladora alquilada. Una vez que se retire la responsable (previa prueba de arranque y funcionamiento), se exonera de toda responsabilidad al Arrendador.
2.- El Arrendatario será responsable a partir de que la mezcladora llegue al lugar desigando, por el buen uso que se le otorgue a dicho equipo y asumirá el costo de los daños y perjuicios que se le causaren, sea por mal uso, descuido, negligencia, pérdida o robo, incendio o desastres. En caso de presentarse alguno de estos hechos, se compromete el Arrendatario en forma incondicional a cancelar el costo de la maquinaria, cuyo precio deberá fijarse o estimarse en este mismo documento, a más tardar una semana después de vencido el plazo del alquiler, o bien, una semana después de la fecha en que se dejo de hacer alguno de los pagos por concepto de alquiler, en rázon de haber acontecido alguna de estas posibilidades. 
3.- El plazo del alquiler se fijará dentro de este contrato. En caso de que el Arrendatario al vencimiento del plazo no comunique (personalmente, telefónicamente) que el equipo está a dispocisión del arrendador para que sea retirado, deberá reconocer el pago de los dias que permanezca en su pocesión.
4.- El Arrendador no se hace responsable por daños a la propiedad ajena, ni accidentes en perjuicio de los arrendtarios, sus trabajadores o terceros  que ocurran debido a defectos de instalación de equipos o uso impropios de los mismos.
5.- El Arrendatario deberá permitir el acceso al equipo o maquinaria, de empleados del Arrendador, para hacer inspecciones o trabajos de mantenimiento rutinarios necesarios para el buen funcionamiento del mismo.
6.- Será responsabilidad del Arrendatario, reportar inmediatamente (en forma personal o telefónica) al Arrendador, cualquier defecto del equipo o maquinaria para su pronta solución.
7.- El Arrendador se reserva el derecho de propiedad absoluta de todos los equipos alquilados, no estando por lo tanto los mismos sujetos a control de ninhuna otra persona, y libres de todo proceso legal. Por lo tanto, los equipos arrendados deberán permanecer todo el tiempo que dure el contrato de arrendamiento, en el lugar de la obra la cual fueron destinados, quedando terminantemente prohibido el cambio de sitio o traspaso por ninguna razón sin consentimiento del Arrendador.
8.- Cuando la maquinaria sea a de combustible, el mismo debe ser suministrado por el Arrendatario.
9.- No se aceptará bajo ninguna circunstancia, que este contrato sea modificado total o parcialmente en forma verbal.
10.- Los pagos por concepto del alquiler del equipo o maquinaria, serán cubiertos por periodos adelantados. En caso de que los equipos no sean devueltos por el Arrendatario al vencimiento del alquiler, se considerará prorrogado por un plazo igual al facturado.
11.- El Arrendatario que se niegue a entregar la máquina al vencimiento del plazo y que no esté cancelando el precio del alquiler convenido, podrá ser acusado por el delito de RETENCIÓN INDEBIDA.

Es Todo. Conformes con las condiciones, firmamos en la ciudad de ${provinciaDireccionEntrega}, el día_____ mes_____ año____.


Firmay cédula de recibido conforme:_________________________________



Facturado por: ________________________     Nº Solicitud Equipo: ${contratoData.numero_solicitud_equipo || contratoData.id_contrato}`;



    doc
      .fontSize(7)
      .font('Helvetica')
      .text(terminos, margin + 20, currentY, { 
        width: usableWidth - 40, 
        align: 'justify',
        lineGap: 1
      });

    doc.end();
  });
}

// Interfaz para datos de Solicitud de Equipo
interface SolicitudEquipoData {
  id_solicitud_equipo: number;
  numero_solicitud_equipo: string;
  nombre_cliente: string;
  direccion_cliente?: string;
  direccion_entrega?: string;
  cedula_cliente?: string;
  telefono_cliente?: string;
  nombre_recibe?: string;
  cedula_recibe?: string;
  telefono_recibe?: string;
  fecha_elaboracion: string;
  fecha_inicio?: string;
  fecha_vencimiento?: string;
  observaciones?: string;
  subtotal?: number;
  descuento?: number;
  monto_envio?: number;
  iva?: number;
  total?: number;
  estado_solicitud: string;
  pago_envio?: boolean;
  usa_factura?: boolean;
  detalles: Array<{
    codigo_equipo?: string;
    nombre_equipo: string;
    cantidad: number;
    precio_unitario?: number;
    subtotal_detalle?: number;
    monto_descuento?: number;
    iva_detalle?: number;
    monto_final?: number;
  }>;
}

export function generarPDFSolicitudEquipo(solicitudData: SolicitudEquipoData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 25, size: 'LETTER' });
    const chunks: Buffer[] = [];

    // Capturar el buffer del PDF
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const margin = 25;
    const usableWidth = pageWidth - (margin * 2);

    // Dibujar borde del documento
    doc.rect(margin, margin, usableWidth, pageHeight - (margin * 2)).stroke();

    // Encabezado principal
    doc
      .fontSize(18)
      .font('Helvetica-Bold')
      .fillColor('#1E40AF')
      .text('MEZCLADORAS J & E', margin + 20, margin + 15, { align: 'left' })
      .fontSize(12)
      .font('Helvetica')
      .fillColor('#081233')
      .text('Propietario Johnny Víquez Loría', margin + 20, margin + 35)
      .fontSize(9)
      .font('Helvetica')
      .fillColor('black')
      .text('Teléfonos: 8851-1774 / 8394-4599', margin + 20, margin + 50)
      .text('Alajuela, Costa Rica', margin + 20, margin + 65)
      .text('Reparación, Venta y alquiler de mezcladoras de concreto y equipos', margin + 20, margin + 80);

    // Logo
    const logoPath = path.join(process.cwd(), 'public', 'assets', 'logo.png');
    if (fs.existsSync(logoPath)) {
      const logoWidth = 100;
      const logoHeight = 60;
      const logoX = margin + 235;
      const logoY = margin + 15;
      doc.image(logoPath, logoX, logoY, { width: logoWidth, height: logoHeight });
    }

    // Recuadro "Solicitud de Equipo" en la esquina superior derecha
    const solicitudBoxX = pageWidth - margin - 140;
    const solicitudBoxY = margin + 10;
    doc.rect(solicitudBoxX, solicitudBoxY, 130, 75).stroke();
    
    // Formatear fecha de elaboración
    const fechaElaboracion = new Date(solicitudData.fecha_elaboracion);
    const dia = fechaElaboracion.getDate();
    const mes = fechaElaboracion.getMonth() + 1;
    const año = fechaElaboracion.getFullYear();
    
    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .text('Solicitud de Equipo', solicitudBoxX + 5, solicitudBoxY + 5, { width: 120, align: 'center' })
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#CC0000')
      .text(`Nº ${solicitudData.numero_solicitud_equipo}`, solicitudBoxX + 5, solicitudBoxY + 18, { width: 120, align: 'center' })
      .fillColor('black');
    
    // Cuadritos para día, mes y año
    const cuadritoY = solicitudBoxY + 38;
    const cuadritoWidth = 36;
    const cuadritoHeight = 26;
    const espacioCuadritos = 3;
    const anchoTotalCuadritos = (cuadritoWidth * 3) + (espacioCuadritos * 2);
    const startX = solicitudBoxX + (130 - anchoTotalCuadritos) / 2;
    
    // Cuadrito Día
    doc.rect(startX, cuadritoY, cuadritoWidth, cuadritoHeight).stroke();
    doc
      .fontSize(7)
      .font('Helvetica')
      .fillColor('#1E40AF')
      .text('Día', startX, cuadritoY + 5, { width: cuadritoWidth, align: 'center' })
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor('black')
      .text(dia.toString(), startX, cuadritoY + 14, { width: cuadritoWidth, align: 'center' });
    
    // Cuadrito Mes
    doc.rect(startX + cuadritoWidth + espacioCuadritos, cuadritoY, cuadritoWidth, cuadritoHeight).stroke();
    doc
      .fontSize(7)
      .font('Helvetica')
      .fillColor('#1E40AF')
      .text('Mes', startX + cuadritoWidth + espacioCuadritos, cuadritoY + 5, { width: cuadritoWidth, align: 'center' })
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor('black')
      .text(mes.toString(), startX + cuadritoWidth + espacioCuadritos, cuadritoY + 14, { width: cuadritoWidth, align: 'center' });
    
    // Cuadrito Año
    doc.rect(startX + (cuadritoWidth * 2) + (espacioCuadritos * 2), cuadritoY, cuadritoWidth, cuadritoHeight).stroke();
    doc
      .fontSize(7)
      .font('Helvetica')
      .fillColor('#1E40AF')
      .text('Año', startX + (cuadritoWidth * 2) + (espacioCuadritos * 2), cuadritoY + 5, { width: cuadritoWidth, align: 'center' })
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor('black')
      .text(año.toString(), startX + (cuadritoWidth * 2) + (espacioCuadritos * 2), cuadritoY + 14, { width: cuadritoWidth, align: 'center' });

    // Línea separadora
    doc.moveTo(margin + 15, margin + 95).lineTo(pageWidth - margin - 15, margin + 95).stroke();

    // Sección de información del cliente
    let currentY = margin + 110;
    
    const nombreCompleto = solicitudData.nombre_cliente || '_______________________________________________________________';
    const cedula = solicitudData.cedula_cliente || '____________________';
    
    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor('#081233')
      .text('Cliente: ', margin + 20, currentY, { continued: true })
      .font('Helvetica')
      .fillColor('black')
      .text(nombreCompleto, { continued: false, width: 360 });
    
    doc
      .font('Helvetica-Bold')
      .fillColor('#081233')
      .text('Cédula: ', pageWidth - margin - 150, currentY, { continued: true })
      .font('Helvetica')
      .fillColor('black')
      .text(cedula);

    currentY += 15;
    const direccionCliente = solicitudData.direccion_cliente || '';
    doc
      .font('Helvetica-Bold')
      .fillColor('#081233')
      .text('Dirección del cliente: ', margin + 20, currentY, { continued: true })
      .font('Helvetica')
      .fillColor('black')
      .text(direccionCliente, { width: usableWidth - 40 });

    const telefono = solicitudData.telefono_cliente || '____________________';    
    doc
      .font('Helvetica-Bold')
      .fillColor('#081233')
      .text('Teléfono: ', pageWidth - margin - 150, currentY, { continued: true })
      .font('Helvetica')
      .fillColor('black')
      .text(telefono); 

    // Sección "Recibe"
    currentY += 25;
    const personaRecibe = solicitudData.nombre_recibe || '_____________________________________________________________';
    const estadoSolicitud = solicitudData.estado_solicitud || '______________';
    
    doc
      .font('Helvetica-Bold')
      .fillColor('#081233')
      .text('Persona que recibe: ', margin + 20, currentY, { continued: true })
      .font('Helvetica')
      .fillColor('black')
      .text(personaRecibe, { width: 320 });
    
    doc
      .font('Helvetica-Bold')
      .fillColor('#081233')
      .text('Estado: ', pageWidth - margin - 150, currentY, { continued: true })
      .font('Helvetica')
      .fillColor('black')
      .text(estadoSolicitud);

    currentY += 15;
    const cedulaRecibe = solicitudData.cedula_recibe || '_____________________________';
    const telefonoRecibe = solicitudData.telefono_recibe || '_______________';
    
    doc
      .font('Helvetica-Bold')
      .fillColor('#081233')
      .text('Cédula: ', margin + 20, currentY, { continued: true })
      .font('Helvetica')
      .fillColor('black')
      .text(cedulaRecibe, { width: 180 });
    
    doc
      .font('Helvetica-Bold')
      .fillColor('#081233')
      .text('Teléfono: ', pageWidth - margin - 150, currentY, { continued: true })
      .font('Helvetica')
      .fillColor('black')
      .text(telefonoRecibe);

    currentY += 15;
    const direccionEntrega = solicitudData.direccion_entrega || 
      '_______________________________________________________________________________________\n_______________________________________________________________________________________';
    doc
      .font('Helvetica-Bold')
      .fillColor('#081233')
      .text('Dirección de entrega: ', margin + 20, currentY, { continued: true })
      .font('Helvetica')
      .fillColor('black')
      .text(direccionEntrega, { width: usableWidth - 40, lineGap: 2 });

    currentY += 28;
    const observaciones = solicitudData.observaciones || '';
    doc
      .font('Helvetica-Bold')
      .fillColor('#081233')
      .text('Observaciones: ', margin + 20, currentY, { continued: true })
      .font('Helvetica')
      .fillColor('black')
      .text(observaciones, { width: usableWidth - 40 });

    // Tabla de equipos
    currentY += 25;
    
    // Encabezados de la tabla
    const colDescripcion = margin + 20;
    const colDesde = colDescripcion + 240;
    const colHasta = colDesde + 60;
    const colCant = colHasta + 60;
    const colPU = colCant + 40;
    const colPT = colPU + 50;

    doc.rect(margin + 15, currentY, usableWidth - 30, 20).stroke();
    
    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .text('Descripción', colDescripcion, currentY + 5, { width: 230, align: 'center' })
      .text('Desde', colDesde, currentY + 5, { width: 50, align: 'center' })
      .text('Hasta', colHasta, currentY + 5, { width: 50, align: 'center' })
      .text('Cant', colCant, currentY + 5, { width: 35, align: 'center' })
      .text('P/U', colPU, currentY + 5, { width: 45, align: 'center' })
      .text('P/T', colPT, currentY + 5, { width: 45, align: 'center' });

    currentY += 20;

    // Filas de equipos
    doc.font('Helvetica');
    const rowHeight = 20;
    const numFilas = solicitudData.detalles.length;
    
    for (let i = 0; i < numFilas; i++) {
      doc.rect(margin + 15, currentY, usableWidth - 30, rowHeight).stroke();
      
      // Líneas verticales de columnas
      doc.moveTo(colDesde - 5, currentY).lineTo(colDesde - 5, currentY + rowHeight).stroke();
      doc.moveTo(colHasta - 5, currentY).lineTo(colHasta - 5, currentY + rowHeight).stroke();
      doc.moveTo(colCant - 5, currentY).lineTo(colCant - 5, currentY + rowHeight).stroke();
      doc.moveTo(colPU - 5, currentY).lineTo(colPU - 5, currentY + rowHeight).stroke();
      doc.moveTo(colPT - 5, currentY).lineTo(colPT - 5, currentY + rowHeight).stroke();

      const detalle = solicitudData.detalles[i];
      const rowY = currentY + 6;
      
      doc
        .fontSize(8)
        .text(detalle.nombre_equipo, colDescripcion, rowY, { width: 230 })
        .text(solicitudData.fecha_inicio ? new Date(solicitudData.fecha_inicio).toLocaleDateString('es-CR') : '', colDesde, rowY, { width: 50, align: 'center' })
        .text(solicitudData.fecha_vencimiento ? new Date(solicitudData.fecha_vencimiento).toLocaleDateString('es-CR') : '', colHasta, rowY, { width: 50, align: 'center' })
        .text(detalle.cantidad.toString(), colCant, rowY, { width: 35, align: 'center' })
        .text(detalle.precio_unitario ? `¢ ${detalle.precio_unitario.toLocaleString('es-CR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : '', colPU, rowY, { width: 45, align: 'center' })
        .text(detalle.monto_final ? `¢ ${detalle.monto_final.toLocaleString('es-CR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : '', colPT, rowY, { width: 45, align: 'center' });

      currentY += rowHeight;
    }

    // Sección de totales
    currentY += 15;
    const totalesLabelX = pageWidth - margin - 220; // Posición de las etiquetas
    // Alinear valores con el borde derecho de la tabla (que termina en pageWidth - margin - 15)
    const tablaBordeDerechoX = pageWidth - margin - 15;
    const totalesValorWidth = 120; // Ancho del área para los valores
    const totalesValorX = tablaBordeDerechoX - totalesValorWidth;
    
    if (solicitudData.subtotal !== undefined) {
      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .fillColor('#081233')
        .text('Subtotal:', totalesLabelX, currentY);
      
      doc
        .font('Helvetica')
        .fillColor('black')
        .text(`¢ ${solicitudData.subtotal.toLocaleString('es-CR', { minimumFractionDigits: 2 })}`, totalesValorX, currentY, { width: totalesValorWidth, align: 'right' });
      currentY += 15;
    }
    
    if (solicitudData.descuento !== undefined && solicitudData.descuento > 0) {
      doc
        .font('Helvetica-Bold')
        .fillColor('#081233')
        .text('Descuento:', totalesLabelX, currentY);
      
      doc
        .font('Helvetica')
        .fillColor('black')
        .text(`¢ ${solicitudData.descuento.toLocaleString('es-CR', { minimumFractionDigits: 2 })}`, totalesValorX, currentY, { width: totalesValorWidth, align: 'right' });
      currentY += 15;
    }
    
    if (solicitudData.pago_envio && solicitudData.monto_envio !== undefined && solicitudData.monto_envio > 0) {
      doc
        .font('Helvetica-Bold')
        .fillColor('#081233')
        .text('Envío:', totalesLabelX, currentY);
      
      doc
        .font('Helvetica')
        .fillColor('black')
        .text(`¢ ${solicitudData.monto_envio.toLocaleString('es-CR', { minimumFractionDigits: 2 })}`, totalesValorX, currentY, { width: totalesValorWidth, align: 'right' });
      currentY += 15;
    }
    
    if (solicitudData.usa_factura && solicitudData.iva !== undefined && solicitudData.iva > 0) {
      doc
        .font('Helvetica-Bold')
        .fillColor('#081233')
        .text('IVA (13%):', totalesLabelX, currentY);
      
      doc
        .font('Helvetica')
        .fillColor('black')
        .text(`¢ ${solicitudData.iva.toLocaleString('es-CR', { minimumFractionDigits: 2 })}`, totalesValorX, currentY, { width: totalesValorWidth, align: 'right' });
      currentY += 15;
    }
    
    if (solicitudData.total !== undefined) {
      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .fillColor('#1E40AF')
        .text('TOTAL:', totalesLabelX, currentY);
      
      doc
        .fillColor('#CC0000')
        .text(`¢ ${solicitudData.total.toLocaleString('es-CR', { minimumFractionDigits: 2 })}`, totalesValorX, currentY, { width: totalesValorWidth, align: 'right' });
    }

    doc.end();
  });
}
