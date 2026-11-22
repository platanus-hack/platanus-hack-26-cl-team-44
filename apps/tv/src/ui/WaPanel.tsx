// Panel del acompañante: elegir hasta 6 contactos principales (mouse y teclado, no mirada).
// woki-os.html:657-681 y 1165-1223.
import { useEffect, useRef, useState } from 'react';
import type { WaContact } from '../tv/types';
import { digitsOf, faceOf, initial } from '../tv/whatsapp';
import { useTv, useTvState } from './context';

interface Picked {
  phone: string;
  name: string;
  relation: string;
}

export function WaPanel() {
  const tv = useTv();
  const open = useTvState((s) => s.panelOpen);
  const [all, setAll] = useState<WaContact[]>([]);
  const [sel, setSel] = useState<Picked[]>([]);
  const [q, setQ] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState(false);
  const [saving, setSaving] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.body.classList.toggle('panel', open);
    if (!open) return;
    let alive = true;
    setQ('');
    setSel([]);
    setAll([]);
    setErr(false);
    setMsg('Trayendo tus contactos de WhatsApp…');
    Promise.all([
      tv.wa.api<{ contacts?: WaContact[] }>('/api/wa/contacts'),
      tv.wa.api<{ contacts?: WaContact[] }>('/api/wa/favorites'),
    ])
      .then(([book, favs]) => {
        if (!alive) return;
        const list = book.contacts || [];
        const has = new Set(list.map((c) => digitsOf(c.phone)));
        const picked = (favs.contacts || [])
          .filter((c) => has.has(digitsOf(c.phone)))
          .map((c) => ({ phone: c.phone || '', name: c.name, relation: c.relation || '' }));
        const dropped = (favs.contacts || []).length - picked.length;
        setAll(list);
        setSel(picked);
        setMsg(
          dropped
            ? `${dropped} contacto${dropped > 1 ? 's' : ''} de prueba no está${dropped > 1 ? 'n' : ''} en tu WhatsApp y se quitará${dropped > 1 ? 'n' : ''} al guardar.`
            : '',
        );
        input.current?.focus();
      })
      .catch((e: Error) => {
        if (!alive) return;
        setMsg(`No pude traer tus contactos: ${e.message}`);
        setErr(true);
      });
    return () => {
      alive = false;
    };
  }, [open, tv]);

  const close = () => tv.wa.closePanel();
  const ql = q.trim().toLowerCase();
  const qd = digitsOf(ql);
  const matches = all.filter(
    (c) => !ql || c.name.toLowerCase().includes(ql) || (qd.length > 2 && digitsOf(c.phone).includes(qd)),
  );
  const shown = matches.slice(0, 80);
  const picked = new Set(sel.map((s) => digitsOf(s.phone)));
  const full = sel.length >= 6;

  const toggle = (c: WaContact) => {
    const d = digitsOf(c.phone);
    const i = sel.findIndex((s) => digitsOf(s.phone) === d);
    if (i >= 0) setSel(sel.filter((_, k) => k !== i));
    else if (sel.length < 6) setSel([...sel, { phone: c.phone || '', name: c.name, relation: '' }]);
  };

  const save = async () => {
    setSaving(true);
    setErr(false);
    setMsg('Guardando…');
    try {
      const j = await tv.wa.api<{ contacts?: WaContact[] }>('/api/wa/favorites', { body: { contacts: sel } });
      const favs = j.contacts || [];
      tv.wa.setFavs(favs);
      close();
      const n = favs.length;
      tv.island(
        '👥',
        `${n} contacto${n === 1 ? '' : 's'} principal${n === 1 ? '' : 'es'} guardado${n === 1 ? '' : 's'}`,
      );
    } catch (e) {
      setMsg(`No se guardó: ${(e as Error).message}`);
      setErr(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={`wap${open ? ' on' : ''}`}
      id="waPanel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wapTitle"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="wap-card">
        <div className="wap-head">
          <div>
            <h2 id="wapTitle">Contactos principales</h2>
            <p>
              Elige hasta 6 personas. Solo se les podrá escribir a ellas y solo verá en la TV los mensajes que ellas
              manden. La relación ayuda a que las frases suenen distinto con cada una.
            </p>
          </div>
          <button type="button" className="wap-x" id="wapClose" aria-label="Cerrar" onClick={close}>
            ✕
          </button>
        </div>
        <div className="wap-body">
          <div className="wap-col">
            <input
              ref={input}
              id="wapQ"
              type="search"
              placeholder="Buscar por nombre o número"
              autoComplete="off"
              aria-label="Buscar por nombre o número"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <div className="wap-list" id="wapList" role="listbox" aria-label="Contactos de WhatsApp">
              {shown.length ? (
                shown.map((c) => {
                  const on = picked.has(digitsOf(c.phone));
                  return (
                    <button
                      type="button"
                      key={c.phone || c.id}
                      className={`wap-row${on ? ' on' : ''}`}
                      role="option"
                      aria-selected={on}
                      disabled={!on && full}
                      onClick={() => toggle(c)}
                    >
                      <span className="av" style={{ background: faceOf(c) }}>
                        {initial(c.name)}
                      </span>
                      <span style={{ minWidth: 0 }}>
                        <span className="nm" style={{ display: 'block' }}>
                          {c.name}
                        </span>
                        <span className="ph" style={{ display: 'block' }}>
                          {c.phone}
                        </span>
                      </span>
                      <span className="ck">{on ? '✓' : ''}</span>
                    </button>
                  );
                })
              ) : all.length ? (
                <div className="wap-note">Nada coincide con la búsqueda.</div>
              ) : null}
            </div>
            <div className="wap-note" id="wapNote">
              {all.length
                ? matches.length > shown.length
                  ? `Mostrando ${shown.length} de ${matches.length}. Escribe para afinar.`
                  : `${matches.length} contacto${matches.length === 1 ? '' : 's'}${full ? ' · ya elegiste 6' : ''}`
                : ''}
            </div>
          </div>
          <div className="wap-col">
            <h3>
              <span>Elegidos</span>
              <span id="wapCount">{sel.length}/6</span>
            </h3>
            <div className="wap-sel" id="wapSel">
              {sel.length ? (
                sel.map((s, i) => (
                  <div className="wap-chip" key={s.phone}>
                    <span
                      style={{
                        gridRow: '1 / span 2',
                        width: 34,
                        height: 34,
                        borderRadius: '50%',
                        display: 'grid',
                        placeItems: 'center',
                        fontSize: 15,
                        fontWeight: 700,
                        color: '#fff',
                        background: faceOf(s),
                      }}
                    >
                      {initial(s.name)}
                    </span>
                    <div className="nm">{s.name}</div>
                    <input
                      value={s.relation}
                      placeholder="Relación: hija, cuidadora…"
                      maxLength={30}
                      aria-label={`Relación con ${s.name}`}
                      onChange={(e) => setSel(sel.map((x, k) => (k === i ? { ...x, relation: e.target.value } : x)))}
                    />
                    <button
                      type="button"
                      className="rm"
                      aria-label={`Quitar a ${s.name}`}
                      onClick={() => setSel(sel.filter((_, k) => k !== i))}
                    >
                      ✕
                    </button>
                  </div>
                ))
              ) : (
                <div className="wap-note">Elige contactos de la lista de la izquierda.</div>
              )}
            </div>
            <div className="wap-foot">
              <button type="button" className="wap-btn pri" id="wapSave" disabled={saving} onClick={save}>
                Guardar
              </button>
              <button type="button" className="wap-btn" id="wapCancel" onClick={close}>
                Cancelar
              </button>
            </div>
            <p id="wapMsg" className={err ? 'err' : ''} role="status">
              {msg}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
