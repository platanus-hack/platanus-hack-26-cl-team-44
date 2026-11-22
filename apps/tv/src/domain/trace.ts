// Modo dev (Shift+D): de dónde sale cada tarjeta. Port de software/toki-os/woki-os.html:1378-1392.
import type { Trace } from './phrases';

export function traceText(t: Trace | null | undefined, long = false): string {
  if (!t) return '💻 local de la TV (reglas y plantillas, sin modelo ni memoria)';
  const fu = t.fuentes || [];
  const inv = t.inventadas || [];
  const mem = fu.map((f) => f.id + (f.tipo ? ` ${f.tipo}` : '') + (long && f.texto ? ` «${f.texto}»` : '')).join(' · ');
  const warn = inv.length ? ` ⚠ citó ${inv.join(',')} sin tenerla en su contexto` : '';
  switch (t.origen) {
    case 'agente':
      return (
        (fu.length ? `🧠 ${mem}` : '🤖 modelo, sin memoria') +
        (t.iniciales ? ` · iniciales ${t.iniciales.toUpperCase()}` : '') +
        warn
      );
    case 'regla':
    case 'reglas':
      return '📏 regla fija de respaldo (el modelo no respondió o faltaban opciones)';
    case 'tarjeta':
      return `🗂 tarjeta ${t.de === 'usuario' ? 'propia' : 'del catálogo'} · tema ${t.tema}${t.fuente ? ` · de ${t.fuente}` : ''}${long && t.motivo ? ` · ${t.motivo}` : ''}`;
    case 'respaldo':
      return '🛟 respaldo: claude -p sin memoria (el agente no respondió)';
    case 'whatsapp':
      return '💬 sugerencia del chat (sin traza)';
    case 'local':
      return `💻 ${t.nota || 'local de la TV'}`;
    default:
      return `❔ ${t.origen || 'sin origen'}${warn}`;
  }
}
