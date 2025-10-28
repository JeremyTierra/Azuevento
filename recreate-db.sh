#!/bin/bash

# Script para recrear la base de datos con los constraints corregidos

echo "🗑️  Deteniendo contenedores de Docker..."
docker-compose down

echo "🗂️  Eliminando volumen de PostgreSQL..."
docker volume rm azuevento_postgres_data 2>/dev/null || echo "Volumen no existe, continuando..."

echo "🚀 Iniciando PostgreSQL con esquema actualizado..."
docker-compose up -d postgres

echo "⏳ Esperando a que PostgreSQL esté listo..."
sleep 5

echo "✅ Base de datos recreada con constraints corregidos!"
echo ""
echo "Ahora puedes iniciar el backend:"
echo "  cd eventos-comunitarios-api"
echo "  ./gradlew bootRun"
