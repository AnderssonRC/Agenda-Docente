// config-pantalla.js — Configuración de la pantalla dividida (se abre desde el Inicio).
// Cada elemento de los tres módulos se muestra u oculta con el ojo; a la derecha
// se ve una previsualización de cómo queda el panel.
import { html, useState, useEffect } from "../lib.js";
import { watch, saveList } from "../data.js";
import { enFondo, css, ICONO_DIVIDIR } from "../ui.js";
import { ELEMENTOS, CLAVE_CONFIG, OCULTOS_POR_DEFECTO, leerOcultos, itemsConfig } from "../panel.js";

css("v-config-pantalla", `
  .cp-bloque{transition:opacity .2s, transform .2s;}
  .cp-fila:hover{background:oklch(95% 0.015 65);}
  .cp-cuerpo{display:grid;grid-template-columns:1fr;gap:22px;}
  @media (min-width:760px){ .cp-cuerpo{grid-template-columns:minmax(0,1fr) minmax(0,1.15fr);} }
`);

const ACENTO = { clases: "oklch(55% 0.11 48)", participacion: "oklch(58% 0.14 235)", seguimiento: "oklch(55% 0.16 25)" };

const OJO_ABIERTO = html`<svg width="19" height="19" viewBox="0 0 24 24" fill="none"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/></svg>`;
const OJO_CERRADO = html`<svg width="19" height="19" viewBox="0 0 24 24" fill="none"><path d="M3 3l18 18M10.6 5.1A10.7 10.7 0 0112 5c6.4 0 10 7 10 7a17.6 17.6 0 01-3.2 4.1M6.6 6.6C3.8 8.4 2 12 2 12s3.6 7 10 7c1.8 0 3.4-.5 4.7-1.3M9.9 9.9a3 3 0 004.2 4.2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

/* ---------- previsualización (esquema del módulo) ---------- */

function Bloque({ on, alto, color, children, estilo = "" }) {
  if (!on) return null;
  return html`<div class="cp-bloque" style="height:${alto}px;border-radius:4px;background:${color};margin-bottom:5px;flex-shrink:0;${estilo}">${children}</div>`;
}
const GRIS = "oklch(88% 0.012 65)", GRIS2 = "oklch(93% 0.008 65)";

function Esquema({ mod, ver }) {
  const ac = ACENTO[mod];
  const filas = (n, extra) => Array.from({ length: n }, (_, i) => html`
    <div key=${i} style="height:16px;border-radius:4px;background:${GRIS2};margin-bottom:4px;display:flex;align-items:center;gap:4px;padding:0 4px;">${extra}</div>`);

  if (mod === "clases") {
    return html`
      <div style="display:flex;flex-direction:column;height:100%;">
        <${Bloque} on=${ver("encabezado")} alto=${18} color="oklch(30% 0.03 50)"/>
        <div style="flex:1;display:flex;gap:5px;min-height:0;">
          ${ver("barra") && html`<div class="cp-bloque" style="width:22%;border-radius:4px;background:oklch(90% 0.02 60);padding:4px;box-sizing:border-box;">
            ${[0, 1, 2].map(i => html`<div key=${i} style="height:9px;border-radius:3px;background:${i === 0 ? ac : GRIS};margin-bottom:4px;"></div>`)}
          </div>`}
          <div style="flex:1;min-width:0;">
            <${Bloque} on=${ver("resumen")} alto=${16} color="transparent" estilo="display:flex;gap:4px;">
              ${[0, 1, 2].map(i => html`<div key=${i} style="flex:1;border-radius:4px;background:${GRIS};"></div>`)}
            <//>
            ${filas(5, html`<span style="width:3px;height:10px;border-radius:2px;background:${ac};"></span>`)}
          </div>
          ${ver("panel") && html`<div class="cp-bloque" style="width:28%;border-radius:4px;background:${GRIS2};padding:5px;box-sizing:border-box;display:flex;align-items:flex-end;gap:3px;height:62px;">
            ${[6, 12, 9, 16, 11].map((h, i) => html`<div key=${i} style="flex:1;height:${h * 2.6}px;border-radius:2px 2px 0 0;background:${ac};"></div>`)}
          </div>`}
        </div>
        ${ver("boton") && html`<div class="cp-bloque" style="position:absolute;right:10px;bottom:10px;width:18px;height:18px;border-radius:50%;background:${ac};"></div>`}
      </div>`;
  }

  const ests = (extra) => filas(5, extra);
  if (mod === "participacion") {
    return html`
      <div>
        <${Bloque} on=${ver("encabezado")} alto=${18} color="oklch(30% 0.06 240)"/>
        <${Bloque} on=${ver("pestanas")} alto=${10} color="oklch(40% 0.06 240)"/>
        <${Bloque} on=${ver("resumen")} alto=${16} color="transparent" estilo="display:flex;gap:4px;">
          ${[0, 1].map(i => html`<div key=${i} style="flex:1;border-radius:4px;background:oklch(90% 0.02 225);"></div>`)}
        <//>
        <${Bloque} on=${ver("buscador")} alto=${10} color="transparent" estilo="border:1.5px solid ${GRIS};"/>
        ${ests(ver("botones") ? html`<span style="width:8px;height:8px;border-radius:50%;border:1.5px solid oklch(55% 0.18 25);"></span><span style="width:10px;height:5px;background:${GRIS};border-radius:2px;"></span><span style="width:8px;height:8px;border-radius:50%;border:1.5px solid oklch(48% 0.13 150);"></span>` : html`<span style="width:10px;height:5px;background:${GRIS};border-radius:2px;"></span>`)}
      </div>`;
  }
  return html`
    <div>
      <${Bloque} on=${ver("encabezado")} alto=${18} color="oklch(28% 0.05 25)"/>
      <${Bloque} on=${ver("pestanas")} alto=${10} color="oklch(38% 0.06 25)"/>
      <${Bloque} on=${ver("resumen")} alto=${16} color="transparent" estilo="display:flex;gap:4px;">
        ${["oklch(90% 0.06 25)", "oklch(92% 0.05 85)", "oklch(91% 0.05 145)"].map((c, i) => html`<div key=${i} style="flex:1;border-radius:4px;background:${c};"></div>`)}
      <//>
      <${Bloque} on=${ver("vistas")} alto=${9} color="transparent" estilo="display:flex;gap:4px;">
        <div style="width:30px;border-radius:3px;background:${ac};"></div><div style="width:30px;border-radius:3px;background:${GRIS};"></div>
      <//>
      <${Bloque} on=${ver("buscador")} alto=${10} color="transparent" estilo="border:1.5px solid ${GRIS};"/>
      ${ests(html`<span style="width:7px;height:7px;border-radius:50%;background:${ac};"></span>`)}
    </div>`;
}

/* ---------- modal ---------- */

export default function ConfigPantalla({ onCerrar }) {
  const [ocultos, setOcultos] = useState(() => leerOcultos(null));
  const [mod, setMod] = useState("clases");

  useEffect(() => watch([CLAVE_CONFIG], d => setOcultos(leerOcultos(d[CLAVE_CONFIG]))), []);

  const guardar = (nuevo) => { setOcultos(nuevo); saveList(CLAVE_CONFIG, itemsConfig(nuevo)); };
  const alternar = (clave) => {
    const nuevo = new Set(ocultos);
    nuevo.has(clave) ? nuevo.delete(clave) : nuevo.add(clave);
    guardar(nuevo);
  };
  const ver = (el) => !ocultos.has(mod + "." + el);
  const info = ELEMENTOS[mod];
  const otro = mod === "clases" ? "participacion" : "clases";

  return html`
  <div onClick=${enFondo(onCerrar)} style="position:fixed;inset:0;background:oklch(20% 0.03 45 / 0.55);z-index:300;display:flex;align-items:center;justify-content:center;padding:18px;">
    <div style="background:oklch(99% 0.005 75);width:100%;max-width:940px;max-height:92vh;overflow-y:auto;border-radius:18px;padding:clamp(20px,3vw,30px);box-sizing:border-box;box-shadow:0 24px 60px oklch(15% 0.03 50 / 0.4);">
      <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:6px;">
        <div style="width:40px;height:40px;border-radius:11px;background:oklch(92% 0.03 60);color:oklch(40% 0.08 45);display:flex;align-items:center;justify-content:center;flex:none;">${ICONO_DIVIDIR}</div>
        <div style="flex:1;">
          <div style="font-family:'Fraunces',serif;font-size:20px;font-weight:600;color:oklch(28% 0.03 50);">Pantalla dividida</div>
          <div style="font-size:13.5px;color:oklch(48% 0.02 55);margin-top:3px;line-height:1.5;">Elige qué se ve de cada módulo cuando lo abres al lado de otro. Solo en tablet y computador.</div>
        </div>
        <button onClick=${onCerrar} aria-label="Cerrar" style="width:34px;height:34px;border-radius:50%;border:none;background:oklch(95% 0.01 65);color:oklch(45% 0.02 50);font-size:20px;cursor:pointer;flex:none;">×</button>
      </div>

      <div style="display:flex;gap:8px;flex-wrap:wrap;margin:18px 0 20px;">
        ${Object.keys(ELEMENTOS).map(k => {
          const on = k === mod;
          return html`<button key=${k} onClick=${() => setMod(k)} style="padding:8px 16px;border-radius:999px;border:1.5px solid ${on ? ACENTO[k] : "oklch(88% 0.014 60)"};background:${on ? ACENTO[k] : "transparent"};color:${on ? "oklch(98% 0.01 70)" : "oklch(40% 0.02 55)"};font-size:13.5px;font-weight:700;cursor:pointer;font-family:inherit;">${ELEMENTOS[k].titulo}</button>`;
        })}
      </div>

      <div class="cp-cuerpo">
        <div>
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:oklch(50% 0.02 55);margin-bottom:8px;">Elementos</div>
          ${info.items.map(it => {
            const clave = mod + "." + it.id;
            const visible = !ocultos.has(clave);
            return html`
              <div key=${clave} class="cp-fila" style="display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:10px;border:1px solid oklch(91% 0.012 60);margin-bottom:6px;">
                <div style="flex:1;min-width:0;font-size:14px;font-weight:600;color:${visible ? "oklch(30% 0.03 50)" : "oklch(62% 0.015 60)"};text-decoration:${visible ? "none" : "line-through"};">${it.label}</div>
                ${it.fijo
                  ? html`<span style="font-size:11.5px;color:oklch(58% 0.015 60);font-style:italic;">siempre visible</span>`
                  : html`<button onClick=${() => alternar(clave)} aria-pressed=${visible} title=${visible ? "Ocultar" : "Mostrar"} style="width:36px;height:36px;border-radius:9px;border:1.5px solid ${visible ? ACENTO[mod] : "oklch(86% 0.014 60)"};background:${visible ? "oklch(97% 0.015 65)" : "transparent"};color:${visible ? ACENTO[mod] : "oklch(62% 0.015 60)"};cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;">${visible ? OJO_ABIERTO : OJO_CERRADO}</button>`}
              </div>`;
          })}
          <button onClick=${() => guardar(new Set(OCULTOS_POR_DEFECTO))} style="margin-top:8px;padding:8px 14px;border-radius:8px;border:1px dashed oklch(80% 0.02 60);background:transparent;color:oklch(45% 0.02 55);font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;">Restablecer valores</button>
        </div>

        <div>
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:oklch(50% 0.02 55);margin-bottom:8px;">Previsualización</div>
          <div style="background:oklch(26% 0.02 55);border-radius:18px;padding:12px;box-shadow:0 10px 30px oklch(20% 0.02 50 / 0.25);">
            <div style="display:flex;gap:4px;height:250px;border-radius:9px;overflow:hidden;background:oklch(22% 0.02 55);">
              <div style="flex:1;min-width:0;background:oklch(98% 0.006 75);padding:7px;position:relative;box-sizing:border-box;overflow:hidden;">
                <${Esquema} mod=${mod} ver=${ver}/>
              </div>
              <div style="flex:1;min-width:0;background:oklch(98% 0.006 75);padding:7px;position:relative;box-sizing:border-box;overflow:hidden;opacity:0.4;">
                <${Esquema} mod=${otro} ver=${(el) => !ocultos.has(otro + "." + el)}/>
              </div>
            </div>
          </div>
          <div style="font-size:12px;color:oklch(52% 0.02 55);margin-top:10px;line-height:1.5;">A la izquierda, <b>${info.titulo}</b> tal como se verá en pantalla dividida. Los cambios se guardan solos y se aplican en todos tus dispositivos.</div>
        </div>
      </div>
    </div>
  </div>`;
}
