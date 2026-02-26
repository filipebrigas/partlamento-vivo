import { Link } from 'react-router-dom'
import { Mic, Github, Radio } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-background/50 mt-20">
      <div className="container py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-parliament-blue">
                <Mic className="h-4 w-4 text-parliament-gold" />
              </div>
              <span className="font-bold">
                <span className="text-foreground">Parlamento</span>
                <span className="text-parliament-gold"> em Análise</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              Análise automática de discurso parlamentar — quem fala, por quanto tempo,
              e quantas palavras de enchimento usam. Stream em{' '}
              <a href="https://canal.parlamento.pt/plenario" target="_blank" rel="noopener noreferrer"
                className="text-parliament-gold hover:underline">
                canal.parlamento.pt/plenario
              </a>.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <a href="https://canal.parlamento.pt/plenario" target="_blank" rel="noopener noreferrer"
                className="text-muted-foreground hover:text-parliament-gold transition-colors" aria-label="ARTV Plenário">
                <Radio className="h-5 w-5" />
              </a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer"
                className="text-muted-foreground hover:text-parliament-gold transition-colors" aria-label="GitHub">
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Platform links */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Plataforma</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/ao-vivo" className="hover:text-parliament-gold transition-colors">Ao Vivo</Link></li>
              <li><Link to="/discursos" className="hover:text-parliament-gold transition-colors">Discursos</Link></li>
              <li><Link to="/palavras-de-enchimento" className="hover:text-parliament-gold transition-colors">Enchimento</Link></li>
              <li><Link to="/participação" className="hover:text-parliament-gold transition-colors">Participação</Link></li>
              <li><Link to="/comparar" className="hover:text-parliament-gold transition-colors">Comparar</Link></li>
              <li><Link to="/estatísticas" className="hover:text-parliament-gold transition-colors">Estatísticas</Link></li>
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Recursos</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/documentação" className="hover:text-parliament-gold transition-colors">Documentação</Link></li>
              <li><a href="https://canal.parlamento.pt/plenario" target="_blank" rel="noopener noreferrer" className="hover:text-parliament-gold transition-colors">ARTV Plenário</a></li>
              <li><a href="https://www.parlamento.pt" target="_blank" rel="noopener noreferrer" className="hover:text-parliament-gold transition-colors">parlamento.pt</a></li>
              <li><a href="https://github.com/openai/whisper" target="_blank" rel="noopener noreferrer" className="hover:text-parliament-gold transition-colors">OpenAI Whisper</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border/60 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>© 2024 Parlamento em Análise. Projeto de transparência cívica.</p>
          <p>Dados de <a href="https://www.parlamento.pt" className="hover:text-parliament-gold transition-colors" target="_blank" rel="noopener noreferrer">parlamento.pt</a> · Stream via <a href="https://canal.parlamento.pt/plenario" className="hover:text-parliament-gold transition-colors" target="_blank" rel="noopener noreferrer">ARTV Plenário</a></p>
        </div>
      </div>
    </footer>
  )
}
