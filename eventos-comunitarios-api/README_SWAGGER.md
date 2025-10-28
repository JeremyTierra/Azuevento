# Backend Azuevento - Guía de Inicio Rápido

## 🚨 PROBLEMA SWAGGER - SOLUCIÓN

Si ves error 500 en Swagger, sigue **EXACTAMENTE** estos pasos:

### 1️⃣ Detener Completamente el Servidor

En la terminal donde está corriendo `./gradlew bootRun`:
```bash
# Presiona Ctrl+C para detener
# Espera a que diga "BUILD SUCCESSFUL" o se cierre completamente
```

### 2️⃣ Limpiar Build Anterior

```bash
cd d:\tesis\programa tesis\Azuevento\eventos-comunitarios-api
./gradlew clean
```

### 3️⃣ Compilar con Nuevos Cambios

```bash
./gradlew build -x test
```

**Debe decir:** `BUILD SUCCESSFUL`

### 4️⃣ Iniciar Servidor con Nueva Build

```bash
./gradlew bootRun
```

**Espera a ver:** `Started EventosComunitariosApiApplication in X.XXX seconds`

### 5️⃣ Abrir Swagger en el Navegador

```
http://localhost:8080/swagger-ui.html
```

**Presiona F5 o Ctrl+Shift+R** para forzar recarga del navegador (ignorar caché)

---

## ✅ Cambios Aplicados para Solucionar Error 500

1. ✅ **@JsonIgnore** en todas las relaciones `@OneToMany` y `@ManyToMany`:
   - [`User.java`](file:///d:/tesis/programa%20tesis/Azuevento/eventos-comunitarios-api/src/main/java/ec/edu/ucuenca/eventos/model/User.java)
   - [`Event.java`](file:///d:/tesis/programa%20tesis/Azuevento/eventos-comunitarios-api/src/main/java/ec/edu/ucuenca/eventos/model/Event.java)
   - [`Category.java`](file:///d:/tesis/programa%20tesis/Azuevento/eventos-comunitarios-api/src/main/java/ec/edu/ucuenca/eventos/model/Category.java)

2. ✅ **OpenApiConfig** configurado para:
   - Escanear solo paquete `controller`
   - Incluir autenticación JWT

3. ✅ **application.properties** con:
   ```properties
   # Excluir entidades JPA del schema generation
   springdoc.packages-to-exclude=ec.edu.ucuenca.eventos.model
   springdoc.model-and-view-allowed=false
   ```

---

## 🔍 Verificar que el Problema se Solucionó

### Opción 1: Ver JSON de API (Más Rápido)
```
http://localhost:8080/v3/api-docs
```

**Debe mostrar:** Un JSON grande con la definición de la API (no un error 500)

### Opción 2: Ver Swagger UI
```
http://localhost:8080/swagger-ui.html
```

**Debe mostrar:** 
- Lista de controladores (auth-controller, event-controller, etc.)
- Botón verde "Authorize" arriba a la derecha
- Todos los endpoints expandibles

---

## 🐛 Si AÚN Sigue el Error 500

### Paso 1: Ver Logs del Servidor

En la terminal donde está `bootRun`, busca líneas con:
```
ERROR
Exception
MethodArgumentTypeMismatchException
StackOverflowError
```

**Copia y pégame las últimas 20-30 líneas de error.**

### Paso 2: Verificar Puerto en Uso

```bash
# Ver si hay otro proceso en puerto 8080
netstat -ano | findstr :8080
```

Si hay otro proceso, mátalopara o cambia el puerto en `application.properties`:
```properties
server.port=8081
```

### Paso 3: Verificar Base de Datos

```bash
docker-compose ps
```

PostgreSQL debe estar corriendo en puerto 5432.

---

## 📊 Endpoints Disponibles en Swagger

Una vez funcione, verás estos grupos:

### 🔐 auth-controller
- `POST /api/auth/register` - Crear cuenta
- `POST /api/auth/login` - Iniciar sesión

### 📅 event-controller
- `GET /api/events` - Listar eventos públicos
- `POST /api/events` - Crear evento
- `GET /api/events/{id}` - Ver detalle
- `PUT /api/events/{id}` - Actualizar
- `DELETE /api/events/{id}` - Eliminar
- `POST /api/events/{id}/publish` - Publicar
- `GET /api/events/search` - Buscar

### 💬 comment-controller
- `POST /api/events/{eventId}/comments` - Crear comentario
- `GET /api/events/{eventId}/comments` - Listar comentarios

### ⭐ rating-controller
- `POST /api/events/{eventId}/ratings` - Crear/actualizar rating
- `GET /api/events/{eventId}/ratings` - Listar ratings
- `GET /api/events/{eventId}/ratings/average` - Promedio

### ❤️ favorite-controller
- `POST /api/events/{eventId}/favorite` - Agregar a favoritos
- `DELETE /api/events/{eventId}/favorite` - Quitar de favoritos
- `GET /api/users/favorites` - Mis favoritos

### 👥 participant-controller
- `POST /api/events/{eventId}/attendance` - Registrar asistencia
- `DELETE /api/events/{eventId}/attendance` - Cancelar asistencia

### 📂 category-controller
- `GET /api/categories` - Listar categorías

---

## 🔑 Cómo Usar Autenticación JWT en Swagger

1. **Registrar usuario:**
   ```bash
   POST /api/auth/register
   {
     "name": "Test User",
     "email": "test@test.com",
     "password": "123456"
   }
   ```

2. **Copiar el token** de la respuesta:
   ```json
   {
     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI...",
     ...
   }
   ```

3. **Click en "Authorize"** (botón verde arriba en Swagger)

4. **Pegar el token** en el campo `Value`:
   ```
   Bearer eyJhbGciOiJIUzI1NiIsInR5cCI...
   ```
   (Con la palabra "Bearer" y un espacio)

5. **Click "Authorize"** y luego **"Close"**

6. Ahora puedes probar endpoints protegidos ✅

---

## 📝 Archivos Modificados para Solucionar Error

| Archivo | Cambio |
|---------|--------|
| `User.java` | +6 líneas `@JsonIgnore` |
| `Event.java` | +5 líneas `@JsonIgnore` |
| `Category.java` | +3 líneas `@JsonIgnore` |
| `application.properties` | +3 propiedades Springdoc |
| `OpenApiConfig.java` | Configuración JWT + GroupedOpenApi |

Total: **17 líneas agregadas** para solucionar referencias circulares

---

## ❓ Preguntas Frecuentes

**P: ¿Por qué error 500 en Swagger?**  
R: Springdoc intentaba generar schemas de las entidades JPA que tienen relaciones bidireccionales (User ↔ Event ↔ Category) causando ciclos infinitos. Solucionado con `@JsonIgnore` y exclusión del paquete `model`.

**P: ¿Necesito reiniciar SIEMPRE después de cambios?**  
R: Sí, cambios en configuration beans, entidades JPA o properties requieren reinicio completo del servidor (Ctrl+C + `./gradlew bootRun`).

**P: ¿Puedo usar Postman en vez de Swagger?**  
R: Sí, todos los endpoints funcionan igual. Swagger es solo para documentación interactiva.

---

## 🚀 Siguiente Paso Después de Swagger

Una vez Swagger funcione correctamente:

1. ✅ Probar flujo completo de registro + login
2. ✅ Crear categorías de seed data
3. ✅ Probar CRUD de eventos
4. ✅ Verificar autenticación JWT
5. ✅ Tests automatizados
