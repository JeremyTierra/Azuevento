# Script PowerShell para recrear la base de datos con los constraints corregidos

Write-Host "🗑️  Deteniendo contenedores de Docker..." -ForegroundColor Yellow
docker-compose down

Write-Host "🗂️  Eliminando volumen de PostgreSQL..." -ForegroundColor Yellow
docker volume rm azuevento_postgres_data 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Volumen no existe, continuando..." -ForegroundColor Gray
}

Write-Host "🚀 Iniciando PostgreSQL con esquema actualizado..." -ForegroundColor Green
docker-compose up -d postgres

Write-Host "⏳ Esperando a que PostgreSQL esté listo..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

Write-Host "✅ Base de datos recreada con constraints corregidos!" -ForegroundColor Green
Write-Host ""
Write-Host "Ahora puedes iniciar el backend:" -ForegroundColor White
Write-Host "  cd eventos-comunitarios-api" -ForegroundColor Gray
Write-Host "  .\gradlew bootRun" -ForegroundColor Gray
