# 🍳 CocinApp - SaaS de Gestión Gastronómica

CocinApp es una plataforma SaaS (Software as a Service) diseñada para digitalizar y optimizar la gestión de restaurantes. Permite a los dueños administrar su catálogo, controlar ventas, gestionar mesas y autogenerar una carta digital web (Menú QR) con marca personalizada.

## 🚀 Tech Stack (Arquitectura)

- **Frontend:** React 18 + Vite
- **Lenguaje:** TypeScript
- **Estilos:** Tailwind CSS v4 + Lucide React (Iconos)
- **Componentes UI:** Shadcn UI / Radix UI primitives
- **Gestión de Estado:** Zustand
- **Enrutamiento:** React Router DOM v6
- **Backend & Base de Datos:** Supabase (PostgreSQL, Auth, RLS Policies)
- **Despliegue (CI/CD):** Vercel

## ⚙️ Requisitos Previos

Antes de clonar el proyecto, asegúrate de tener instalado en tu máquina:
- [Node.js](https://nodejs.org/) (Versión 18 o superior)
- Git

## 🛠️ Instalación y Configuración Local

**1. Clonar el repositorio**
\`\`\`bash
git clone https://github.com/ivanbohor/cocinapp.git
cd cocinapp
\`\`\`

**2. Instalar dependencias**
\`\`\`bash
npm install
\`\`\`

**3. Variables de Entorno**
Crea un archivo llamado `.env.local` en la raíz del proyecto. **NUNCA subas este archivo a GitHub**. Solicita las credenciales al administrador del proyecto y agrégalas con este formato:

\`\`\`env
VITE_SUPABASE_URL=https://[ID-DEL-PROYECTO].supabase.co
VITE_SUPABASE_ANON_KEY=[TU-CLAVE-ANONIMA-PUBLICA]
\`\`\`

**4. Iniciar el Servidor de Desarrollo**
\`\`\`bash
npm run dev
\`\`\`
El proyecto estará corriendo en `http://localhost:5173`.

## 🗄️ Esquema de Base de Datos (Supabase)

El sistema utiliza las siguientes tablas principales con seguridad RLS (Row Level Security):

- `usuarios`: Gestión de roles (Admin/Dueño, Cajero). Vinculado a Supabase Auth.
- `restaurantes`: Información del tenant (local). Almacena configuración visual (logo, colores) y el `slug` único para la URL de la carta digital web (`/m/:slug`).
- `productos`: Catálogo de platos. Incluye descripciones opcionales y lógica de ordenamiento de categorías.
- `mesas`, `gastos`, `ventas`: Tablas operativas para el flujo financiero y de punto de venta (POS).

## 🚀 Despliegue a Producción

El proyecto está configurado con CI/CD a través de Vercel. 
Cualquier cambio empujado (push) a la rama `main` disparará una nueva construcción automáticamente. 
*(Nota: El enrutamiento de la SPA está gestionado mediante el archivo `vercel.json`).*

---
*Desarrollado con ❤️ por el equipo de CocinApp.*