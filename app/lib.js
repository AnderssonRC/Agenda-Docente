// lib.js — Preact + htm (copias locales en /vendor, sin CDN).
// `html` permite escribir la interfaz con plantillas de texto, sin compilar:
//   html`<div class="x" onClick=${fn}>${texto}</div>`
import { h } from "../vendor/preact.module.js";
import htm from "../vendor/htm.module.js";

export * from "../vendor/preact.module.js";
export * from "../vendor/hooks.module.js";
export const html = htm.bind(h);
