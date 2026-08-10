EVOS Supabase Auth v1

Archivos:
- index.html: login, registro, sesión y perfil básico.
- api/config.js: entrega al frontend las variables NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY configuradas en Vercel.
- vercel.json: configuración mínima.

Uso:
1. Sustituir/añadir estos archivos en la raíz del repo evos-app.
2. Hacer commit a main.
3. Vercel desplegará automáticamente.
4. Abrir producción y comprobar que aparezca: "Conexión Supabase OK".
5. Crear un usuario de prueba y comprobar registro/login.

Nota: la ANON KEY de Supabase está diseñada para uso cliente; la seguridad real depende de RLS/policies de Supabase.
