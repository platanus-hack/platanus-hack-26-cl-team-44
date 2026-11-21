-- Memoria personal de Toki. Tipos de docs/product/PLAN-ONBOARDING-MEMORIA.md.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS personas (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  relacion TEXT DEFAULT '',
  apodos TEXT DEFAULT '[]',                 -- lista JSON
  tipo_interlocutor TEXT NOT NULL DEFAULT 'desconocido'
    CHECK (tipo_interlocutor IN ('familia', 'medico', 'desconocido')),
  telefono TEXT DEFAULT '',
  trato TEXT DEFAULT 'tú'
);

CREATE TABLE IF NOT EXISTS memorias (
  id INTEGER PRIMARY KEY,
  tipo TEXT NOT NULL CHECK (tipo IN ('perfil', 'lexico', 'estilo', 'episodio', 'rutina')),
  subtipo TEXT DEFAULT '',                  -- perfil: identidad, personalidad, gusto, salud
  texto TEXT NOT NULL,
  personas TEXT DEFAULT '[]',               -- ids de personas, lista JSON
  temas TEXT DEFAULT '[]',                  -- temas explícitos, lista JSON
  privacidad TEXT NOT NULL DEFAULT 'familia'
    CHECK (privacidad IN ('publico', 'familia', 'salud')),
  estado TEXT NOT NULL DEFAULT 'propuesta'
    CHECK (estado IN ('propuesta', 'aprobada', 'rechazada')),
  fecha TEXT DEFAULT '',                    -- episodios: AAAA-MM-DD
  hora TEXT DEFAULT '',                     -- rutinas: HH:MM
  dias TEXT DEFAULT '',                     -- rutinas: lun,mar,...
  fuente TEXT DEFAULT ''                    -- onboarding, cuidador, app
);

-- Límite duro: con esta persona (o este tipo de interlocutor) nunca se toca este tema.
CREATE TABLE IF NOT EXISTS limites (
  id INTEGER PRIMARY KEY,
  persona_id TEXT REFERENCES personas(id),
  tipo_interlocutor TEXT,
  tema TEXT NOT NULL,
  motivo TEXT DEFAULT '',
  CHECK (persona_id IS NOT NULL OR tipo_interlocutor IS NOT NULL)
);

-- Palabras que marcan un tema. Sirven para etiquetar memorias y revisar las opciones del modelo.
CREATE TABLE IF NOT EXISTS temas (
  tema TEXT PRIMARY KEY,
  palabras TEXT NOT NULL DEFAULT '[]'       -- lista JSON, sin tildes y en minúscula
);

-- Datos generales: nombre de la usuaria, etc.
CREATE TABLE IF NOT EXISTS meta (
  clave TEXT PRIMARY KEY,
  valor TEXT NOT NULL
);
