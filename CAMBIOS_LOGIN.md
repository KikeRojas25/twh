# Cambios Realizados en el Sistema de Login

Este documento describe todos los cambios realizados en el componente de inicio de sesión (sign-in) y componentes relacionados.

## Fecha de Actualización
Última actualización: Diciembre 2024

---

## 1. Componente Sign-In (`src/app/modules/auth/sign-in/`)

### 1.1 Cambios en el Template HTML (`sign-in.component.html`)

#### Elementos Eliminados:
- ✅ **Sección "¿No tienes una cuenta? Regístrate"**: Eliminada completamente (líneas 19-26)
- ✅ **Enlace "¿Olvidó su contraseña?"**: Eliminado del formulario (líneas 115-119)
- ✅ **Sección "O continuar con"**: Eliminada con separador y botones de redes sociales (Google, Twitter, GitHub)

#### Elementos Modificados:
- ✅ **Logo**: 
  - Tamaño reducido de `width="700px"` a `w-48` (aproximadamente 192px)
  - Agregado `max-w-full` y `h-auto` para mantener proporciones
  - Centrado con `flex justify-center`
  - Margen superior del título reducido de `mt-8` a `mt-4`

- ✅ **Campo de Usuario**:
  - Label cambiado de "Correo" a "Usuario"
  - Mensaje de error cambiado de "El correo es requerido" a "El usuario es requerido"
  - Comentario actualizado de "Email field" a "Usuario field"

- ✅ **Contenedor de Acciones**:
  - Eliminado `justify-between` ya que solo queda el checkbox "Recuérdame"
  - Mantiene solo el checkbox "Recuérdame"

### 1.2 Cambios en el Componente TypeScript (`sign-in.component.ts`)

#### Funcionalidad "Recuérdame" Implementada:
- ✅ **Inicialización del formulario**:
  - Carga automática del usuario guardado desde `localStorage` con clave `'rememberedUsername'`
  - El checkbox se marca automáticamente si existe un usuario guardado

- ✅ **Guardado de credenciales**:
  - Al hacer login con "Recuérdame" marcado, guarda el usuario en `localStorage`
  - Si se desmarca, elimina el usuario guardado
  - **Nota**: Solo se guarda el usuario, NO la contraseña (por seguridad)

- ✅ **Mensajes de error**:
  - Cambiado de "Wrong email or password" a "Usuario o contraseña incorrectos"

- ✅ **Imports limpiados**:
  - Eliminado `RouterLink` que ya no se utiliza

#### Código de Referencia:
```typescript
// En ngOnInit():
const savedUsername = localStorage.getItem('rememberedUsername') || '';
const rememberMe = savedUsername ? true : false;

// En signIn():
if (rememberMe) {
    localStorage.setItem('rememberedUsername', username);
} else {
    localStorage.removeItem('rememberedUsername');
}
```

---

## 2. Componente Sign-Out (`src/app/modules/auth/sign-out/`)

### 2.1 Cambios en el Template HTML (`sign-out.component.html`)

#### Elementos Modificados:
- ✅ **Logo**: 
  - Cambiado de `logo.svg` a `logo-TWH.png` (mismo que sign-in)
  - Tamaño ajustado a `w-48` con `max-w-full h-auto`
  - Centrado con `flex justify-center`

- ✅ **Estructura**: 
  - Actualizada para coincidir con la estructura de sign-in
  - Mismas clases y layout

- ✅ **Textos en Español**:
  - "You have signed out!" → "Has cerrado sesión"
  - "Redirecting in" → "Redirigiendo en"
  - "You are now being redirected!" → "¡Serás redirigido ahora!"
  - "Go to sign in" → "Ir a iniciar sesión"

### 2.2 Cambios en el Componente TypeScript (`sign-out.component.ts`)

- ✅ **Countdown mapping en español**:
  - "second" → "segundo"
  - "seconds" → "segundos"

---

## 3. Menú de Usuario (`src/app/layout/common/user/`)

### 3.1 Cambios en el Template HTML (`user.component.html`)

#### Elementos Eliminados:
- ✅ **Foto de perfil**: Siempre muestra icono genérico (`heroicons_outline:user-circle`)
- ✅ **Botón y submenú "Estado"**: Eliminado completamente
- ✅ **Menú de estados** (Online, Ausente, Ocupado, Invisible): Eliminado

