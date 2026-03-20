# Script para cambiar entre ambientes de forma fácil (Windows PowerShell)
# Uso: .\setup-env.ps1 [production|test]

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('production', 'prod', 'test', 'testqa', 'pruebas')]
    [string]$Ambiente
)

switch ($Ambiente) {
    {$_ -in 'production', 'prod'} {
        Write-Host "🟢 Configurando ambiente de PRODUCCIÓN..." -ForegroundColor Green
        Copy-Item .env.production .env -Force
        Write-Host "✅ Ambiente configurado:" -ForegroundColor Green
        Write-Host "   - Puerto: 3000"
        Write-Host "   - Contenedor: rentall-prod-container"
        Write-Host "   - Base de datos: ./database/rentall.db (ACTUAL - NO SE MODIFICA)"
    }
    {$_ -in 'test', 'testqa', 'pruebas'} {
        Write-Host "🟡 Configurando ambiente de PRUEBAS..." -ForegroundColor Yellow
        Copy-Item .env.testqa .env -Force
        Write-Host "✅ Ambiente configurado:" -ForegroundColor Green
        Write-Host "   - Puerto: 3002"
        Write-Host "   - Contenedor: rentall-test-container"
        Write-Host "   - Base de datos: ./database/test/rentall.db"
    }
}

Write-Host ""
Write-Host "📦 Ahora puedes ejecutar:"
Write-Host "   docker-compose up -d"
