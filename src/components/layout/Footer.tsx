import { Link } from 'react-router-dom'
import { Smartphone, Github, Twitter } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-background/50 mt-20">
      <div className="container py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-parliament-blue">
                <Smartphone className="h-4 w-4 text-parliament-gold" />
              </div>
              <span className="font-bold">
                <span className="text-foreground">Parlamento</span>
                <span className="text-parliament-gold"> Vivo</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              Inspirado em "The Flemish Scrollers" de Dries Depoorter. Sistema automático de
              deteção de telemóveis durante as sessões da Assembleia da República.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <a
                href="https://x.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-parliament-gold transition-colors"
                aria-label="X/Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-parliament-gold transition-colors"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Plataforma</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/deteções" className="hover:text-parliament-gold transition-colors">Deteções</Link></li>
              <li><Link to="/deputados" className="hover:text-parliament-gold transition-colors">Deputados</Link></li>
              <li><Link to="/estatísticas" className="hover:text-parliament-gold transition-colors">Estatísticas</Link></li>
              <li><Link to="/documentação" className="hover:text-parliament-gold transition-colors">Documentação</Link></li>
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Informação</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href="https://www.parlamento.pt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-parliament-gold transition-colors"
                >
                  Assembleia da República
                </a>
              </li>
              <li>
                <a
                  href="https://artv.pt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-parliament-gold transition-colors"
                >
                  ARTV Livestream
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border/60 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>© 2024 Parlamento Vivo. Projeto de transparência cívica.</p>
          <p>Dados de <a href="https://www.parlamento.pt" className="hover:text-parliament-gold transition-colors" target="_blank" rel="noopener noreferrer">parlamento.pt</a></p>
        </div>
      </div>
    </footer>
  )
}
