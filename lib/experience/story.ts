import type { RolloutStatus } from "./scene-state";
import type { Heading } from "@/design-system/demo/project-story";

type NodeCopy = { name: string; sub: string; analogy: string };

export interface BanderaStory {
  name: string;
  oneLiner: string;
  chips: string[];
  analogy: { heading: Heading; paragraphs: string[]; dictionaryLabel: string; dictionary: { term: string; means: string }[] };
  why: { title: string; text: string };
  tryIt: { heading: Heading; lead: string; question: (quality: number) => string; yes: string; no: string; qualityLabel: string; quality: (quality: number) => string; note: string; simulate: string; cancel: string; reset: string; error: string; idle: string };
  compare: { heading: Heading; lead: string; on: string; off: string; worse: string; sentence: (withGuard: number, withoutGuard: number) => string };
  fit: { heading: Heading; worthLabel: string; worth: string; notLabel: string; not: string };
  proves: { heading: Heading; text: string };
  engineers: { summary: string; points: string[]; repoLabel: string };
  scene: { title: string; caption: string; statusLabels: { active: string; danger: string; success: string; off: string }; tapeLabel: string; nodes: { users: NodeCopy; flag: NodeCopy; current: NodeCopy; next: NodeCopy }; tape: { served: string; rerouted: string; lost: string }; reached: (s: RolloutStatus) => string };
}

/** The current version scores 0.72. Recruiters see a word, never the raw score. */
const BASELINE = 0.72;
function band(q: number): 0 | 1 | 2 | 3 | 4 {
  const d = q - BASELINE;
  if (d < -0.03) return 0;
  if (d < -0.005) return 1;
  if (d <= 0.005) return 2;
  if (d <= 0.03) return 3;
  return 4;
}
const WORDS_EN = ["clearly worse than the current one", "a little worse than the current one", "as good as the current one", "a little better than the current one", "clearly better than the current one"];
const WORDS_ES = ["claramente peor que la actual", "un poco peor que la actual", "igual de buena que la actual", "un poco mejor que la actual", "claramente mejor que la actual"];

