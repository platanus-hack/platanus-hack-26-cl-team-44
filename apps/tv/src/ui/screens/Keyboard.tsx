// Escribir: grupos de letras, fila fija de sugerencias, Borrar que acelera y teclado por iniciales.
// woki-os.html:1460-1568.
import type { ReactNode } from 'react';
import { showWord } from '../../domain/keyboard';
import { GROUPS } from '../../domain/phrases';
import { normalize } from '../../engines/predict/predict';
import { SUG_MORE, SUG_ROW } from '../../tv/tv';
import { useTv, useTvState } from '../context';
import { ScreenSection } from '../Screen';
import { Target } from '../Target';

function DelLabel({ streak }: { streak: boolean }) {
  return streak ? (
    <>
      Borrar palabra<small>sigue mirando: otra</small>
    </>
  ) : (
    <>
      Borrar<small>sigue mirando: palabra</small>
    </>
  );
}

export function Keyboard() {
  const tv = useTv();
  const kb = useTvState((s) => s.kb);
  const sugMode = useTvState((s) => s.sugMode);
  useTvState((s) => s.kbTick); // predictor cargado, respuesta de Claude o fin de la racha de Borrar
  const ini = kb.mode === 'ini';
  const list = ini ? [] : tv.sugs();
  const streak = tv.delStreakActive();
  let keys: ReactNode[] = [];
  let rows: ReactNode = null;
  const k = (key: string, node: ReactNode) => ({ key, node });

  const completar = () => {
    const best = kb.ini ? tv.wa.iniCandidates()[0] : null;
    return best ? (
      <Target key="expand" act="kb:expand" className="key small act best completar">
        ✨ Completar<small>{best.text}</small>
      </Target>
    ) : (
      <Target key="expand" act="kb:expand" className="key small act completar">
        ✨ Completar<small>elige letras primero</small>
      </Target>
    );
  };

  if (ini && kb.level === 1) {
    const likely = tv.wa.likelyGroups();
    keys = [
      ...GROUPS.map((g, i) => (
        <Target
          key={g}
          act={`grp:${i}`}
          className={`key${likely[i].likely ? ' likely' : ''}`}
          prior={likely[i].prior}
          i={i}
        >
          {g}
        </Target>
      )),
      <Target key="del" act="kb:del" className="key small act" i={5}>
        Borrar
      </Target>,
      completar(),
      <Target key="exit" act="kb:exit" className="key small act" i={7}>
        Volver
      </Target>,
    ];
  } else if (kb.level === 3) {
    const from = sugMode === 'fila' ? SUG_ROW : 0;
    const more = list.slice(from, from + SUG_MORE);
    keys = more.map((sg, i) => (
      <Target key={`sug${i + from}`} act={`sug:${i + from}`} className="key sug" i={i}>
        {showWord(sg.word)}
      </Target>
    ));
    for (let i = more.length; i < SUG_MORE; i++) keys.push(<div key={`e${i}`} />);
    keys.push(
      <Target key="back" act="kb:back" className="key small act" i={7}>
        Volver
      </Target>,
    );
  } else if (kb.level === 1 && sugMode === 'lista') {
    keys = [
      ...GROUPS.map((g, i) => (
        <Target key={g} act={`grp:${i}`} className="key" i={i}>
          {g}
        </Target>
      )),
      list.length ? (
        <Target key="sug" act="kb:sug" className="key pred" i={5}>
          Sugerencias
          <small>
            {list
              .slice(0, 2)
              .map((x) => showWord(x.word))
              .join(' · ')}
            {list.length > 2 ? ' · …' : ''}
          </small>
        </Target>
      ) : (
        <div key="sug" className="key pred ghost">
          Sin sugerencias
        </div>
      ),
      <Target key="space" act="kb:space" className="key small act" i={6}>
        Espacio
      </Target>,
      <Target key="del" act="kb:del" className="key small act" i={7}>
        <DelLabel streak={streak} />
      </Target>,
      <Target key="say" act="kb:say" className="key small act" i={8}>
        Decir
      </Target>,
      <Target key="home" act="go:home" className="key small act" i={9}>
        Volver
      </Target>,
    ];
  } else if (kb.level === 1) {
    // Fila fija: las 3 mejores a 1 mirada, siempre en el mismo lugar, y «Más ▸» con el resto.
    const top = list.slice(0, SUG_ROW);
    const r1: ReturnType<typeof k>[] = top.map((sg, i) =>
      k(
        `sug${i}`,
        <Target key={`sug${i}`} act={`sug:${i}`} className={`key sug row-sug${i === 0 ? ' best' : ''}`} i={i}>
          {showWord(sg.word)}
        </Target>,
      ),
    );
    for (let i = top.length; i < SUG_ROW; i++)
      r1.push(
        k(
          `g${i}`,
          <div key={`g${i}`} className="key sug row-sug ghost">
            {i === 0 && !list.length ? 'Sin sugerencias' : ''}
          </div>,
        ),
      );
    r1.push(
      k(
        'more',
        list.length > SUG_ROW ? (
          <Target key="more" act="kb:sug" className="key small act row-sug" i={3}>
            Más ▸<small>{list.length - SUG_ROW} más</small>
          </Target>
        ) : (
          <div key="more" className="key small row-sug ghost">
            Más ▸
          </div>
        ),
      ),
    );
    rows = (
      <>
        <div className="kbrow c4">{r1.map((x) => x.node)}</div>
        <div className="kbrow c5">
          {GROUPS.map((g, i) => (
            <Target key={g} act={`grp:${i}`} className="key row-grp" i={4 + i}>
              {g}
            </Target>
          ))}
        </div>
        <div className="kbrow c4">
          <Target act="kb:space" className="key small act row-act" i={9}>
            Espacio
          </Target>
          <Target act="kb:del" className="key small act row-act" i={10}>
            <DelLabel streak={streak} />
          </Target>
          <Target act="kb:say" className="key small act row-act" i={11}>
            Decir
          </Target>
          <Target act="go:home" className="key small act row-act" i={12}>
            Volver
          </Target>
        </div>
      </>
    );
  } else {
    const letters = GROUPS[kb.group].split('');
    keys = letters.map((ch, i) => (
      <Target key={ch} act={`chr:${ch}`} className="key" i={i}>
        {ch}
      </Target>
    ));
    const extra = ini && kb.ini && letters.length < 7;
    if (extra) keys.push(completar());
    for (let i = letters.length + (extra ? 1 : 0); i < 7; i++) keys.push(<div key={`e${i}`} />);
    keys.push(
      <Target key="back" act="kb:back" className="key small act" i={7}>
        Volver
      </Target>,
    );
  }

  const gridClass = ini || kb.level !== 1 ? 'grid4x2' : sugMode === 'fila' ? 'kbrows' : 'grid5x2';
  return (
    <>
      <KbText list={list.map((s) => s.word)} />
      <div className={gridClass} id="keys">
        {rows ?? keys}
      </div>
      <div className="hint" id="kbHint">
        {ini ? (
          <>
            <span>
              <b>Ceja</b> elegir letra
            </span>
            <span>
              <b>Completar</b> frases con Claude
            </span>
            <span>
              <b>Volver</b> regresar al chat
            </span>
          </>
        ) : (
          <span>
            <b>Ceja</b> elegir
          </span>
        )}
      </div>
    </>
  );
}

