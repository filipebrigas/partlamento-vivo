# Parlamento Vivo — Os Scrollers do Parlamento 🇵🇹📱

> Sistema automático que apanha deputados portugueses a usar o telemóvel durante as sessões plenárias da Assembleia da República — e publica os clips no X/Twitter.

Inspirado em **"The Flemish Scrollers"** de [Dries Depoorter](https://driesdepoorter.be/).

---

## Funcionalidades

| Página | Descrição |
|--------|-----------|
| **Início** | Hero, contador de deteções, últimas capturas, explicação do funcionamento |
| **Deteções** | Feed paginado com filtros por partido, deputado e estado de publicação |
| **Deputados** | Base de dados dos 230 deputados com ranking e estatísticas por partido |
| **Estatísticas** | Gráficos: deteções ao longo do tempo, por partido, por dia da semana |
| **Documentação** | Guia técnico completo para configurar o AI Worker Python |

---

## Arquitetura

```
┌──────────────────────┐        ┌──────────────────────────┐
│   AI Worker (Python) │───────▶│   Supabase Edge Function │
│   - ARTV livestream  │  HTTP  │   receive-detection      │
│   - YOLOv8 deteção   │  POST  │                          │
│   - face_recognition │        └──────────┬───────────────┘
└──────────────────────┘                   │
                                           ▼
                              ┌────────────────────────┐
                              │   Supabase Database    │
                              │   - politicians        │
                              │   - detections         │
                              │   - sessions           │
                              └────────────┬───────────┘
                                           │
                              ┌────────────▼───────────┐
                              │  post-to-twitter func  │
                              │  (X/Twitter API v2)    │
                              └────────────────────────┘
                                           │
                              ┌────────────▼───────────┐
                              │   Web Dashboard        │
                              │   React + Vite + TS    │
                              └────────────────────────┘
```

---

## Stack Tecnológico

### Web Platform
- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS** + shadcn/ui components
- **React Router** v6 para navegação
- **Recharts** para gráficos
- **Supabase JS** para dados em tempo real

### Backend (Supabase)
- **PostgreSQL** — tabelas `politicians`, `detections`, `sessions`
- **Edge Functions** (Deno/TypeScript):
  - `receive-detection` — API para o AI Worker enviar deteções
  - `post-to-twitter` — publica no X/Twitter com OAuth 1.0a
  - `scrape-politicians` — scraping via Firecrawl do parlamento.pt
- **Row Level Security** — leitura pública, escrita apenas via service role

### AI Worker (Python — externo)
- **YOLOv8** (ultralytics) — deteção de telemóveis em vídeo
- **face_recognition** — identificação de deputados
- **streamlink** + **OpenCV** — captura do stream ARTV
- **schedule** — execução automática das 10h às 17h em dias úteis

---

## Instalação e Desenvolvimento

### Pré-requisitos
- Node.js 18+
- Conta Supabase
- (Opcional) Conta X/Twitter Developer e Firecrawl para produção

### Setup rápido

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com as suas chaves Supabase

# 3. Aplicar schema na base de dados Supabase
# Ir ao SQL Editor no dashboard Supabase e correr:
# supabase/migrations/001_initial_schema.sql

# 4. Iniciar servidor de desenvolvimento
npm run dev
```

A aplicação fica disponível em `http://localhost:5173`.

### Build para produção

```bash
npm run build
# Output em dist/
```

---

## Supabase Edge Functions

### Deploy

```bash
# Instalar Supabase CLI
npm install -g supabase

# Fazer login
supabase login

# Deploy de todas as funções
supabase functions deploy receive-detection
supabase functions deploy post-to-twitter
supabase functions deploy scrape-politicians

# Configurar variáveis de ambiente das funções
supabase secrets set DETECTION_API_SECRET=your-secret
supabase secrets set TWITTER_API_KEY=your-key
supabase secrets set TWITTER_API_SECRET=your-secret
supabase secrets set TWITTER_ACCESS_TOKEN=your-token
supabase secrets set TWITTER_ACCESS_TOKEN_SECRET=your-token-secret
supabase secrets set FIRECRAWL_API_KEY=your-key
```

### Endpoint da API para o AI Worker

```
POST https://your-project.supabase.co/functions/v1/receive-detection
Authorization: Bearer YOUR_DETECTION_API_SECRET
Content-Type: application/json

{
  "politician_id": "uuid",
  "timestamp": "2024-11-15T14:23:00Z",
  "confidence_score": 0.97,
  "screenshot_url": "https://...",
  "video_clip_url": "https://...",
  "session_date": "2024-11-15"
}
```

---

## AI Worker Python

Ver [Documentação técnica completa](/documentação) na aplicação web, ou `supabase/functions/` para os endpoints.

### Instalação resumida

```bash
pip install ultralytics face-recognition opencv-python streamlink requests schedule python-dotenv Pillow

cp .env.example .env
# Configurar SUPABASE_URL, SUPABASE_SERVICE_KEY, DETECTION_API_SECRET, ARTV_STREAM_URL

python scripts/build_face_db.py  # Construir base de dados de rostos
python worker.py                  # Iniciar monitorização
```

---

## Variáveis de Ambiente

| Variável | Onde | Descrição |
|----------|------|-----------|
| `VITE_SUPABASE_URL` | `.env` (frontend) | URL do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | `.env` (frontend) | Chave anónima pública |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Secrets | Chave de serviço (apenas server-side) |
| `DETECTION_API_SECRET` | Supabase Secrets + `.env` do worker | Token partilhado para autenticar o worker |
| `TWITTER_API_KEY` | Supabase Secrets | API Key do X/Twitter |
| `TWITTER_API_SECRET` | Supabase Secrets | API Secret do X/Twitter |
| `TWITTER_ACCESS_TOKEN` | Supabase Secrets | Access Token do X/Twitter |
| `TWITTER_ACCESS_TOKEN_SECRET` | Supabase Secrets | Access Token Secret do X/Twitter |
| `FIRECRAWL_API_KEY` | Supabase Secrets | Chave API Firecrawl |

---

## Licença

MIT — Projeto de transparência cívica sem fins lucrativos.

---

*"A tecnologia ao serviço da democracia."*
