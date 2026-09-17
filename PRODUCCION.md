# ACTIVA'T — checklist de producción

## Stack
- Next.js → Vercel
- Supabase PostgreSQL
- Supabase Storage para documentos
- Variables de entorno gestionadas por Vercel

## Antes de publicar
1. Crear el proyecto Supabase de producción.
2. Ejecutar `supabase/schema.sql`.
3. Revisar todas las tablas y activar RLS.
4. Crear políticas RLS mínimas y específicas para cada operación.
5. La `SUPABASE_SERVICE_ROLE_KEY` solo puede utilizarse en código servidor.
6. Los códigos Activa't deben ser impredecibles, no secuenciales en endpoints públicos, y tener rate limiting.
7. Los endpoints públicos nunca deben permitir enumerar preinscripciones ni descubrir datos de otras familias.
8. Validar datos también en servidor.
9. Mantener documentos privados; usar URLs firmadas con caducidad.
10. Limitar tipo/tamaño de archivos subidos.
11. Configurar backups y comprobar restauración.
12. Configurar dominio, HTTPS y variables Production/Preview en Vercel.
13. Revisar logs para no registrar DNI, teléfonos, direcciones ni datos de menores innecesariamente.
14. Probar de extremo a extremo preinscripción, consulta por código, copia de datos, admisión, matrícula, plazas, lista de espera, cuotas, pagos, recibos, PDF y cancelación.
15. Revisar los textos legales y el tratamiento de datos de menores antes de abrir al público.

## Modelo de acceso familiar
No hay cuentas de familia ni contraseña. El acceso a una gestión se realiza mediante un código de trámite. Para operaciones sensibles, el código debe complementarse con controles anti-abuso y, si procede, una segunda verificación.

## Datos demo
Eliminar/aislar todos los datos de prueba antes de producción.
