import { useState } from 'react'
import { Code2, Terminal, Database, Key, Cpu, Cog, ExternalLink, Copy, CheckCheck, Mic } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

function CodeBlock({ code, language = 'bash' }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="relative rounded-lg bg-[#0d1117] border border-border/60 overflow-hidden my-3">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/60 bg-[#161b22]">
        <span className="text-xs text-muted-foreground font-mono">{language}</span>
        <button onClick={copy} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          {copied ? <><CheckCheck className="h-3.5 w-3.5 text-green-400" /> Copiado</> : <><Copy className="h-3.5 w-3.5" /> Copiar</>}
        </button>
      </div>
      <pre className="p-4 text-sm font-mono text-[#e6edf3] overflow-x-auto scrollbar-hide"><code>{code}</code></pre>
    </div>
  )
}

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="mb-12">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-parliament-blue/30 border border-parliament-blue/50 flex items-center justify-center">
          <Icon className="h-4 w-4 text-parliament-gold" />
        </div>
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
      </div>
      <div className="text-sm text-muted-foreground leading-relaxed space-y-3">{children}</div>
    </div>
  )
}

export function Documentation() {
  return (
    <div className="container py-10 max-w-4xl">
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="outline" className="border-parliament-gold/40 text-parliament-gold">Documentação Técnica</Badge>
          <Badge variant="outline" className="text-muted-foreground">v2.0 — Speech Intelligence</Badge>
        </div>
        <h1 className="text-4xl font-black text-foreground mb-3">Guia do AI Worker — Python</h1>
        <p className="text-lg text-muted-foreground">
          Como configurar o worker Python que monitoriza o plenário em{' '}
          <a href="https://canal.parlamento.pt/plenario" target="_blank" rel="noopener noreferrer" className="text-parliament-gold underline">
            canal.parlamento.pt/plenario
          </a>
          , transcreve discursos com Whisper, identifica oradores e detecta palavras de enchimento.
        </p>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-10">
        {[
          { icon: Cpu,          label: 'Transcrição',     desc: 'OpenAI Whisper' },
          { icon: Mic,          label: 'Diarização',      desc: 'pyannote.audio' },
          { icon: Code2,        label: 'Face ID',         desc: 'face_recognition' },
          { icon: Database,     label: 'API',             desc: 'Supabase Edge Fn' },
        ].map(({ icon: Icon, label, desc }) => (
          <Card key={label} className="bg-card/60 border-border/60">
            <CardContent className="pt-5">
              <Icon className="h-6 w-6 text-parliament-gold mb-2" />
              <p className="font-semibold text-foreground text-sm">{label}</p>
              <p className="text-xs text-muted-foreground mt-1">{desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Section icon={Terminal} title="1. Instalação">
        <CodeBlock language="bash" code={`git clone https://github.com/parlamento-vivo/ai-worker && cd ai-worker
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt`} />
        <CodeBlock language="requirements.txt" code={`openai-whisper>=20231117      # Transcrição de fala para texto
pyannote.audio>=3.1.1         # Diarização (quem está a falar)
face-recognition>=1.3.0       # Identificação facial do orador
opencv-python>=4.8.0          # Captura de frames do stream
streamlink>=6.7.0             # Captura do stream HLS da ARTV
requests>=2.31.0              # Chamadas à API Supabase
python-dotenv>=1.0.0          # Variáveis de ambiente
schedule>=1.2.0               # Agendamento 10h-17h dias úteis
pydub>=0.25.1                 # Manipulação de áudio
torch>=2.0.0                  # PyTorch (dependência do Whisper/pyannote)`} />
      </Section>

      <Section icon={Key} title="2. Variáveis de Ambiente">
        <CodeBlock language=".env" code={`# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
SPEECH_API_SECRET=your-webhook-secret

# Stream ARTV — Plenário
ARTV_PLENARIO_URL=https://canal.parlamento.pt/plenario
# URL HLS real (obtida ao inspecionar o player):
ARTV_HLS_URL=https://streaming.artv.pt/live/plenario/playlist.m3u8

# Whisper
WHISPER_MODEL=medium        # tiny/base/small/medium/large
WHISPER_LANGUAGE=pt         # Forçar português

# Diarização (pyannote — requer conta HuggingFace)
HF_TOKEN=your-huggingface-token

# Detecção
CHUNK_SECONDS=30            # Processar chunks de 30s
CONFIDENCE_THRESHOLD=0.70   # Confiança mínima para ID do orador`} />
      </Section>

      <Section icon={Cpu} title="3. Pipeline de Análise">
        <p>O worker executa o seguinte pipeline para cada chunk de áudio:</p>
        <CodeBlock language="python (pipeline.py)" code={`import whisper
import torch
from pyannote.audio import Pipeline as DiarizationPipeline
import face_recognition
import requests
import pickle, os
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

# Carregar modelos (uma vez no início)
whisper_model = whisper.load_model(os.getenv('WHISPER_MODEL', 'medium'))
diarization = DiarizationPipeline.from_pretrained(
    "pyannote/speaker-diarization-3.1",
    use_auth_token=os.getenv('HF_TOKEN')
)

with open('face_db.pkl', 'rb') as f:
    face_db = pickle.load(f)  # {'encodings': [...], 'politicians': [...]}

# Catálogo de palavras de enchimento em português
FILLER_WORDS = [
    'portanto', 'então', 'ora', 'pronto', 'bom', 'pois', 'né', 'tipo',
    'digamos', 'ou seja', 'quer dizer', 'obviamente', 'claramente',
    'evidentemente', 'de certa forma', 'de alguma forma', 'em termos de',
    'ao nível de', 'no fundo', 'basicamente', 'concretamente', 'de facto',
    'efetivamente', 'neste contexto', 'na prática', 'no âmbito de',
]

def detect_filler_words(text: str) -> dict[str, int]:
    """Conta ocorrências de palavras de enchimento no texto."""
    import re
    counts = {}
    text_lower = text.lower()
    for word in sorted(FILLER_WORDS, key=len, reverse=True):
        pattern = rf'\\b{re.escape(word)}\\b'
        matches = re.findall(pattern, text_lower)
        if matches:
            counts[word] = len(matches)
    return counts

def transcribe_chunk(audio_path: str) -> dict:
    """Transcreve um chunk de áudio com Whisper."""
    result = whisper_model.transcribe(
        audio_path,
        language=os.getenv('WHISPER_LANGUAGE', 'pt'),
        task='transcribe',
        fp16=torch.cuda.is_available(),
    )
    return result

def diarize_chunk(audio_path: str) -> list[dict]:
    """Identifica quem fala quando no chunk."""
    diarization_result = diarization(audio_path)
    segments = []
    for turn, _, speaker in diarization_result.itertracks(yield_label=True):
        segments.append({
            'speaker': speaker,
            'start': turn.start,
            'end': turn.end,
        })
    return segments

def identify_speaker_by_face(frame) -> dict | None:
    """Identifica orador por reconhecimento facial."""
    rgb = frame[:, :, ::-1]  # BGR → RGB
    locations = face_recognition.face_locations(rgb)
    if not locations:
        return None
    encodings = face_recognition.face_encodings(rgb, locations)
    for enc in encodings:
        matches = face_recognition.compare_faces(
            face_db['encodings'], enc, tolerance=0.5
        )
        if True in matches:
            idx = matches.index(True)
            distances = face_recognition.face_distance(face_db['encodings'], enc)
            confidence = 1 - float(distances[idx])
            return {**face_db['politicians'][idx], 'confidence': confidence}
    return None

def process_chunk(audio_path: str, video_frame, session_id: str, chunk_start: datetime):
    """Pipeline completo de análise de um chunk."""
    # 1. Transcrição
    result = transcribe_chunk(audio_path)
    transcript = result['text'].strip()
    if not transcript:
        return

    words = transcript.split()
    word_count = len(words)

    # 2. Diarização
    segments = diarize_chunk(audio_path)

    # 3. Identificação do orador
    politician = identify_speaker_by_face(video_frame)
    if not politician:
        print(f"Orador não identificado neste chunk")
        return

    # 4. Análise de enchimento
    filler_occurrences = detect_filler_words(transcript)
    filler_count = sum(filler_occurrences.values())

    # 5. Calcular WPM
    duration_seconds = sum(s['end'] - s['start'] for s in segments)
    wpm = round((word_count / duration_seconds) * 60) if duration_seconds > 0 else 0

    # 6. Enviar para API
    send_speech(
        session_id=session_id,
        politician_id=politician['id'],
        started_at=chunk_start.isoformat(),
        transcript=transcript,
        word_count=word_count,
        filler_word_count=filler_count,
        filler_occurrences=filler_occurrences,
        words_per_minute=wpm,
        confidence=politician.get('confidence', 0),
    )

def send_speech(session_id, politician_id, started_at, transcript,
                word_count, filler_word_count, filler_occurrences, words_per_minute, confidence):
    """Envia os dados da intervenção para a API Supabase."""
    response = requests.post(
        f"{os.getenv('SUPABASE_URL')}/functions/v1/receive-speech",
        json={
            'session_id': session_id,
            'politician_id': politician_id,
            'started_at': started_at,
            'transcript': transcript,
            'word_count': word_count,
            'filler_word_count': filler_word_count,
            'filler_occurrences': filler_occurrences,
            'words_per_minute': words_per_minute,
            'confidence': confidence,
            'identified_via': 'face',
        },
        headers={
            'Authorization': f"Bearer {os.getenv('SPEECH_API_SECRET')}",
            'Content-Type': 'application/json',
        },
        timeout=10,
    )
    response.raise_for_status()
    print(f"✓ Intervenção enviada: {politician_id} | {word_count} palavras | {filler_word_count} enchimento ({round(filler_word_count/word_count*100,1)}%)")`} />
      </Section>

      <Section icon={Database} title="4. Captura do Stream ARTV Plenário">
        <p>
          O stream ao vivo está em{' '}
          <a href="https://canal.parlamento.pt/plenario" target="_blank" rel="noopener noreferrer" className="text-parliament-gold underline">
            canal.parlamento.pt/plenario
          </a>
          . Usa o <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-parliament-gold">streamlink</code> para
          extrair o URL HLS e capturar com ffmpeg/OpenCV:
        </p>
        <CodeBlock language="python (capture.py)" code={`import subprocess, cv2, tempfile, os, time
from datetime import datetime

PLENARIO_PAGE = "https://canal.parlamento.pt/plenario"
CHUNK_SECONDS = int(os.getenv('CHUNK_SECONDS', '30'))

def get_stream_url() -> str:
    """Extrai o URL HLS do stream ARTV Plenário via streamlink."""
    result = subprocess.run(
        ['streamlink', '--stream-url', PLENARIO_PAGE, 'best'],
        capture_output=True, text=True, timeout=30
    )
    if result.returncode != 0:
        raise RuntimeError(f"streamlink failed: {result.stderr}")
    return result.stdout.strip()

def record_chunk(stream_url: str, duration: int = CHUNK_SECONDS) -> tuple[str, str]:
    """Grava um chunk de áudio+vídeo para ficheiros temporários."""
    audio_path = tempfile.mktemp(suffix='.wav')
    video_path = tempfile.mktemp(suffix='.mp4')

    subprocess.run([
        'ffmpeg', '-y', '-i', stream_url,
        '-t', str(duration),
        '-vn', '-acodec', 'pcm_s16le', '-ar', '16000', '-ac', '1', audio_path,
        '-an', '-vcodec', 'copy', video_path,
    ], capture_output=True, timeout=duration + 30)

    return audio_path, video_path

def extract_middle_frame(video_path: str):
    """Extrai o frame central do vídeo para reconhecimento facial."""
    cap = cv2.VideoCapture(video_path)
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    cap.set(cv2.CAP_PROP_POS_FRAMES, total // 2)
    ret, frame = cap.read()
    cap.release()
    return frame if ret else None

def run_monitoring_loop(session_id: str):
    """Loop principal de monitorização."""
    print(f"Iniciando monitorização | Session: {session_id}")
    stream_url = get_stream_url()
    print(f"Stream URL: {stream_url}")

    while True:
        chunk_start = datetime.utcnow()
        try:
            audio_path, video_path = record_chunk(stream_url)
            frame = extract_middle_frame(video_path)

            if frame is not None:
                from pipeline import process_chunk
                process_chunk(audio_path, frame, session_id, chunk_start)

        except Exception as e:
            print(f"Erro no chunk: {e}")
        finally:
            for p in [audio_path, video_path]:
                if os.path.exists(p): os.remove(p)

        # Verificar se sessão ainda está em curso
        now = datetime.now()
        if not (now.weekday() < 5 and 10 <= now.hour < 17):
            print("Sessão fora do horário — a parar")
            break`} />
      </Section>

      <Section icon={Cog} title="5. Worker Principal com Agendamento">
        <CodeBlock language="python (main.py)" code={`import schedule, time, requests, os
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

def is_session_hours() -> bool:
    now = datetime.now()
    return now.weekday() < 5 and 10 <= now.hour < 17

def create_or_get_session() -> str:
    """Cria uma sessão no Supabase para hoje."""
    today = datetime.now().strftime('%Y-%m-%d')
    response = requests.post(
        f"{os.getenv('SUPABASE_URL')}/functions/v1/session-manager",
        json={'date': today, 'action': 'get_or_create'},
        headers={'Authorization': f"Bearer {os.getenv('SPEECH_API_SECRET')}"},
    )
    return response.json()['session_id']

def run():
    if not is_session_hours():
        print("Fora do horário de sessão (seg-sex 10h-17h)")
        return
    session_id = create_or_get_session()
    from capture import run_monitoring_loop
    run_monitoring_loop(session_id)

# Iniciar às 10h em dias úteis
schedule.every().day.at("10:00").do(run)

print("Worker agendado. Aguardando próxima sessão...")
while True:
    schedule.run_pending()
    time.sleep(30)`} />
      </Section>

      <Section icon={Database} title="6. API — receive-speech">
        <p>Endpoint Supabase Edge Function que recebe intervenções do worker:</p>
        <CodeBlock language="url" code={`POST https://your-project.supabase.co/functions/v1/receive-speech`} />
        <CodeBlock language="json (body)" code={`{
  "session_id": "uuid-da-sessao",
  "politician_id": "uuid-do-deputado",
  "started_at": "2024-11-20T14:23:00Z",
  "transcript": "Sr. Presidente, portanto o que está em causa...",
  "word_count": 156,
  "filler_word_count": 18,
  "filler_occurrences": { "portanto": 5, "então": 4, "obviamente": 3 },
  "words_per_minute": 142,
  "confidence": 0.89,
  "identified_via": "face"
}`} />
        <CodeBlock language="json (resposta)" code={`{
  "success": true,
  "speech_id": "uuid-da-intervencao",
  "filler_pct": 11.5,
  "politician_name": "André Ventura"
}`} />
      </Section>

      {/* Quick links */}
      <div className="mt-10 p-6 rounded-xl border border-parliament-gold/30 bg-parliament-blue/10">
        <h3 className="font-bold text-foreground mb-3">Links úteis</h3>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'OpenAI Whisper', href: 'https://github.com/openai/whisper' },
            { label: 'pyannote.audio', href: 'https://github.com/pyannote/pyannote-audio' },
            { label: 'face_recognition', href: 'https://github.com/ageitgey/face_recognition' },
            { label: 'Supabase Edge Functions', href: 'https://supabase.com/docs/guides/functions' },
            { label: 'streamlink', href: 'https://streamlink.github.io' },
            { label: 'canal.parlamento.pt/plenario', href: 'https://canal.parlamento.pt/plenario' },
          ].map(({ label, href }) => (
            <a key={label} href={href} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-parliament-gold hover:text-parliament-gold/80 border border-parliament-gold/30 rounded-lg px-3 py-1.5 hover:bg-parliament-gold/10 transition-colors">
              {label}
              <ExternalLink className="h-3 w-3" />
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
