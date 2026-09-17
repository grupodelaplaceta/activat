# ACTIVA’T · Secretaria Virtual · AFA Escola Sant Salvador

Base funcional per desplegar a Vercel i connectar amb Supabase mitjançant variables d'entorn.

## Principis
- No hi ha inici de sessió familiar.
- Cada gestió té un codi únic (`AFA-26-...`).
- El codi permet consultar una gestió i reutilitzar dades per a un nou tràmit.
- La zona interna és Secretaria, no un "panell de famílies" públic.
- Preinscripció → admissió → matrícula → plaça confirmada.
- Sense plaça → llista d'espera → vacant → acceptació.
- Quotes mensuals, pagaments, rebuts, moviments de places i documents tenen taules pròpies.
- Els PDF de preinscripció es generen en dues còpies amb el mateix contingut.

## Posada en marxa
1. Crea un projecte Supabase.
2. Executa `supabase/schema.sql` a SQL Editor.
3. Copia `.env.example` a `.env.local` i completa les variables.
4. `npm install`
5. `npm run dev`
6. A Vercel, defineix les mateixes variables d'entorn.

## Important
`SUPABASE_SERVICE_ROLE_KEY` només s'utilitza al servidor i no s'ha d'exposar al client.
La clau interna de Secretaria (`ACTIVAT_ADMIN_SECRET`) és una protecció inicial del prototip. Per producció convé substituir-la per autenticació administrativa robusta (SSO/OAuth o identitat de la Junta) i revisar RLS abans de guardar dades reals de menors.

## Dades de prova
Si Supabase encara no està configurat, la interfície mostra dades demo per poder provar el flux. Codi demo: `AFA-26-ROB-001`.


Antes del despliegue, revisar `PRODUCCION.md` y configurar las variables de entorno de Vercel.
