# WOKI · Comunicador manos libres para personas con ELA

<img src="./project-logo.png" alt="WOKI" width="160" />

**Track:** 🔧 Hardware · Platanus Hack 26: Santiago ft. Buk · team-44

WOKI le devuelve la conversación a quien perdió el habla y las manos. La persona apunta con la **nariz** o con la **mirada** usando una webcam común, y confirma con un **clic de ceja** (sensor EMG MyoWare o la cámara). Claude propone 4 respuestas con su estilo, y la voz clonada las dice **con la emoción que ella elige**. Si algo pasa de noche, un combo de gestos avisa a la cuidadora y la alarma sube de nivel hasta que alguien confirma con un llavero RFID.

> Es un prototipo de hackathon. No es un dispositivo médico certificado y solo se probó con personas sanas del equipo.

## Probar el prototipo (2 minutos)

```bash
cd prototipo
python3 -m http.server 8000
# abrir http://localhost:8000/woki-os.html en Chrome, Arc o Safari
```

- **Sin cámara:** elige "Usar mouse (demo)". El mouse es la mirada, `Espacio` es la ceja y `J` la mandíbula.
- **Con la nariz:** "Calibrar con la nariz" (centro, 4 esquinas y prueba).
- **Con la mirada:** "Calibrar con la mirada" (9 puntos más validación). Funciona mejor con la cámara a 50–80 cm de la cara.
- **Emergencia:** ceja ×2 y luego mandíbula. `R` simula el llavero de la cuidadora.
- El panel de abajo (fuera de la "TV") muestra atajos, la LCD y los LEDs simulados, y un registro de eventos.

## Qué hay en este repo

| Carpeta / archivo | Qué es |
|---|---|
| `prototipo/woki-os.html` | **WOKI OS.** Interfaz completa en un solo HTML: inicio, hablar con 4 sugerencias y emociones, teclado por grupos con predicción, reacciones, mensajes con agente, ajustes, alarma, descanso. Puntero con nariz o con mirada (MediaPipe Face Landmarker), calibración y clic con la cara |
| `woki-bridge/` | Puente Node/TypeScript para enviar y recibir **WhatsApp** reales con [wapi](https://github.com/crafter-station/wapi), con una lista cerrada de contactos |
| `raspberry/` | Plan del aparato dedicado: **Raspberry Pi 5 + pantalla SunFounder TS7 Pro de 7"** (especificaciones verificadas y montaje) |
| `GUIA-DISENO.md` | Guía de diseño con números: tamaños para TV, tiempos de mirada, gestos y combos, pantallas, alarmas |
| `PLAN.md` | Plan de construcción de la hackathon |
| `PLAN-ONBOARDING-MEMORIA.md` | Onboarding de contexto y memoria personal (personas, rutinas, estilo, privacidad) |
| `PLAN-WHATSAPP-WAPI.md`, `GUIA-WAPI-*.md` | Cómo funciona y cómo se monta la mensajería por WhatsApp |
| `INFORME.md` · `hallazgos/` | Investigación UX/UI: productos de CAA, papers de HCI sobre mirada, IA, voz y emoción, testimonios de usuarios, alarmas |
| `reports/` · `research_notes/` | Estado del arte de la calibración de eye tracking por webcam |
| `mockups.html` | Mockups estáticos de las pantallas para TV |

## Arquitectura

```
MyoWare ×3 (BLE) ──┐
Webcam ── MediaPipe (nariz / iris) ──▶ WOKI OS (navegador) ──▶ Claude (4 frases + emoción) ──▶ voz (TTS)
                   └── ws://localhost:8765 ◀── sensores           │
                                                                   ├──▶ woki-bridge ──▶ WhatsApp (wapi)
                                                                   └──▶ Arduino / Pi: LCD, LEDs, relé, servo, RFID
```

- **Protocolo de sensores** (WebSocket `:8765`): `{"src":"ceja"|"mandibula","edge":"down"|"up"}` y, opcional, `{"gaze":{"x":px,"y":px}}`.
- **woki-bridge:** `cp profile.example.json profile.json`, crear `.env` (ver `GUIA-WAPI-PASO-A-PASO.md`) y luego `npm install && npm run dev`.
  - **Seguridad:** escucha solo en `127.0.0.1`. Por el túnel solo se expone `/webhook/wapi`, que se autentica con su firma. Rechaza todo `/api/*` que llegue por un túnel, y los POST deben ser JSON desde `ALLOWED_ORIGIN`. Se recomienda definir `WOKI_API_TOKEN` en `.env`; la app lo envía en el encabezado `X-Woki-Token`.

## Por qué así (lo que dice la investigación)

- Ningún producto de CAA revisado ofrece **emoción en la voz** ni **alarma de emergencia** nativa.
- La queja número uno de las personas con ELA es el **ritmo de la conversación**. Por eso WOKI usa frases completas, no letra a letra.
- **Apuntar con la mirada o la cabeza y confirmar con otro canal** evita las selecciones accidentales del dwell.
- A 2 m de una TV el iris casi no se ve en una webcam. Por eso la **nariz** es el canal estable a distancia y la **mirada** se usa con la cámara cerca.

## Seguridad

Los sensores que van sobre el cuerpo son **solo inalámbricos**. Ningún electrodo se conecta por cable a un equipo enchufado a la red sin aislador.

## Equipo

- Juan Ortega ([@juanortega10](https://github.com/juanortega10))
- Jhomar Astuyauri ([@asther0](https://github.com/asther0))
- Nicolas Vargas ([@MrUprizing](https://github.com/MrUprizing))
- Manuel Torres ([@AmunM9](https://github.com/AmunM9))
- Emmy Daniela Arias Pardo ([@estparcae](https://github.com/estparcae))
