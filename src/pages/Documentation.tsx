import { Code2, Terminal, Database, Key, Cpu, Cog, ExternalLink, Copy, CheckCheck } from 'lucide-react'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

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
        <button
          onClick={copy}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? (
            <><CheckCheck className="h-3.5 w-3.5 text-green-400" /> Copiado</>
          ) : (
            <><Copy className="h-3.5 w-3.5" /> Copiar</>
          )}
        </button>
      </div>
      <pre className="p-4 text-sm font-mono text-[#e6edf3] overflow-x-auto scrollbar-hide">
        <code>{code}</code>
      </pre>
    </div>
  )
}

function Section({ icon: Icon, title, children }: {
  icon: React.ElementType
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="mb-12">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-parliament-blue/30 border border-parliament-blue/50 flex items-center justify-center">
          <Icon className="h-4 w-4 text-parliament-gold" />
        </div>
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
      </div>
      <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
        {children}
      </div>
    </div>
  )
}

export function Documentation() {
  return (
    <div className="container py-10 max-w-4xl">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="outline" className="border-parliament-gold/40 text-parliament-gold">
            Documentação Técnica
          </Badge>
          <Badge variant="outline" className="text-muted-foreground">
            v1.0
          </Badge>
        </div>
        <h1 className="text-4xl font-black text-foreground mb-3">
          Guia do AI Worker — Python
        </h1>
        <p className="text-lg text-muted-foreground">
          Como configurar e executar o worker Python que monitoriza o stream ARTV,
          deteta telemóveis, identifica deputados e envia deteções para a plataforma.
        </p>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {[
          { icon: Cpu, label: 'Deteção', desc: 'YOLOv8 para deteção de telemóveis' },
          { icon: Code2, label: 'Reconhecimento', desc: 'face_recognition para identificação' },
          { icon: Database, label: 'Integração', desc: 'API Supabase para envio de resultados' },
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

      <Section icon={Terminal} title="1. Requisitos e Instalação">
        <p>O worker Python requer Python 3.10+ e as seguintes dependências:</p>
        <CodeBlock language="bash" code={`# Clonar o repositório (ou criar os ficheiros manualmente)
git clone https://github.com/parlamento-vivo/ai-worker
cd ai-worker

# Criar ambiente virtual
python -m venv venv
source venv/bin/activate  # Linux/macOS
# venv\\Scripts\\activate  # Windows

# Instalar dependências
pip install -r requirements.txt`} />
        <CodeBlock language="txt (requirements.txt)" code={`ultralytics>=8.0.0       # YOLOv8 para deteção de objetos
face-recognition>=1.3.0  # Reconhecimento facial
opencv-python>=4.8.0     # Processamento de vídeo
requests>=2.31.0         # Chamadas à API Supabase
streamlink>=6.0.0        # Captura do stream ARTV
python-dotenv>=1.0.0     # Variáveis de ambiente
Pillow>=10.0.0           # Manipulação de imagens
schedule>=1.2.0          # Agendamento de tarefas`} />
      </Section>

      <Section icon={Key} title="2. Configuração de Variáveis de Ambiente">
        <p>Crie um ficheiro <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-parliament-gold">.env</code> na raiz do projeto:</p>
        <CodeBlock language=".env" code={`# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
DETECTION_API_SECRET=your-webhook-secret

# Stream ARTV
ARTV_STREAM_URL=https://streaming.artv.pt/live/artv/playlist.m3u8

# Configurações de deteção
FRAME_INTERVAL=30          # Analisar 1 frame a cada N frames
CONFIDENCE_THRESHOLD=0.75  # Confiança mínima para deteção
CLIP_DURATION=5            # Duração do clip em segundos

# Opcionais
DEBUG=false
LOG_LEVEL=INFO`} />
      </Section>

      <Section icon={Cpu} title="3. Estrutura do Worker">
        <p>O worker principal segue este fluxo de execução:</p>
        <CodeBlock language="python (worker.py)" code={`import cv2
import requests
import schedule
import time
from ultralytics import YOLO
import face_recognition
from datetime import datetime
from dotenv import load_dotenv
import os

load_dotenv()

# Carregar modelos
phone_model = YOLO('yolov8n.pt')  # Modelo YOLO pré-treinado
politicians_db = load_politicians_database()  # Da API Supabase

def capture_stream():
    """Captura frames do stream ARTV via streamlink."""
    import subprocess
    cmd = ['streamlink', '--stdout', os.getenv('ARTV_STREAM_URL'), 'best']
    return subprocess.Popen(cmd, stdout=subprocess.PIPE)

def detect_phone_in_frame(frame) -> float:
    """Retorna confiança de deteção de telemóvel (0-1)."""
    results = phone_model(frame, classes=[67])  # classe 67 = telemóvel no COCO
    if results[0].boxes:
        return float(results[0].boxes[0].conf[0])
    return 0.0

def identify_politician(frame, face_locations) -> dict | None:
    """Identifica o deputado usando reconhecimento facial."""
    face_encodings = face_recognition.face_encodings(frame, face_locations)
    for encoding in face_encodings:
        matches = face_recognition.compare_faces(
            politicians_db['encodings'], encoding, tolerance=0.5
        )
        if True in matches:
            idx = matches.index(True)
            return politicians_db['politicians'][idx]
    return None

def process_frame(frame, timestamp: str):
    """Pipeline completo: deteção → identificação → envio."""
    confidence = detect_phone_in_frame(frame)
    threshold = float(os.getenv('CONFIDENCE_THRESHOLD', '0.75'))

    if confidence < threshold:
        return

    # Tentar identificar o deputado
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    face_locations = face_recognition.face_locations(rgb_frame)
    politician = identify_politician(rgb_frame, face_locations)

    if politician:
        send_detection(
            politician_id=politician['id'],
            timestamp=timestamp,
            confidence_score=confidence,
            frame=frame
        )

def send_detection(politician_id, timestamp, confidence_score, frame):
    """Envia a deteção para a API Supabase."""
    screenshot_url = upload_screenshot(frame)

    response = requests.post(
        f"{os.getenv('SUPABASE_URL')}/functions/v1/receive-detection",
        json={
            'politician_id': politician_id,
            'timestamp': timestamp,
            'confidence_score': confidence_score,
            'screenshot_url': screenshot_url,
            'session_date': datetime.now().strftime('%Y-%m-%d'),
        },
        headers={
            'Authorization': f"Bearer {os.getenv('DETECTION_API_SECRET')}",
            'Content-Type': 'application/json',
        }
    )
    response.raise_for_status()
    print(f"Deteção enviada: {politician_id} ({confidence_score:.0%})")

def run_monitoring():
    """Loop principal de monitorização."""
    print("Iniciando monitorização do stream ARTV...")
    stream_process = capture_stream()
    cap = cv2.VideoCapture(f'/proc/{stream_process.pid}/fd/1')
    frame_count = 0
    interval = int(os.getenv('FRAME_INTERVAL', '30'))

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        if frame_count % interval == 0:
            timestamp = datetime.utcnow().isoformat()
            process_frame(frame, timestamp)
        frame_count += 1

def should_run_now() -> bool:
    """Verifica se o parlamento está em sessão (dias úteis 10h-17h)."""
    now = datetime.now()
    is_weekday = now.weekday() < 5
    is_session_hours = 10 <= now.hour < 17
    return is_weekday and is_session_hours

# Agendar monitorização
schedule.every().day.at("10:00").do(lambda: should_run_now() and run_monitoring())

if __name__ == '__main__':
    while True:
        schedule.run_pending()
        time.sleep(60)`} />
      </Section>

      <Section icon={Database} title="4. API Endpoint — receive-detection">
        <p>
          A Edge Function do Supabase que recebe as deteções do worker. Está disponível em:
        </p>
        <CodeBlock language="url" code={`POST https://your-project.supabase.co/functions/v1/receive-detection`} />
        <p>Headers necessários:</p>
        <CodeBlock language="json" code={`{
  "Authorization": "Bearer YOUR_DETECTION_API_SECRET",
  "Content-Type": "application/json"
}`} />
        <p>Body da request:</p>
        <CodeBlock language="json" code={`{
  "politician_id": "uuid-do-deputado",
  "timestamp": "2024-11-15T14:23:00Z",
  "confidence_score": 0.97,
  "screenshot_url": "https://storage.supabase.co/...",
  "video_clip_url": "https://storage.supabase.co/...",
  "session_date": "2024-11-15"
}`} />
        <p>Resposta em caso de sucesso:</p>
        <CodeBlock language="json" code={`{
  "success": true,
  "detection_id": "uuid-da-deteção",
  "tweeted": true,
  "tweet_url": "https://x.com/ParlamentoVivo/status/..."
}`} />
      </Section>

      <Section icon={Cog} title="5. Preparar a Base de Dados de Rostos">
        <p>
          Antes de iniciar o worker, é necessário construir a base de dados de codificações faciais
          dos deputados. Execute o script de setup:
        </p>
        <CodeBlock language="bash" code={`# Descarregar fotos dos deputados da API Supabase
python scripts/download_photos.py

# Gerar codificações faciais e guardar em disco
python scripts/build_face_db.py

# Verificar a base de dados
python scripts/verify_face_db.py --stats`} />
        <CodeBlock language="python (scripts/build_face_db.py)" code={`import face_recognition
import requests
import pickle
import os
from supabase import create_client

supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_KEY'))

def build_database():
    politicians = supabase.table('politicians').select('*').execute().data
    encodings = []
    meta = []

    for pol in politicians:
        if not pol['photo_url']:
            continue
        try:
            img = face_recognition.load_image_file(
                requests.get(pol['photo_url'], stream=True).raw
            )
            enc = face_recognition.face_encodings(img)
            if enc:
                encodings.append(enc[0])
                meta.append(pol)
                print(f"OK: {pol['name']}")
        except Exception as e:
            print(f"ERRO {pol['name']}: {e}")

    with open('face_db.pkl', 'wb') as f:
        pickle.dump({'encodings': encodings, 'politicians': meta}, f)

    print(f"Base de dados criada: {len(encodings)} deputados")

build_database()`} />
      </Section>

      {/* Quick links */}
      <div className="mt-10 p-6 rounded-xl border border-parliament-gold/30 bg-parliament-blue/10">
        <h3 className="font-bold text-foreground mb-3">Links úteis</h3>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'YOLOv8 Docs', href: 'https://docs.ultralytics.com' },
            { label: 'face_recognition', href: 'https://github.com/ageitgey/face_recognition' },
            { label: 'Supabase Edge Functions', href: 'https://supabase.com/docs/guides/functions' },
            { label: 'ARTV Stream', href: 'https://artv.pt' },
            { label: 'parlamento.pt', href: 'https://www.parlamento.pt' },
          ].map(({ label, href }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-parliament-gold hover:text-parliament-gold/80 border border-parliament-gold/30 rounded-lg px-3 py-1.5 hover:bg-parliament-gold/10 transition-colors"
            >
              {label}
              <ExternalLink className="h-3 w-3" />
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
