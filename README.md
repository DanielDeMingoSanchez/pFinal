# Proyecto Documentos

Aplicación robusta y profesional para la gestión de documentos con arquitectura frontend/backend.

## Tecnologías

### Frontend
- React 18 con TypeScript
- Vite como bundler
- Redux Toolkit para gestión de estado
- React Router para navegación
- Material UI para componentes
- Tailwind CSS para estilos
- Formik y Yup para validación de formularios
- Firebase para autenticación y almacenamiento

### Backend
- Spring Boot 3 con Kotlin
- JPA/Hibernate para persistencia
- Spring Security para autenticación y autorización
- PostgreSQL como base de datos
- JWT para tokens de autenticación
- Firebase Admin SDK

## Requisitos

- Node.js (v18+)
- JDK 17
- PostgreSQL
- Gradle

## Configuración

1. **Clonar el repositorio:**
   ```bash
   git clone [url-del-repositorio]
   cd proyecto-final
   ```

2. **Instalar dependencias:**
   ```bash
   # Instalar dependencias del proyecto principal
   npm install
   
   # Instalar dependencias del frontend
   cd frontend
   npm install
   cd ..
   ```

3. **Configurar base de datos:**
   - Crear una base de datos PostgreSQL
   - Actualizar las credenciales en `backend/src/main/resources/application.properties`

4. **Configurar Firebase:**
   - Crear un proyecto en Firebase Console
   - Descargar el archivo de configuración
   - Colocar la configuración en los archivos correspondientes

## Ejecución

### Desarrollo

```bash
# Iniciar el proyecto completo (frontend + backend)
npm start

# O iniciar por separado:
npm run start:frontend
npm run start:backend
```

### Producción

```bash
# Construir el proyecto completo
npm run build

# Construir por separado:
npm run build:frontend
npm run build:backend
```

## Estructura del Proyecto

### Frontend

```
frontend/
├── public/           # Archivos estáticos
├── src/
│   ├── components/   # Componentes reutilizables
│   ├── config/       # Configuraciones
│   ├── firebase/     # Configuración de Firebase
│   ├── hooks/        # Custom hooks
│   ├── resources/    # Recursos (imágenes, etc.)
│   ├── services/     # Servicios API
│   ├── store/        # Store de Redux
│   ├── theme/        # Configuración de temas
│   ├── types/        # Definiciones de TypeScript
│   ├── App.tsx       # Componente principal
│   ├── main.tsx      # Punto de entrada
│   └── index.css     # Estilos globales
```

### Backend

```
backend/
├── src/
│   ├── main/
│   │   ├── kotlin/
│   │   │   └── com/
│   │   │       └── documentos/
│   │   │           ├── config/      # Configuraciones
│   │   │           ├── controller/  # Controladores REST
│   │   │           ├── dto/         # Objetos de transferencia de datos
│   │   │           ├── model/       # Entidades
│   │   │           ├── repository/  # Repositorios
│   │   │           ├── security/    # Configuración de seguridad
│   │   │           ├── service/     # Servicios
│   │   │           └── DocumentosApplication.kt
│   │   └── resources/
│   │       ├── application.properties  # Propiedades de la aplicación
│   │       └── ...
│   └── test/        # Tests
```

## Mejores Prácticas Implementadas

### Frontend
- Arquitectura modular basada en componentes
- Gestión de estado centralizada con Redux
- Validación de formularios y manejo de errores
- Diseño responsivo
- Tipado estricto con TypeScript
- Rutas protegidas
- Interceptores para peticiones HTTP

### Backend
- Arquitectura en capas (controlador, servicio, repositorio)
- Validación de datos de entrada
- Manejo global de excepciones
- Seguridad con JWT
- Documentación de API
- Logging

## Licencia

Este proyecto está licenciado bajo la [Licencia MIT](LICENSE). 