-- Un solo cajón clave → valor (JSON): sesiones, retos de inicio de sesión y avisos.
CREATE TABLE IF NOT EXISTS cajon (
  clave TEXT PRIMARY KEY,
  valor TEXT NOT NULL,
  ts INTEGER NOT NULL
);
