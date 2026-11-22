// Objetivo de mirada: mismo marcado que decorate() de la TV actual (woki-os.html:1250-1252).
// data-t lo marca como elegible; data-act es la acción; el anillo y la insignia «Listo» van al final.
import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';

const Ring = () => (
  <svg className="ring" viewBox="0 0 64 64" aria-hidden="true">
    <circle className="bg" cx="32" cy="32" r="25" />
    <circle className="fg" cx="32" cy="32" r="25" />
  </svg>
);

export interface TargetProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  as?: 'div' | 'button';
  act: string;
  dwell?: number;
  prior?: string;
  /** Texto de la insignia. null = sin insignia. */
  badge?: string | null;
  /** false = sin anillo (botones de navegación de la barra de estado). */
  ring?: boolean;
  /** Índice para la entrada escalonada. */
  i?: number;
  children?: ReactNode;
}

export function Target({
  as = 'div',
  act,
  dwell,
  prior,
  badge = 'Listo · ceja o clic',
  ring = true,
  i,
  className = '',
  style,
  children,
  ...rest
}: TargetProps) {
  const st = i === undefined ? style : ({ ...style, '--i': i } as CSSProperties);
  const props = {
    className: `t ${className}${i === undefined ? '' : ' stag'}`.trim(),
    'data-t': '',
    'data-act': act,
    'data-dwell': dwell,
    'data-prior': prior,
    style: st,
    ...rest,
  };
  const inner = (
    <>
      {children}
      {ring && <Ring />}
      {badge !== null && ring && (
        <span className="badge" aria-hidden="true">
          {badge}
        </span>
      )}
    </>
  );
  return as === 'button' ? (
    <button type="button" {...props}>
      {inner}
    </button>
  ) : (
    <div {...props}>{inner}</div>
  );
}