export const STORY: Record<"en" | "es", BanderaStory> = {
  en: {
    name: "Bandera",
    oneLiner: "Releases a new version to a few users and switches it off on its own if it gets worse.",
    chips: ["Gradual rollout", "2 min", "Live demo"],
    analogy: {
      heading: { before: "The", accent: "analogy" },
      paragraphs: [
        "You open a new restaurant and, before filling the room, you serve the new menu at a few tables. If those tables don't like it, you bring them back to the usual menu and the rest of the room never notices.",
        "Bandera releases a new version the same way: to 10% of users, then 25%, 50% and everyone. At each step it compares the new version with the current one and decides whether to keep going, wait or switch it off.",
      ],
      dictionaryLabel: "In the diagram below",
      dictionary: [
        { term: "the tables", means: "the users" },
        { term: "the new menu", means: "the new version" },
        { term: "the first few tables", means: "one stage of the rollout" },
        { term: "back to the usual menu", means: "the automatic switch-off" },
      ],
    },
    why: { title: "Why I built it", text: "" },
    tryIt: {
      heading: { before: "Try", accent: "it" },
      lead: "A store changes how it recommends products. The new version goes out in four steps, and each step measures 24 users against the current version.",
      question: (q) => `Before you run it, place a bet: if the new version is ${WORDS_EN[band(q)]}, does it reach 100% of users?`,
      yes: "Yes, it reaches everyone",
      no: "No, it stops before",
      qualityLabel: "How good the new version is",
      quality: (q) => WORDS_EN[band(q)],
      note: "Each block of 24 squares is one stage (10%, 25%, 50%, 100%) and each square is a user measured at that stage. Blue squares stayed on the current version because the rollout stopped.",
      simulate: "Run it",
      cancel: "Cancel",
      reset: "Start over",
      error: "The rollout could not be simulated. Try another quality.",
      idle: "Place your bet and press Run it.",
    },
    compare: {
      heading: { before: "With", accent: "or without", after: "the guard" },
      lead: "Same new version, same users. The only change is whether the rollout can stop itself.",
      on: "With the guard",
      off: "Without the guard",
      worse: "users with a worse experience",
      sentence: (g, w) => {
        if (g === 0 && w === 0) return "Nobody had a worse experience, with or without the guard.";
        if (g === w) return `With or without the guard, ${g === 1 ? "one user" : `${g} users`} had a worse experience.`;
        if (g > w) return `This time the guard didn't help: ${g} with it, ${w} without it.`;
        return `With the guard, ${g === 1 ? "one user" : `${g} users`} had a worse experience. Without it, ${w}.`;
      },
    },
    fit: {
      heading: { before: "Where it", accent: "fits" },
      worthLabel: "Worth it",
      worth: "For a change that touches every user, like a new checkout or a new sign-up flow. I picture the Monday a store changes its payment page and nobody wants to find out from the sales report.",
      notLabel: "Not needed",
      not: "For an internal tool that five people use and that you can roll back in a minute.",
    },
    proves: {
      heading: { before: "What it", accent: "proves" },
      text: "I designed the exit before the entrance: how bad it has to be to switch itself off, and how many users go through it in the meantime. A version as good as the current one still stops at 10%, because the evidence isn't there yet.",
    },
    engineers: {
      summary: "For engineers",
      points: [
        "Each stage compares 24 baseline and 24 variant scores with a Welch t-test at alpha 0.05.",
        "Non-inferiority margin of 0.02: advance when the confidence interval's lower bound is at or above -0.02, switch off when the whole interval is below it, hold otherwise.",
        "Deterministic seeded samples; the same decisions and per-user outcomes in TypeScript and Python, pinned by a shared fixture.",
        "Stack: Next.js 16, TypeScript, Python, Vitest, pytest.",
      ],
      repoLabel: "Source code",
    },
    scene: {
      title: "How far the new version got",
      caption: "Watch each stage open to more users, and see where the rollout keeps going, waits or switches off.",
      statusLabels: { active: "deciding", success: "serving users", danger: "switched off", off: "on hold" },
      tapeLabel: "Users measured at each stage, 24 per stage",
      nodes: {
        users: { name: "Users", sub: "4 stages", analogy: "the tables" },
        flag: { name: "Bandera", sub: "advance or stop", analogy: "the maître d'" },
        current: { name: "Current version", sub: "stays as is", analogy: "the usual menu" },
        next: { name: "New version", sub: "being tested", analogy: "the new menu" },
      },
      tape: { served: "good experience", rerouted: "stayed on the current version", lost: "worse experience" },
      reached: ({ approved, stoppedAt, killed }) =>
        killed ? `Switched off at ${stoppedAt}% of users`
        : stoppedAt !== null ? (approved > 0 ? `Approved up to ${approved}%, paused at ${stoppedAt}%` : `Paused at ${stoppedAt}% of users`)
        : approved > 0 ? (approved === 100 ? "Reached 100% of users" : `Approved up to ${approved}% so far`) : "Waiting for the first group",
    },
  },
  es: {
    name: "Bandera",
    oneLiner: "Lanza una versión nueva a pocos usuarios y la apaga sola si empeora.",
    chips: ["Lanzamiento gradual", "2 min", "Demo en vivo"],
    analogy: {
      heading: { before: "La", accent: "analogía" },
      paragraphs: [
        "Abres un restaurante nuevo y, antes de llenar el salón, sirves el menú nuevo en unas pocas mesas. Si a esas mesas no les gusta, las regresas al menú de siempre y el resto del salón ni se entera.",
        "Bandera lanza una versión nueva igual: al 10% de los usuarios, luego al 25%, al 50% y a todos. En cada paso compara la versión nueva con la actual y decide si sigue, espera o la apaga.",
      ],
      dictionaryLabel: "En el diagrama de abajo",
      dictionary: [
        { term: "las mesas", means: "los usuarios" },
        { term: "el menú nuevo", means: "la versión nueva" },
        { term: "las primeras mesas", means: "una etapa del lanzamiento" },
        { term: "regresar al menú de siempre", means: "el apagado automático" },
      ],
    },
    why: { title: "Por qué lo hice", text: "" },
    tryIt: {
      heading: { accent: "Pruébalo" },
      lead: "Una tienda cambia cómo recomienda productos. La versión nueva sale en cuatro pasos, y en cada paso se mide a 24 usuarios contra la versión actual.",
      question: (q) => `Antes de correrlo, apuesta: si la versión nueva es ${WORDS_ES[band(q)]}, ¿llega al 100% de los usuarios?`,
      yes: "Sí, llega a todos",
      no: "No, se detiene antes",
      qualityLabel: "Qué tan buena es la versión nueva",
      quality: (q) => WORDS_ES[band(q)],
      note: "Cada bloque de 24 cuadritos es una etapa (10%, 25%, 50%, 100%) y cada cuadrito es un usuario medido en esa etapa. Los azules se quedaron en la versión actual porque el lanzamiento se detuvo.",
      simulate: "Correr",
      cancel: "Cancelar",
      reset: "Empezar de nuevo",
      error: "No se pudo simular el lanzamiento. Prueba otra calidad.",
      idle: "Haz tu apuesta y presiona Correr.",
    },
    compare: {
      heading: { before: "Con", accent: "o sin", after: "guardia" },
      lead: "La misma versión nueva y los mismos usuarios. Solo cambia si el lanzamiento se puede detener solo.",
      on: "Con la guardia",
      off: "Sin la guardia",
      worse: "usuarios con una peor experiencia",
      sentence: (g, w) => {
        if (g === 0 && w === 0) return "Nadie tuvo una peor experiencia, con o sin guardia.";
        if (g === w) return `Con o sin guardia, ${g === 1 ? "un usuario tuvo" : `${g} usuarios tuvieron`} una peor experiencia.`;
        if (g > w) return `Esta vez la guardia no ayudó: ${g} con ella, ${w} sin ella.`;
        return `Con la guardia, ${g === 1 ? "un usuario tuvo" : `${g} usuarios tuvieron`} una peor experiencia. Sin ella, ${w}.`;
      },
    },
    fit: {
      heading: { before: "¿Dónde", accent: "sirve?" },
      worthLabel: "Vale la pena",
      worth: "Para un cambio que toca a todos los usuarios, como un pago nuevo o un registro nuevo. Me imagino el lunes en que una tienda cambia su página de pago y nadie quiere enterarse por el reporte de ventas.",
      notLabel: "No hace falta",
      not: "Para una herramienta interna que usan cinco personas y que puedes regresar en un minuto.",
    },
    proves: {
      heading: { before: "Lo que", accent: "demuestra" },
      text: "Diseñé la salida antes que la entrada: qué tan malo tiene que ser para apagarse solo, y cuántos usuarios pasan por ahí mientras tanto. Una versión igual de buena que la actual se detiene en el 10%, porque todavía no hay evidencia suficiente.",
    },
    engineers: {
      summary: "Para ingenieros",
      points: [
        "Cada etapa compara 24 puntuaciones de la versión actual y 24 de la nueva con una prueba t de Welch con alfa 0.05.",
        "Margen de no inferioridad de 0.02: avanza cuando el límite inferior del intervalo de confianza es -0.02 o más, se apaga cuando todo el intervalo queda por debajo y espera en los demás casos.",
        "Muestras deterministas con semilla; las mismas decisiones y resultados por usuario en TypeScript y Python, fijados por un fixture compartido.",
        "Stack: Next.js 16, TypeScript, Python, Vitest, pytest.",
      ],
      repoLabel: "Código fuente",
    },
    scene: {
      title: "Hasta dónde llegó la versión nueva",
      caption: "Mira cómo cada etapa se abre a más usuarios, y dónde el lanzamiento sigue, espera o se apaga.",
      statusLabels: { active: "decidiendo", success: "atendiendo usuarios", danger: "apagada", off: "en pausa" },
      tapeLabel: "Usuarios medidos en cada etapa, 24 por etapa",
      nodes: {
        users: { name: "Usuarios", sub: "4 etapas", analogy: "las mesas" },
        flag: { name: "Bandera", sub: "avanza o se detiene", analogy: "el capitán de meseros" },
        current: { name: "Versión actual", sub: "se queda igual", analogy: "el menú de siempre" },
        next: { name: "Versión nueva", sub: "en prueba", analogy: "el menú nuevo" },
      },
      tape: { served: "buena experiencia", rerouted: "se quedó en la versión actual", lost: "peor experiencia" },
      reached: ({ approved, stoppedAt, killed }) =>
        killed ? `Apagada en el ${stoppedAt}% de los usuarios`
        : stoppedAt !== null ? (approved > 0 ? `Aprobada hasta el ${approved}%, en pausa en el ${stoppedAt}%` : `En pausa en el ${stoppedAt}% de los usuarios`)
        : approved > 0 ? (approved === 100 ? "Llegó al 100% de los usuarios" : `Aprobada hasta el ${approved}% por ahora`) : "Esperando al primer grupo",
    },
  },
};
