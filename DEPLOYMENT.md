# Instrucciones de Deployment - Render.com

## ✅ Pre-requisitos Completados

- [x] `application.properties` usa variables de entorno
- [x] Build command configurado
- [x] Archivos de configuración creados

---

## 🚀 Pasos para Desplegar

### 1. Subir a GitHub (Si no lo has hecho)

```bash
cd "d:\tesis\programa tesis\Azuevento"
git add .
git commit -m "feat: preparar para deployment en Render"
git push origin main
```

### 2. Crear Cuenta en Render

1. Ve a [https://render.com](https://render.com)
2. Click en **"Get Started"** o **"Sign Up"**
3. Conecta con GitHub
4. Autoriza a Render

### 3. Crear Base de Datos PostgreSQL

1. En el dashboard de Render, click **"New +"**
2. Selecciona **"PostgreSQL"**
3. Configura:
   - **Name**: `azuevento-db`
   - **Database**: `azuevento`
   - **User**: `azuevento_user` (o deja el default)
   - **Region**: `Oregon (US West)` (más cercano a Ecuador)
   - **PostgreSQL Version**: 16
   - **Instance Type**: **Free**
4. Click **"Create Database"**
5. **IMPORTANTE**: Copia y guarda:
   - ✅ **Internal Database URL** (la usaremos para conectar)
   - ✅ **External Database URL** (para conectarte desde tu PC)

### 4. Crear Web Service (API)

1. Click **"New +"** → **"Web Service"**
2. Conecta tu repositorio de GitHub:
   - Busca `Azuevento`
   - Click **"Connect"**
3. Configura el servicio:

   **Basic Settings:**
   - **Name**: `azuevento-api`
   - **Region**: `Oregon (US West)` (mismo que la DB)
   - **Branch**: `main`
   - **Root Directory**: `eventos-comunitarios-api`
   - **Runtime**: `Java`
   
   **Build & Deploy:**
   - **Build Command**: 
     ```bash
     ./gradlew clean build -x test
     ```
   - **Start Command**: 
     ```bash
     java -Dserver.port=$PORT -jar build/libs/eventos-comunitarios-api-0.0.1-SNAPSHOT.jar
     ```

   **Instance Type:**
   - Selecciona **"Free"** (750 horas/mes gratis)

4. Click **"Advanced"** y agrega las siguientes variables de entorno:

   ```
   SPRING_DATASOURCE_URL=<Pega el Internal Database URL aquí>
   SPRING_DATASOURCE_USERNAME=azuevento_user
   SPRING_DATASOURCE_PASSWORD=<Password de la DB de Render>
   SPRING_JPA_HIBERNATE_DDL_AUTO=update
   SPRING_JPA_SHOW_SQL=false
   JWT_SECRET=azuevento-production-secret-key-2026-muy-seguro
   JWT_EXPIRATION=86400000
   CORS_ALLOWED_ORIGINS=*
   ```

   > **Nota**: Para obtener el password de la DB:
   > - Ve a tu PostgreSQL database en el dashboard
   > - En "Connections" verás el password

5. Click **"Create Web Service"**

### 5. Esperar el Deploy

- Render comenzará a construir tu aplicación
- Verás los logs en tiempo real
- El primer deploy tarda ~5-10 minutos
- Al finalizar verás: ✅ **"Live"**

### 6. Obtener la URL de tu API

Una vez desplegado, tu API estará en:
```
https://azuevento-api.onrender.com
```

### 7. Probar la API

Abre en tu navegador:
```
https://azuevento-api.onrender.com/swagger-ui.html
```

Deberías ver la documentación de Swagger UI 🎉

---

## 🧪 Testing

### Probar Registro
```bash
curl -X POST https://azuevento-api.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@azuevento.com",
    "password": "password123"
  }'
```

### Probar Login
```bash
curl -X POST https://azuevento-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@azuevento.com",
    "password": "password123"
  }'
```

---

## 📱 Actualizar el Frontend

En `eventos-comunitarios-app/.env`:

```env
API_URL=https://azuevento-api.onrender.com
```

---

## ⚠️ Importante para la Presentación

### Limitaciones del Free Tier:
- ⏰ El servicio se "duerme" después de **15 minutos** sin uso
- ⚙️ Tarda **~30 segundos** en "despertar"

### Solución para la Demo:
1. **5 minutos antes de presentar**, haz una request a la API:
   ```bash
   curl https://azuevento-api.onrender.com/swagger-ui.html
   ```
2. Esto "despertará" el servicio
3. Durante tu presentación estará activo

---

## 🔧 Troubleshooting

### Si el build falla:

1. **Revisa los logs** en Render Dashboard
2. Verifica que el path sea correcto: `eventos-comunitarios-api`
3. Asegúrate de que `gradlew` existe en el repo

### Si la app no inicia:

1. Revisa las **variables de entorno**
2. Verifica el **Internal Database URL**
3. Revisa logs en la sección "Logs" del dashboard

### Si no se conecta a la DB:

1. Verifica que ambos servicios estén en la **misma región**
2. Usa el **Internal Database URL**, NO el External

---

## 📊 Monitoreo

- **Logs**: Dashboard → azuevento-api → Logs tab
- **Métricas**: Dashboard → azuevento-api → Metrics
- **Base de datos**: Dashboard → azuevento-db → Info

---

## ✅ Checklist Final

- [ ] Código subido a GitHub
- [ ] PostgreSQL database creada en Render
- [ ] Web Service desplegado
- [ ] Variables de entorno configuradas
- [ ] API responde en `/swagger-ui.html`
- [ ] Frontend actualizado con nueva URL
- [ ] Probado registro y login
- [ ] Servicio "despertado" antes de presentar

---

¡Listo para presentar! 🎓🚀
