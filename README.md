# Parlamento em Análise 🇵🇹🎙️

> Análise automática do discurso parlamentar português — quem fala, por quanto tempo,
> e quantas **palavras de enchimento** usam em cada intervenção no Plenário.

Stream monitorizado: **[canal.parlamento.pt/plenario](https://canal.parlamento.pt/plenario)**

---

## Funcionalidades

| Página | Descrição |
|--------|-----------|
| **Ao Vivo** | Transcrição em tempo real com destacamento de enchimento por orador |
| **Discursos** | Arquivo de todas as intervenções com transcrições e enchimento destacado |
| **Enchimento** | Catálogo de 30+ palavras/expressões, rankings por palavra e deputado |
| **Participação** | Quem fala mais? Quem nunca intervém? Tempo e frequência por deputado/partido |
| **Comparar** | Perfil discursivo lado a lado com radar chart e estatísticas detalhadas |
| **Estatísticas** | Dashboards completos: evolução, por partido, por dia da semana |
| **Documentação** | Guia técnico para configurar o AI Worker Python |

---

## Palavras de Enchimento Detectadas

Em média, **10.6%** das palavras ditas no Plenário são de enchimento.

| Categoria | Exemplos |
|-----------|----------|
| Marcadores | portanto, então, ora, pronto, bom, pois |
| Hesitação | né, tipo, digamos, quer dizer, ou seja |
| Óbvio | obviamente, claramente, evidentemente |
| Vago | de certa forma, de alguma forma, basicamente, ao nível de |

---

## Arquitetura

```
canal.parlamento.pt/plenario (HLS stream)
          │
          ▼
┌─────────────────────────┐
│   AI Worker (Python)    │
│   streamlink → ffmpeg   │  captura stream
│   OpenAI Whisper        │  transcrição pt
│   pyannote.audio        │  diarização
│   face_recognition      │  ID facial
│   NLP filler detection  │  detecta enchimento
└────────────┬────────────┘
             │ POST /receive-speech
             ▼
┌────────────────────────────────┐
│   Supabase PostgreSQL          │
│   sessions · politicians       │
│   speeches · transcript_events │
│   filler_words catalog         │
└────────────┬───────────────────┘
             │ Realtime + REST
             ▼
┌────────────────────────────────┐
│   Web Dashboard                │
│   React + Vite + TypeScript    │
│   Recharts + Tailwind CSS      │
└────────────────────────────────┘
```

---

## Stack

**Frontend:** React 18 · TypeScript · Vite · Tailwind CSS · Recharts · Supabase JS Realtime

**Backend (Supabase):** PostgreSQL · Edge Functions (Deno) — `receive-speech`, `session-manager`, `scrape-politicians`

**AI Worker (Python):** OpenAI Whisper · pyannote.audio · face_recognition · streamlink · ffmpeg · schedule

---

## Setup Rápido

```bash
npm install
cp .env.example .env   # editar com chaves Supabase
npm run dev            # → http://localhost:5173
```

### Deploy Edge Functions

```bash
supabase functions deploy receive-speech
supabase functions deploy session-manager
supabase secrets set SPEECH_API_SECRET=your-secret
```

### AI Worker

```bash
pip install openai-whisper pyannote.audio face-recognition opencv-python streamlink requests schedule
python scripts/build_face_db.py
python main.py  # monitoriza seg-sex 10h-17h
```

---

## API — receive-speech

```
POST /functions/v1/receive-speech
Authorization: Bearer SPEECH_API_SECRET

{
  "session_id": "uuid",
  "politician_id": "uuid",
  "started_at": "2024-11-20T14:23:00Z",
  "transcript": "Sr. Presidente, portanto o que está em causa...",
  "word_count": 156,
  "filler_word_count": 18,
  "filler_occurrences": { "portanto": 5, "então": 4 },
  "words_per_minute": 142,
  "confidence": 0.89,
  "identified_via": "face"
}
```

---

MIT — Projeto de transparência cívica sem fins lucrativos.
