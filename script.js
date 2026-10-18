// --- CONFIGURAZIONE -------------------------------------------------
// Incolla qui i due valori che trovi in Supabase:
// Project Settings → API (Project URL e chiave anon / publishable).
const SUPABASE_URL = "https://ajatppwpeltjcwukqjzu.supabase.co";
const SUPABASE_KEY = "sb_publishable_qRMgcV21Hlsp3qn5hdzo6A_uCSXNKhF";
// --------------------------------------------------------------------

const ENDPOINT = `${SUPABASE_URL}/rest/v1/bar`;
const INTESTAZIONI = {
  apikey: SUPABASE_KEY,
  "Content-Type": "application/json",
};

const elLista = document.getElementById("lista");
const elStato = document.getElementById("stato");
const elRiepilogo = document.getElementById("riepilogo");
const elCerca = document.getElementById("cerca");
const elForm = document.getElementById("form");
const elInvia = document.getElementById("invia");
const elEsito = document.getElementById("esito");

let tuttiIBar = [];
let filtroAttivo = "tutti";

async function caricaBar() {
  try {
    const risposta = await fetch(`${ENDPOINT}?select=*&order=nome.asc`, {
      headers: INTESTAZIONI,
    });
    if (!risposta.ok) throw new Error(`Errore ${risposta.status}`);
    tuttiIBar = await risposta.json();
    elStato.textContent = "";
    disegna();
  } catch (errore) {
    elStato.textContent =
      "Non riesco a caricare i bar. Controlla la configurazione in script.js e riprova.";
    console.error(errore);
  }
}

function disegna() {
  const testo = elCerca.value.trim().toLowerCase();

  const visibili = tuttiIBar.filter((bar) => {
    if (filtroAttivo === "si" && !bar.mozzarella) return false;
    if (filtroAttivo === "no" && bar.mozzarella) return false;
    if (!testo) return true;
    return `${bar.nome} ${bar.citta || ""}`.toLowerCase().includes(testo);
  });

  const con = tuttiIBar.filter((b) => b.mozzarella).length;
  const senza = tuttiIBar.length - con;
  elRiepilogo.textContent = tuttiIBar.length
    ? `${con} con mozzarella, ${senza} senza, su ${tuttiIBar.length} bar.`
    : "";

  elLista.replaceChildren(...visibili.map(creaRiga));

  if (tuttiIBar.length && !visibili.length) {
    elStato.textContent = "Nessun bar corrisponde alla ricerca.";
  } else if (!tuttiIBar.length) {
    elStato.textContent = "Ancora nessun bar. Aggiungi il primo qui sotto.";
  } else {
    elStato.textContent = "";
  }
}

function creaRiga(bar) {
  const stato = bar.mozzarella ? "si" : "no";

  const li = document.createElement("li");
  li.className = `bar ${stato}`;

  const info = document.createElement("div");
  const nome = document.createElement("p");
  nome.className = "bar-nome";
  nome.textContent = bar.nome;
  info.appendChild(nome);

  if (bar.citta) {
    const citta = document.createElement("p");
    citta.className = "bar-citta";
    citta.textContent = bar.citta;
    info.appendChild(citta);
  }

  const etichetta = document.createElement("span");
  etichetta.className = `etichetta ${stato}`;
  etichetta.textContent = bar.mozzarella ? "Con mozzarella" : "Senza";

  li.append(info, etichetta);
  return li;
}

elForm.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  const dati = new FormData(elForm);
  const nuovoBar = {
    nome: dati.get("nome").trim(),
    citta: dati.get("citta").trim() || null,
    mozzarella: dati.get("mozzarella") === "si",
  };

  if (!nuovoBar.nome) return;

  elInvia.disabled = true;
  elEsito.className = "esito";
  elEsito.textContent = "";

  try {
    const risposta = await fetch(ENDPOINT, {
      method: "POST",
      headers: { ...INTESTAZIONI, Prefer: "return=representation" },
      body: JSON.stringify(nuovoBar),
    });
    if (!risposta.ok) throw new Error(`Errore ${risposta.status}`);

    const [creato] = await risposta.json();
    tuttiIBar.push(creato);
    tuttiIBar.sort((a, b) => a.nome.localeCompare(b.nome, "it"));
    disegna();

    elForm.reset();
    elEsito.textContent = `Aggiunto: ${creato.nome}.`;
  } catch (errore) {
    elEsito.className = "esito errore";
    elEsito.textContent = "Non sono riuscito ad aggiungere il bar. Riprova tra poco.";
    console.error(errore);
  } finally {
    elInvia.disabled = false;
  }
});

elCerca.addEventListener("input", disegna);

document.querySelectorAll(".filtro").forEach((bottone) => {
  bottone.addEventListener("click", () => {
    filtroAttivo = bottone.dataset.filtro;
    document
      .querySelectorAll(".filtro")
      .forEach((b) => b.classList.toggle("attivo", b === bottone));
    disegna();
  });
});

caricaBar();