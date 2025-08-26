# 🚀 Instrucciones para subir a GitHub

## Opción 1: Desde GitHub.com (Recomendado)

1. **Ve a https://github.com** e inicia sesión
2. **Click en "New repository"** (botón verde)
3. **Nombre del repositorio**: `sacramentos-christifideles`
4. **Descripción**: `Sistema de registro de sacramentos para parroquias católicas - Next.js 15 + Prisma + PostgreSQL`
5. **Visibilidad**: 
   - ✅ **Público** (para compartir con la comunidad)
   - ⚠️ **Privado** (si prefieres mantenerlo privado)
6. **NO marques**: Initialize with README, .gitignore, o license (ya los tenemos)
7. **Click "Create repository"**

## Opción 2: Comandos para conectar

Una vez creado el repo en GitHub, ejecuta estos comandos:

```bash
git remote add origin https://github.com/TU-USUARIO/sacramentos-christifideles.git
git branch -M main
git push -u origin main
```

## ✅ Verificación

Después de subir, verifica que se subieron:
- ✅ Código fuente completo
- ✅ Schema Prisma
- ✅ Documentación en `/docs`
- ✅ Scripts SQL
- ✅ README.md completo
- ✅ .env.example (sin credenciales reales)

## 🚀 Para trabajar desde otra máquina:

```bash
git clone https://github.com/TU-USUARIO/sacramentos-christifideles.git
cd sacramentos-christifideles
npm install
cp .env.example .env
# Editar .env con tu configuración de BD
npx prisma generate
npm run dev
```

---
**¡Tu proyecto estará disponible en GitHub! 🎊**
