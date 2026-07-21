// Identita' del giocatore salvata sul telefono. Nessun login.
// Il player_token riconosce il giocatore dopo un refresh.
// L'host_token e' un segreto separato: ce l'ha solo chi crea la stanza.

const PLAYER_KEY = "fg_player_token";
const hostKey = (code: string) => `fg_host_token_${code.toUpperCase()}`;
const memberKey = (code: string) => `fg_member_${code.toUpperCase()}`;

// Ritorna il player_token esistente o ne genera uno nuovo (persistente).
// Da chiamare solo nel browser.
export function getOrCreatePlayerToken(): string {
  let token = localStorage.getItem(PLAYER_KEY);
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem(PLAYER_KEY, token);
  }
  return token;
}

export function getPlayerToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(PLAYER_KEY);
}

// L'host_token e' legato al codice stanza: una chiave per stanza.
export function saveHostToken(code: string, hostToken: string): void {
  localStorage.setItem(hostKey(code), hostToken);
}

export function getHostToken(code: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(hostKey(code));
}

// Appartenenza a una stanza: salviamo l'id del NOSTRO giocatore (non il token,
// che e' segreto). Serve al link d'invito per capire se sei gia' dentro o se
// devi ancora entrare. Confrontabile con la lista pubblica dei giocatori.
export function saveMembership(code: string, playerId: string): void {
  localStorage.setItem(memberKey(code), playerId);
}

export function getMembership(code: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(memberKey(code));
}
