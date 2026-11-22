import type { Card } from '../domain/phrases';
import type { MyoView } from '../engines/myoware/client';

export type Screen = 'home' | 'talk' | 'keyboard' | 'reactions' | 'agent' | 'contacts' | 'settings' | 'apps' | 'games';

export const SCREENS: Screen[] = [
  'home',
  'talk',
  'keyboard',
  'reactions',
  'agent',
  'contacts',
  'settings',
  'apps',
  'games',
];

export const SCREEN_TITLES: Record<Screen, string> = {
  home: 'Inicio',
  talk: 'Hablar',
  keyboard: 'Escribir',
  reactions: 'Reacciones',
  agent: 'Mensajes',
  contacts: 'Mensajes',
  settings: 'Ajustes',
  apps: 'Apps',
  games: 'Juegos',
};

export interface Ctx {
  label: string;
  av: string;
  val: string;
  ph: string;
  bg: string;
}

export const CTX0: Ctx = {
  label: 'Sofía dice',
  av: 'S',
  val: '¿Vienes a cenar el domingo?',
  ph: 'El acompañante escribe y aprieta Enter',
  bg: '',
};

export interface WaContact {
  id: string;
  name: string;
  relation?: string;
  phone?: string;
  group?: string;
  mention?: string;
  mentionId?: string;
  respondida?: boolean;
}

export interface WaMsg {
  id: string;
  dir: 'in' | 'out';
  text: string;
  at: number;
  via?: string;
  status?: number;
  msgId?: string;
}

export interface WaState {
  online: boolean;
  session: string | null;
  favs: WaContact[];
  to: WaContact | null;
  hist: Record<string, WaMsg[]>;
  mention: { from: string; group: string; at: number } | null;
}

export interface AlarmView {
  level: 'emergencia' | 'atencion';
  big: string;
  sub: string;
  cancel: string;
  ack: boolean;
  real: boolean;
  dismiss: string;
  fromCareWheel: boolean;
}

export interface KbState {
  level: 1 | 2 | 3;
  group: number;
  text: string;
  mode: 'text' | 'ini';
  ini: string;
  delAt: number;
  delStreak: number;
}

export interface AgentView {
  pending: boolean;
  title: string;
  to: string;
  msg: string;
  av: string;
  bg: string;
}

export interface TvState {
  screen: Screen;
  calibOpen: boolean;
  calibTitle: string;
  calibText: string;
  rest: boolean;
  alarm: AlarmView | null;
  emoRingFor: number | null;
  cards: Card[];
  cardsLoading: boolean;
  aiWait: boolean;
  ctx: Ctx;
  kb: KbState;
  /** Sube cuando cambian datos del teclado que no viven en el estado (predictor, Claude). */
  kbTick: number;
  reactPage: number;
  setPage: 'main' | 'look';
  agent: AgentView;
  theme: 'dark' | 'light';
  palette: string;
  legendOpen: boolean;
  island: { ic: string; txt: string; warn: boolean; on: boolean };
  speaking: { emo: string; txt: string; on: boolean };
  devOpen: boolean;
  devMeta: string;
  gazeLost: boolean;
  dwellMs: number;
  mode: 'click' | 'dwell';
  magnet: boolean;
  jitter: boolean;
  sugMode: 'fila' | 'lista';
  muted: boolean;
  sensIdx: number;
  faceClick: boolean;
  clock: string;
  usuaria: string;
  wa: WaState;
  panelOpen: boolean;
  careOpen: boolean;
  log: string[];
  voiceLabel: string;
  voiceCount: number;
  myowareConfirm: boolean;
  myo: MyoView;
  emgChannels: string[];
  scale: number;
}
