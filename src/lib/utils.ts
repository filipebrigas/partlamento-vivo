import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const PARTY_COLORS: Record<string, string> = {
  'PS':     '#FF69B4',
  'PSD':    '#FF8C00',
  'CH':     '#1B3A6B',
  'IL':     '#00BFFF',
  'BE':     '#B22222',
  'PCP':    '#CC0000',
  'PAN':    '#228B22',
  'L':      '#8B008B',
  'CDS-PP': '#4169E1',
  'JPP':    '#006400',
}

export const PARTY_FULL_NAMES: Record<string, string> = {
  'PS':     'Partido Socialista',
  'PSD':    'Partido Social Democrata',
  'CH':     'Chega',
  'IL':     'Iniciativa Liberal',
  'BE':     'Bloco de Esquerda',
  'PCP':    'Partido Comunista Português',
  'PAN':    'Pessoas-Animais-Natureza',
  'L':      'Livre',
  'CDS-PP': 'CDS - Partido Popular',
  'JPP':    'Juntos pelo Povo',
}

export function getPartyColor(party: string): string {
  return PARTY_COLORS[party] ?? '#888888'
}

export function formatTimestamp(ts: string): string {
  return new Date(ts).toLocaleString('pt-PT', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('pt-PT', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
}
