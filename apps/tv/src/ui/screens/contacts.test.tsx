// Modo público (sin puente de WhatsApp): la e2e corre en localhost y siempre tiene puente,
// así que este caso se prueba aquí con Testing Library. woki-os.html:1067 y 1712.
import { act, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { TvConfig } from '../../config';
import { Tv } from '../../tv/tv';
import { TvContext } from '../context';
import { Contacts } from './basic';

const base: TvConfig = {
  local: false,
  equipo: false,
  waUrl: '',
  agenteUrl: '',
  devAgentUrl: '',
  waToken: '',
  emgWs: '',
};

function renderContacts(cfg: TvConfig) {
  const tv = new Tv(cfg);
  render(
    <TvContext.Provider value={tv}>
      <Contacts />
    </TvContext.Provider>,
  );
  return tv;
}

describe('Mensajes sin puente', () => {
  it('avisa que WhatsApp no está configurado y deja Ajustar y Volver', () => {
    renderContacts(base);
    expect(screen.getByText('WhatsApp no está configurado')).toBeInTheDocument();
    expect(screen.getByText('Falta CFG.WA_URL')).toBeInTheDocument();
    expect(screen.getByText('Ajustar')).toBeInTheDocument();
    expect(screen.getAllByText('Volver').length).toBeGreaterThanOrEqual(1);
  });

  it('con puente y sin contactos explica cómo elegirlos', () => {
    renderContacts({ ...base, waUrl: 'http://localhost:8788' });
    expect(screen.getByText('Aún no hay contactos principales')).toBeInTheDocument();
    expect(screen.getByText('El acompañante los elige con la tecla K o con «Ajustar».')).toBeInTheDocument();
  });

  it('sin puente, la doble ceja de Enviar simula el envío', () => {
    const tv = renderContacts(base);
    const send = document.createElement('div');
    send.dataset.act = 'agentSend';
    act(() => {
      tv.set((s) => ({ wa: { ...s.wa, to: { id: 'c1', name: 'Ana Prueba' } } }));
      tv.wa.openAgent('Hola');
    });
    expect(tv.s.screen).toBe('agent');
    expect(tv.s.agent.title).toBe('Escribir a Ana Prueba');
    act(() => tv.onAct(send, { calibrate: false, immediate: true }));
    expect(tv.s.agent.pending).toBe(true);
    act(() => tv.onAct(send, { calibrate: false, immediate: true }));
    expect(tv.s.island.txt).toBe('Enviado (simulado)');
    expect(tv.s.screen).toBe('home');
  });
});
