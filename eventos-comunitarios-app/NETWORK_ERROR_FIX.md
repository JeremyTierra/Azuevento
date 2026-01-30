# 🔧 Solución: Network Error en App Móvil

## ❌ Error Actual
```
Sign in error: {message: 'Network Error', status: undefined, data: undefined}
```

## 🔍 Diagnóstico

### ¿Qué dispositivo estás usando?

Presiona **`r`** en la terminal de Expo y fíjate en el mensaje:

1. **"Running on Android"** o ves un emulador Android → Usa configuración para Android
2. **"Running on iOS"** o ves iPhone simulator → Usa configuración para iOS  
3. **Expo Go en celular físico** → Usa configuración para dispositivo real

---

## ✅ Soluciones por Plataforma

### 1️⃣ Android Emulator (Más común)

El backend está en tu máquina Windows en `localhost:8080`, pero el emulador Android no puede usar `localhost` directamente.

**Solución:** Usa la IP especial `10.0.2.2` que Android emulator mapea a `localhost` de la máquina host.

#### Editar `src/constants/api.ts`:

```typescript
export const getApiUrl = () => {
  if (__DEV__) {
    // Development
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:8080/api'; // ✅ Ya está correcto
    }
    // iOS simulator
    return 'http://localhost:8080/api';
  }
  // Production
  return 'https://api.azuevento.com/api';
};
```

Si ya está así y sigue fallando:

**Verificar que el backend esté corriendo:**

```bash
# ¿Ves un proceso Java en puerto 8080?
netstat -ano | findstr :8080

# Si NO ves nada, inicia el backend:
cd eventos-comunitarios-api
./gradlew bootRun
```

**Probar desde el emulador:**

```bash
# Conectarte al emulador con adb
adb shell

# Desde el shell del emulador, probar:
curl http://10.0.2.2:8080/api/categories

# Si funciona, debería mostrar: []
# Si falla, el problema es el backend
```

---

### 2️⃣ iOS Simulator

iOS simulator SÍ puede usar `localhost` directamente.

#### Verificar `src/constants/api.ts`:

```typescript
if (Platform.OS === 'android') {
  return 'http://10.0.2.2:8080/api';
}
// iOS simulator
return 'http://localhost:8080/api'; // ✅ Correcto para iOS
```

**Si falla:**
- Verifica que el backend esté corriendo: `curl http://localhost:8080/api/categories`
- Reinicia el simulator

---

### 3️⃣ Dispositivo Real (Celular físico con Expo Go)

Tu celular y tu computadora deben estar en la **misma red WiFi**.

**Solución:** Reemplaza `localhost` con la **IP local de tu máquina Windows**.

#### Paso 1: Obtener tu IP local

```bash
# PowerShell
ipconfig

# Busca "Adaptador de LAN inalámbrica Wi-Fi":
# Dirección IPv4: 192.168.x.x  ← Esta es tu IP
```

Ejemplo: `192.168.18.203` (la que ya veo en tus logs)

#### Paso 2: Editar `src/constants/api.ts`

```typescript
export const getApiUrl = () => {
  if (__DEV__) {
    if (Platform.OS === 'android') {
      // Para DISPOSITIVO REAL (no emulator)
      return 'http://192.168.18.203:8080/api'; // ⚠️ Cambiar a tu IP
      
      // Para Android Emulator, usa:
      // return 'http://10.0.2.2:8080/api';
    }
    return 'http://192.168.18.203:8080/api'; // Para iOS en dispositivo real
  }
  return 'https://api.azuevento.com/api';
};
```

#### Paso 3: Verificar firewall

Windows Firewall puede bloquear conexiones. Permite puerto 8080:

```powershell
# PowerShell como Administrador
New-NetFirewallRule -DisplayName "Spring Boot Dev" -Direction Inbound -LocalPort 8080 -Protocol TCP -Action Allow
```

#### Paso 4: Probar desde el celular

Abre el navegador del celular y ve a:
```
http://192.168.18.203:8080/api/categories
```

Si ves `[]` → Backend alcanzable  
Si falla → Problema de red/firewall

---

## 🚀 Verificación Rápida del Backend

```bash
# 1. Verificar PostgreSQL corriendo
docker ps | findstr postgres

# 2. Verificar backend corriendo
curl http://localhost:8080/api/categories

# Si falla, iniciar backend:
cd eventos-comunitarios-api
./gradlew bootRun

# Espera a ver:
# "Started EventosComunitariosApiApplication in X.XXX seconds"
```

---

## 🧪 Test Rápido

Después de configurar la URL correcta:

1. **Reload la app:** Presiona `r` en terminal de Expo
2. **Ir a RegisterScreen**
3. **Completar form** con datos de prueba
4. **Click "Crear Cuenta"**

### ✅ Si funciona:
```
Navega a HomeScreen
Muestra: "¡Bienvenido! Hola, [Tu Nombre]"
```

### ❌ Si sigue fallando:

1. **Ver logs del backend** (terminal donde corre `./gradlew bootRun`)
2. **Copiar error completo** y compartirlo
3. **Verificar URL** en terminal de Expo:
   ```javascript
   // En la app, agregar console.log temporal
   console.log('API_URL:', API_URL);
   ```

---

## 📱 Método Alternativo: Testear Backend Directamente

Si tienes dudas, prueba el backend con curl primero:

```bash
# Registro
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"123456"}'

# Debería retornar:
# {"token":"eyJ...","userId":1,"name":"Test","email":"test@test.com","role":"USER"}
```

Si curl funciona pero la app no, el problema es la URL en la app.

---

## 🆘 Checklist de Diagnóstico

- [ ] Backend corriendo (`netstat -ano | findstr :8080` muestra proceso)
- [ ] PostgreSQL corriendo (`docker ps` muestra azuevento-postgres)
- [ ] Backend responde (`curl http://localhost:8080/api/categories` retorna `[]`)
- [ ] Identifiqué mi plataforma (Android emulator / iOS / Dispositivo real)
- [ ] Configuré URL correcta en `api.ts`
- [ ] Reinicié la app (presioné `r`)
- [ ] Si dispositivo real: Same WiFi + IP correcta + Firewall permitido

---

## 💡 Configuración Recomendada

Para desarrollo rápido, usa **Android Emulator** con `10.0.2.2` (ya está configurado).

Si estás en dispositivo real, cambia temporalmente `api.ts`:

```typescript
// TEMPORAL para testing en dispositivo real
export const API_URL = 'http://192.168.18.203:8080/api'; // Tu IP aquí
```

Cuando funcione, revertir a la configuración dinámica.
