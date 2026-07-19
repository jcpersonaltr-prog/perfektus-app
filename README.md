# Método Perfektus — App de Cliente

PWA (instalável no telemóvel, sem lojas de apps) ligada a Supabase.

## O que já está pronto
- Login/sessão real via Supabase Auth
- Dashboard que lê `clients` e `workout_plans` da base de dados
- Estilo Field Manual aplicado (mesma estética do protótipo)
- Configurado como PWA instalável (manifest + service worker)

## O que falta fazeres tu (só tu tens acesso à tua conta)

### 1. Criar o projeto Supabase
1. Vai a https://supabase.com → Sign up / Login
2. "New Project" → nome (ex: `perfektus`) → escolhe região (Europe/Frankfurt é a mais próxima)
3. Guarda a password da base de dados nalgum lado seguro
4. Espera ~2 min pela criação

### 2. Correr o schema
1. No dashboard Supabase → "SQL Editor" → "New query"
2. Cola o conteúdo de `perfektus-schema.sql` (já te enviei este ficheiro antes)
3. "Run"

### 3. Ligar as credenciais
1. Supabase Dashboard → "Project Settings" → "API"
2. Copia `Project URL` e `anon public key`
3. No projeto local: `cp .env.example .env` e cola os dois valores

### 4. Criar o teu primeiro cliente de teste
No SQL Editor do Supabase:
```sql
-- Isto cria o utilizador de autenticação (substitui email/password)
-- Normalmente farias isto pelo painel admin, mas para testar:
-- Supabase Dashboard → Authentication → Users → "Add user"
```
Depois de criares o utilizador em Authentication → Users, copia o `UUID` dele e insere a linha correspondente em `clients`:
```sql
insert into clients (id, full_name, access_status)
values ('cola-aqui-o-uuid', 'Nome de Teste', 'active');
```

### 5. Correr localmente
```bash
npm install
npm run dev
```
Abre http://localhost:5173 (ajusta a `base` em `vite.config.js` para `/` durante testes locais, se preferires).

### 6. Publicar no GitHub Pages
```bash
npm run build
```
- Cria um repositório novo no GitHub (ex: `perfektus-app`)
- Ajusta `base: "/perfektus-app/"` em `vite.config.js` para corresponder ao nome exato do repositório
- Usa o GitHub Actions (recomendo `peaceiris/actions-gh-pages`) ou publica manualmente a pasta `dist/` no branch `gh-pages`
- Ativa GitHub Pages em Settings → Pages → branch `gh-pages`

## Próximos ecrãs a construir (código, não só protótipo)
- Treino (execução de sessão + logging de séries)
- Pagamento (submissão de referência + upload de comprovativo)
- Painel Admin (Next.js ou mesma stack, com role de "trainer")