#### Elementos Modificados:
- ✅ **Textos en Español**:
  - "Signed in as" → "Conectado como"
  - "Profile" → "Perfil"
  - "Settings" → "Configuración"
  - "Status" → Eliminado
  - "Sign out" → "Cerrar sesión"

- ✅ **Información del usuario**:
  - Muestra `user.name` en lugar de `user.email`
  - Fallback a `user.email` si no hay nombre

- ✅ **Navegación**:
  - Botón "Configuración" ahora navega a `/configuracion` usando `routerLink`

### 3.2 Cambios en el Componente TypeScript (`user.component.ts`)

- ✅ **Método eliminado**:
  - `updateUserStatus()`: Eliminado completamente

- ✅ **Imports actualizados**:
  - Agregado `RouterLink` para navegación

---

## 4. Componente de Configuración (Nuevo)

### 4.1 Archivos Creados

- ✅ `src/app/modules/configuracion/configuracion.component.ts`
- ✅ `src/app/modules/configuracion/configuracion.component.html`
- ✅ `src/app/modules/configuracion/configuracion.routes.ts`

### 4.2 Funcionalidades

#### Formulario de Información Personal:
- ✅ Nombre completo (requerido)
- ✅ DNI (requerido)
- ✅ Teléfono (requerido)

#### Formulario de Cambio de Contraseña:
- ✅ Contraseña actual (requerido)
- ✅ Nueva contraseña (requerido, mínimo 6 caracteres)
- ✅ Confirmar nueva contraseña (requerido)
- ✅ Validación de coincidencia de contraseñas

### 4.3 Ruta
- ✅ Ruta: `/configuracion`
- ✅ Protegida con `AuthGuard`

### 4.4 Tipo User Actualizado
- ✅ Agregados campos opcionales `dni` y `phone` a la interfaz `User` en `src/app/core/user/user.types.ts`

---

## 5. Shortcuts (Accesos Rápidos)

### 5.1 Shortcuts Configurados

1. **Inventario General**
   - Ruta: `/inventario/inventariogeneral`
   - Icono: `heroicons_outline:archive-box`
   - Descripción: "Reporte de inventario"

2. **Kardex General**
   - Ruta: `/inventario/kardexgeneral`
   - Icono: `heroicons_outline:clipboard-document-list`
   - Descripción: "Reporte de kardex"

3. **Dashboard TWH**
   - Ruta: `/inventario/dashboard-pbi`
   - Icono: `heroicons_outline:chart-bar-square`
   - Descripción: "Reporte Power BI"

4. **B2B**
   - Ruta: `/b2b/ordenessalida`
   - Icono: `heroicons_outline:building-storefront`
   - Descripción: "Órdenes de salida"

### 5.2 Cambios en el Componente de Shortcuts

#### Elementos Eliminados:
- ✅ Todos los shortcuts por defecto excepto los 4 configurados
- ✅ Botones de edición, agregar y modificar
- ✅ Formulario de agregar/editar shortcuts
- ✅ Modo 'modify' del template

#### Elementos Modificados:
- ✅ Título cambiado de "Shortcuts" a "Accesos Rápidos"
- ✅ Textos de "No shortcuts" a "No hay accesos rápidos"
- ✅ Solo funciona en modo 'view' (solo lectura)

### 5.3 Archivo de Datos
- ✅ `src/app/mock-api/common/shortcuts/data.ts`: Solo contiene los 4 shortcuts configurados

---

## 6. Componente Dashboard PBI (Nuevo)

### 6.1 Archivos Creados

- ✅ `src/app/modules/admin/reportes/dashboard-pbi/dashboard-pbi.component.ts`
- ✅ `src/app/modules/admin/reportes/dashboard-pbi/dashboard-pbi.component.html`
- ✅ `src/app/modules/admin/reportes/dashboard-pbi/dashboard-pbi.component.css`
- ✅ `src/app/modules/admin/reportes/dashboard-pbi/dashboard-pbi.routes.ts`

### 6.2 Funcionalidad

