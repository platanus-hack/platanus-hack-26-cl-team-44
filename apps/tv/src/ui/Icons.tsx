// Íconos en trazo de 24×24. Copia de woki-os.html:448-463 y os-juegos-servicios.js:41-43.
export function Icons() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        <symbol id="i-chat" viewBox="0 0 24 24">
          <path d="M21 12a8.5 8.5 0 0 1-12.3 7.6L3.5 21l1.4-4.9A8.5 8.5 0 1 1 21 12z" />
        </symbol>
        <symbol id="i-keys" viewBox="0 0 24 24">
          <rect x="2.5" y="6" width="19" height="12" rx="3" />
          <path d="M6.5 10h.01M10 10h.01M14 10h.01M17.5 10h.01M7.5 14h9" />
        </symbol>
        <symbol id="i-smile" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" />
          <path d="M8 14.2s1.5 2.3 4 2.3 4-2.3 4-2.3M9 9.5h.01M15 9.5h.01" />
        </symbol>
        <symbol id="i-bell" viewBox="0 0 24 24">
          <path d="M6 16.5V11a6 6 0 1 1 12 0v5.5l1.6 2H4.4z" />
          <path d="M10 21a2.2 2.2 0 0 0 4 0" />
        </symbol>
        <symbol id="i-send" viewBox="0 0 24 24">
          <path d="M21 3 10.5 13.5" />
          <path d="M21 3l-6.5 18-4-7.5L3 9.5z" />
        </symbol>
        <symbol id="i-moon" viewBox="0 0 24 24">
          <path d="M20 14.6A8.2 8.2 0 1 1 9.4 4a6.6 6.6 0 0 0 10.6 10.6z" />
        </symbol>
        <symbol id="i-home" viewBox="0 0 24 24">
          <path d="M3.5 11.2 12 4l8.5 7.2" />
          <path d="M6 9.4V20h4.4v-5.6h3.2V20H18V9.4" />
        </symbol>
        <symbol id="i-gear" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="3.2" />
          <path d="M12 2.8v2.4M12 18.8v2.4M21.2 12h-2.4M5.2 12H2.8M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7M18.5 18.5l-1.7-1.7M7.2 7.2 5.5 5.5" />
        </symbol>
        <symbol id="i-check" viewBox="0 0 24 24">
          <path d="M4.5 12.5l5 5 10-11" />
        </symbol>
        <symbol id="i-x" viewBox="0 0 24 24">
          <path d="M6 6l12 12M18 6 6 18" />
        </symbol>
        <symbol id="i-back" viewBox="0 0 24 24">
          <path d="M10 6l-6 6 6 6M4.5 12H20" />
        </symbol>
        <symbol id="i-alert" viewBox="0 0 24 24">
          <path d="M12 8v5M12 16.5h.01" />
          <circle cx="12" cy="12" r="9.5" />
        </symbol>
        <symbol id="i-gamepad" viewBox="0 0 24 24">
          <path d="M7 7.5h10a4.5 4.5 0 0 1 4.4 5.4l-.8 4a2.6 2.6 0 0 1-4.5 1.2L14.5 16h-5l-1.6 2.1a2.6 2.6 0 0 1-4.5-1.2l-.8-4A4.5 4.5 0 0 1 7 7.5z" />
          <path d="M8 10.5v3M6.5 12h3M15.5 11h.01M17.5 13h.01" />
        </symbol>
        <symbol id="i-apps" viewBox="0 0 24 24">
          <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
          <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
          <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
          <rect x="13.5" y="13.5" width="7" height="7" rx="2" />
        </symbol>
      </defs>
    </svg>
  );
}

export const Use = ({ id }: { id: string }) => (
  <svg aria-hidden="true">
    <use href={`#${id}`} />
  </svg>
);
