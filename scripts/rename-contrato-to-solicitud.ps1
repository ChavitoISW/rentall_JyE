# Script para renombrar todas las referencias de contrato a solicitud_equipo

Write-Host "Iniciando reemplazo de 'contrato' por 'solicitud_equipo'..." -ForegroundColor Green

# Leer contenido del archivo Contratos.tsx
$filePath = "c:\Users\BraulioAlexanderAlva\Desktop\rentAll\src\componentes\Contratos.tsx"
$outputPath = "c:\Users\BraulioAlexanderAlva\Desktop\rentAll\src\componentes\SolicitudesEquipo.tsx"

if (-not (Test-Path $filePath)) {
    Write-Host "Error: No se encontró el archivo Contratos.tsx" -ForegroundColor Red
    exit 1
}

$contratosTsx = Get-Content -Path $filePath -Raw -Encoding UTF8

# Aplicar reemplazos paso por paso
Write-Host "Aplicando reemplazos..." -ForegroundColor Yellow

$solicitudesTsx = $contratosTsx
$solicitudesTsx = $solicitudesTsx -replace 'Contrato\.module\.css', 'SolicitudEquipo.module.css'
$solicitudesTsx = $solicitudesTsx -replace 'interface EncabezadoContrato\b', 'interface EncabezadoSolicitudEquipo'
$solicitudesTsx = $solicitudesTsx -replace 'interface DetalleContrato\b', 'interface DetalleSolicitudEquipo'
$solicitudesTsx = $solicitudesTsx -replace 'EncabezadoContrato\[\]', 'EncabezadoSolicitudEquipo[]'
$solicitudesTsx = $solicitudesTsx -replace 'EncabezadoContrato>', 'EncabezadoSolicitudEquipo>'
$solicitudesTsx = $solicitudesTsx -replace '<EncabezadoContrato>', '<EncabezadoSolicitudEquipo>'
$solicitudesTsx = $solicitudesTsx -replace 'EncabezadoContrato\{', 'EncabezadoSolicitudEquipo{'
$solicitudesTsx = $solicitudesTsx -replace 'DetalleContrato\[\]', 'DetalleSolicitudEquipo[]'
$solicitudesTsx = $solicitudesTsx -replace 'DetalleContrato>', 'DetalleSolicitudEquipo>'
$solicitudesTsx = $solicitudesTsx -replace '<DetalleContrato>', '<DetalleSolicitudEquipo>'
$solicitudesTsx = $solicitudesTsx -replace 'const Contratos:', 'const SolicitudesEquipo:'
$solicitudesTsx = $solicitudesTsx -replace 'export default Contratos', 'export default SolicitudesEquipo'
$solicitudesTsx = $solicitudesTsx -replace '\bnumero_contrato\b', 'numero_solicitud_equipo'
$solicitudesTsx = $solicitudesTsx -replace '\bid_contrato\b', 'id_solicitud_equipo'
$solicitudesTsx = $solicitudesTsx -replace '\btipo_contrato\b', 'tipo_solicitud_equipo'
$solicitudesTsx = $solicitudesTsx -replace '\bprovincia_contrato\b', 'provincia_solicitud_equipo'
$solicitudesTsx = $solicitudesTsx -replace '\bcanton_contrato\b', 'canton_solicitud_equipo'
$solicitudesTsx = $solicitudesTsx -replace '\bdistrito_contrato\b', 'distrito_solicitud_equipo'
$solicitudesTsx = $solicitudesTsx -replace '\botras_senas_contrato\b', 'otras_senas_solicitud_equipo'
$solicitudesTsx = $solicitudesTsx -replace '\bobservaciones_contrato\b', 'observaciones_solicitud_equipo'
$solicitudesTsx = $solicitudesTsx -replace '\bsubtotal_contrato\b', 'subtotal_solicitud_equipo'
$solicitudesTsx = $solicitudesTsx -replace '\bdescuento_contrato\b', 'descuento_solicitud_equipo'
$solicitudesTsx = $solicitudesTsx -replace '\btotal_contrato\b', 'total_solicitud_equipo'
$solicitudesTsx = $solicitudesTsx -replace '\biva_contrato\b', 'iva_solicitud_equipo'
$solicitudesTsx = $solicitudesTsx -replace '\bestado_contrato\b', 'estado_solicitud_equipo'
$solicitudesTsx = $solicitudesTsx -replace '\bid_detalle_contrato\b', 'id_detalle_solicitud_equipo'
$solicitudesTsx = $solicitudesTsx -replace '\[contratos,', '[solicitudesEquipo,'
$solicitudesTsx = $solicitudesTsx -replace 'setContratos\]', 'setSolicitudesEquipo]'
$solicitudesTsx = $solicitudesTsx -replace 'setContratos\(', 'setSolicitudesEquipo('
$solicitudesTsx = $solicitudesTsx -replace '\bcontratos\.', 'solicitudesEquipo.'
$solicitudesTsx = $solicitudesTsx -replace '\bcontratos\[', 'solicitudesEquipo['
$solicitudesTsx = $solicitudesTsx -replace '\(contratos\)', '(solicitudesEquipo)'
$solicitudesTsx = $solicitudesTsx -replace '\bcurrentContrato\b', 'currentSolicitudEquipo'
$solicitudesTsx = $solicitudesTsx -replace '\bsetCurrentContrato\b', 'setCurrentSolicitudEquipo'
$solicitudesTsx = $solicitudesTsx -replace '\bfetchContratos\b', 'fetchSolicitudesEquipo'
$solicitudesTsx = $solicitudesTsx -replace '\bgenerarNumeroContrato\b', 'generarNumeroSolicitudEquipo'
$solicitudesTsx = $solicitudesTsx -replace '\bcontratoData\b', 'solicitudEquipoData'
$solicitudesTsx = $solicitudesTsx -replace '\bcontratoConValores\b', 'solicitudEquipoConValores'
$solicitudesTsx = $solicitudesTsx -replace '\bcontratoId\b', 'solicitudEquipoId'
$solicitudesTsx = $solicitudesTsx -replace '\/api\/contrato', '/api/solicitud-equipo'
$solicitudesTsx = $solicitudesTsx -replace '\/api\/detalle-contrato', '/api/detalle-solicitud-equipo'
$solicitudesTsx = $solicitudesTsx -replace 'Gestión de Contratos', 'Gestión de Solicitudes de Equipo'
$solicitudesTsx = $solicitudesTsx -replace 'Nuevo Contrato', 'Nueva Solicitud'
$solicitudesTsx = $solicitudesTsx -replace 'Ver Contrato', 'Ver Solicitud'
$solicitudesTsx = $solicitudesTsx -replace 'Editar Contrato', 'Editar Solicitud'
$solicitudesTsx = $solicitudesTsx -replace 'Eliminar contrato', 'Eliminar solicitud'
$solicitudesTsx = $solicitudesTsx -replace 'eliminar este contrato', 'eliminar esta solicitud'
$solicitudesTsx = $solicitudesTsx -replace 'No se encontraron contratos', 'No se encontraron solicitudes'
$solicitudesTsx = $solicitudesTsx -replace 'Buscar contratos\.\.\.', 'Buscar solicitudes...'
$solicitudesTsx = $solicitudesTsx -replace 'Número Contrato', 'Número Solicitud'
$solicitudesTsx = $solicitudesTsx -replace 'Número de Contrato', 'Número de Solicitud'
$solicitudesTsx = $solicitudesTsx -replace 'número de contrato', 'número de solicitud'
$solicitudesTsx = $solicitudesTsx -replace 'Datos del Contrato', 'Datos de la Solicitud'
$solicitudesTsx = $solicitudesTsx -replace 'Error al cargar contratos', 'Error al cargar solicitudes'
$solicitudesTsx = $solicitudesTsx -replace 'Error al guardar el contrato', 'Error al guardar la solicitud'
$solicitudesTsx = $solicitudesTsx -replace 'Error al guardar contrato', 'Error al guardar solicitud'
$solicitudesTsx = $solicitudesTsx -replace 'Error al eliminar contrato', 'Error al eliminar solicitud'
$solicitudesTsx = $solicitudesTsx -replace 'Opciones de Contrato', 'Opciones de Solicitud'
$solicitudesTsx = $solicitudesTsx -replace 'filteredContratos', 'filteredSolicitudesEquipo'
$solicitudesTsx = $solicitudesTsx -replace 'Debe agregar al menos un equipo al contrato', 'Debe agregar al menos un equipo a la solicitud'

# Guardar archivo nuevo
Set-Content -Path $outputPath -Value $solicitudesTsx -Encoding UTF8 -NoNewline

Write-Host "✓ Archivo SolicitudesEquipo.tsx creado exitosamente" -ForegroundColor Green
Write-Host "   Ubicación: $outputPath" -ForegroundColor Cyan