- ✅ Muestra un iframe con el dashboard de Power BI
- ✅ URL del iframe: `https://app.powerbi.com/view?r=eyJrIjoiMDU3M2IxY2ItODkxMy00YzE4LTk1MzUtNTk4ZjcwM2IzNzE4IiwidCI6IjlhZGI4ODNkLTg3OTQtNDU3Mi1iMTU2LWFiOTUyZjA2MDY5MCIsImMiOjR9`
- ✅ Usa el pipe `safe` para sanitizar la URL del iframe

### 6.3 Pipe Safe (Nuevo)

- ✅ `src/app/core/pipes/safe.pipe.ts`: Pipe para sanitizar URLs de iframes

### 6.4 Ruta
- ✅ Ruta: `/inventario/dashboard-pbi`
- ✅ Protegida con `AuthGuard`

---

## 7. Resumen de Cambios por Categoría

### 7.1 Eliminaciones
- Opción de registro ("No tienes cuenta, regístrate")
- Opción de recuperación de contraseña ("Olvidó su contraseña")
- Botones de redes sociales (Google, Twitter, GitHub)
- Estados de usuario (Online, Ausente, Ocupado, Invisible)
- Edición de shortcuts
- Foto de perfil (siempre muestra icono genérico)

### 7.2 Modificaciones
- Logo reducido y centrado
- Campo "Correo" cambiado a "Usuario"
- Textos traducidos al español
- Funcionalidad "Recuérdame" implementada
- Menú de usuario simplificado

### 7.3 Nuevos Componentes
- Componente de Configuración (`/configuracion`)
- Componente Dashboard PBI (`/inventario/dashboard-pbi`)
- Pipe Safe para sanitización de URLs

### 7.4 Nuevas Rutas
- `/configuracion` - Configuración de usuario
- `/inventario/dashboard-pbi` - Dashboard Power BI

---

## 8. Notas Importantes

### 8.1 Seguridad
- ⚠️ **IMPORTANTE**: La funcionalidad "Recuérdame" solo guarda el nombre de usuario, NO la contraseña
- ⚠️ El campo interno del formulario sigue usando `'email'` para mantener compatibilidad con el backend

### 8.2 Compatibilidad
- El campo del formulario mantiene el nombre `'email'` internamente para compatibilidad con el backend
- Solo se cambió la etiqueta visual a "Usuario"

### 8.3 LocalStorage
- Clave utilizada: `'rememberedUsername'`
- Se guarda/elimina según el estado del checkbox "Recuérdame"

---

## 9. Archivos Modificados

### 9.1 Componentes de Autenticación
- `src/app/modules/auth/sign-in/sign-in.component.html`
- `src/app/modules/auth/sign-in/sign-in.component.ts`
- `src/app/modules/auth/sign-out/sign-out.component.html`
- `src/app/modules/auth/sign-out/sign-out.component.ts`

### 9.2 Componentes de Layout
- `src/app/layout/common/user/user.component.html`
- `src/app/layout/common/user/user.component.ts`
- `src/app/layout/common/shortcuts/shortcuts.component.html`

### 9.3 Tipos y Servicios
- `src/app/core/user/user.types.ts`

### 9.4 Datos Mock
- `src/app/mock-api/common/shortcuts/data.ts`

### 9.5 Rutas
- `src/app/app.routes.ts`

### 9.6 Archivos Nuevos
- `src/app/modules/configuracion/configuracion.component.ts`
- `src/app/modules/configuracion/configuracion.component.html`
- `src/app/modules/configuracion/configuracion.routes.ts`
- `src/app/modules/admin/reportes/dashboard-pbi/dashboard-pbi.component.ts`
- `src/app/modules/admin/reportes/dashboard-pbi/dashboard-pbi.component.html`
- `src/app/modules/admin/reportes/dashboard-pbi/dashboard-pbi.component.css`
- `src/app/modules/admin/reportes/dashboard-pbi/dashboard-pbi.routes.ts`
- `src/app/core/pipes/safe.pipe.ts`

---

## 10. Próximos Pasos Sugeridos

1. Implementar la funcionalidad de cambio de contraseña en el backend
2. Implementar la actualización de datos de usuario (nombre, DNI, teléfono) en el backend
3. Agregar validaciones adicionales si es necesario
4. Considerar agregar más shortcuts según necesidades del negocio

---

**Fin del Documento**