/** Línea de texto y predicción. woki-os.html:1518-1568 */
function KbText({ list }: { list: string[] }) {
  const tv = useTv();
  const kb = useTvState((s) => s.kb);
  if (kb.mode === 'ini') {
    const letters = [...kb.ini].map((c) => c.toUpperCase());
    const cand = tv.wa.iniCandidates().slice(0, 3);
    const waiting = tv.wa.iniWaiting();
    return (
      <div className="msgline glass">
        <div className="txt" id="kbTxt">
          {letters.length ? (
            <span className="ini-letters">
              {letters.map((l, i) => (
                <span key={`${l}${i}`}>
                  {i > 0 && <span className="dotsep">·</span>}
                  {l}
                </span>
              ))}
            </span>
          ) : (
            <span className="ini-hint">Primera letra de cada palabra</span>
          )}
          <span className="caret" />
        </div>
        <div className="pred" id="kbPred">
          {cand.length ? (
            <>
              Podría ser:{' '}
              {cand.map((c, i) => (
                <span key={c.text}>
                  {i > 0 && ' · '}
                  {c.ai && <span className="ai">✨</span>}
                  {i === 0 ? <b>{c.text}</b> : c.text}
                </span>
              ))}
              {waiting && <span className="ai-wait"> · ✨ Claude pensando…</span>} · mira <b>✨ Completar</b> para
              elegir una
            </>
          ) : (
            'Ejemplo: S · M · P · B → «Sí, me parece bien»'
          )}
        </div>
      </div>
    );
  }
  const w = kb.text.match(/([^\s]*)$/)?.[1] ?? '';
  const ghost = list[0] && w && normalize(list[0]).startsWith(normalize(w)) ? list[0].slice(w.length) : '';
  const how = 'confirma con la ceja o haz clic';
  return (
    <div className="msgline glass">
      <div className="txt" id="kbTxt">
        {kb.text}
        <span className="caret" />
        {ghost && <span className="ghost">{ghost}</span>}
      </div>
      <div className="pred" id="kbPred">
        {kb.level === 3
          ? 'Elige una palabra'
          : list.length
            ? `Sugerencias: ${list.slice(0, 4).map(showWord).join(' · ')} — ${how}`
            : 'Elige un grupo de letras'}
      </div>
    </div>
  );
}

export function KeyboardScreen() {
  const level = useTvState((s) => s.kb.level);
  const sugMode = useTvState((s) => s.sugMode);
  // data-level y data-sug van en la sección: layout.css los usa para la fila fija.
  return (
    <ScreenSection id="keyboard" attrs={{ 'data-level': String(level), 'data-sug': sugMode }}>
      <Keyboard />
    </ScreenSection>
  );
}
