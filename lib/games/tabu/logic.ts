import { pick } from "../shared/rng";

// TABÙ A TEMPO
// A turno, un giocatore descrive parole senza dirle; gli altri indovinano a
// voce. Ogni parola indovinata vale un punto per chi descrive. Poi si passa.
// Non c'e' un "round" condiviso: la logica utile qui e' l'estrazione parole.

export const TURN_SECONDS = 60;

export const PAROLE: readonly string[] = [
  "Ombrello", "Semaforo", "Cactus", "Pinguino", "Spaghetti", "Terremoto",
  "Astronauta", "Vulcano", "Biblioteca", "Aspirapolvere", "Girasole", "Tromba",
  "Piramide", "Scoiattolo", "Frigorifero", "Arcobaleno", "Balena", "Chitarra",
  "Montagna", "Robot", "Meduse", "Bussola", "Zaino", "Fontana",
  "Fulmine", "Formaggio", "Elicottero", "Tartaruga", "Cascata", "Lampadina",
  "Scacchi", "Deserto", "Origami", "Faro", "Mongolfiera", "Domino",
  "Girandola", "Bulldozer", "Cameleonte", "Trampolino",
];

export function pescaParola(escludi?: string): string {
  let p = pick(PAROLE);
  // evita di ripescare subito la stessa
  while (PAROLE.length > 1 && p === escludi) p = pick(PAROLE);
  return p;
}
