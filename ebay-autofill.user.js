// ==UserScript==
// @name         EAN → eBay Autofill (DE) – Merkmale+Chips
// @namespace    https://github.com/MaxLyrics/ebay-ean-autofill-tampermonkey
// @version      0.3.0
// @description  Füllt eBay-Prelisting und Angebotsformular anhand EAN – inkl. Merkmale, Chip-/Empfehlungs-Klicks & Zwischenablage-Export.
// @author       you
// @match        https://www.ebay.de/*
// @match        https://ebay.de/*
// @match        https://www.kleinanzeigen.de/*
// @run-at       document-idle
// @grant        GM_addStyle
// @grant        GM_setClipboard
// @updateURL    https://raw.githubusercontent.com/MaxLyrics/ebay-ean-autofill-tampermonkey/main/ebay-autofill.user.js
// @downloadURL  https://raw.githubusercontent.com/MaxLyrics/ebay-ean-autofill-tampermonkey/main/ebay-autofill.user.js
// ==/UserScript==

(function () {
  'use strict';

  // ====== PRODUKT-DATEN (hier erweiterbar) ======
  const DB = {
    "5410439148474": {
      titel: "Uni-scr. PFS+ FH 3,5x16 Zp/grn – 200 Stück – NEU & OVP",
      ean: "5410439148474",
      merkmale: {
        "Schraubengröße": "3,5 mm x 16 mm",
        "Material": "Gehärteter Stahl, verzinkt (Cr3+)",
        "Produktart": "Universalschraube",
        "Kopfform": "Senkkopf",
        "Gewindegröße": "Vollgewinde",
        "Maßsystem": "Metrisch",
        "Antrieb": "Kreuzschlitz",          // PZ = Kreuzschlitz-Unterart
        "Länge": "16 mm",
        "Klasse": "Standard",
        "Herstellernummer": "GZ0S-P035016",
        "Modell": "Universalschraube",
        "Anzahl pro Packung": "200",
        "Marke": "PFS+",
        "Finish": "Verzinkt",
        "Ursprungsland": "Belgien",
        "Anzahl der Einheiten": "200",
        "Maßeinheit": "Stück"
      },
      preis: "4,99",
      versand: { bezeichnung: "DHL Paket", kosten: "3,99" },
      paket: { gewichtKg: "0,18", laengeCm: "10", breiteCm: "6", hoeheCm: "4" },
      beschreibung:
`Ich verkaufe eine originalverpackte Box hochwertiger Universalschrauben von PFS+ (pgb-Europe) – ideal für Holzverarbeitung, Innenausbau, DIY-Projekte und Handwerk.

✅ Technische Daten:
• Maße: 3,5 mm x 16 mm
• Material: Gehärteter Stahl, Cr3+ verzinkt
• Kopfart: Senkkopf / Flat Head (FH)
• Antrieb: Pozidriv (PZ, Kreuzschlitz)
• Gewinde: Vollgewinde
• Verpackungseinheit: 200 Stück
• Zustand: Neu & OVP
• EAN: 5410439148474
• Hersteller-Nr.: GZ0S-P035016 (laut Hersteller)

📦 Versand möglich (DHL Paket oder Warensendung auf Wunsch)
📍 Abholung nach Absprache ebenfalls möglich

Privatverkauf – keine Garantie oder Rücknahme.`
    }
  };

  // ====== UI ======
  GM_addStyle(`
    #eanAutofillPanel{
      position:fixed;top:12px;right:12px;z-index:999999;background:#111;color:#fff;
      padding:10px;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,.2);
      width:340px;font:13px/1.35 system-ui,Arial,sans-serif
    }
    #eanAutofillPanel h3{margin:0 0 8px;font-size:14px}
    #eanAutofillPanel input{width:100%;padding:8px;border-radius:8px;border:none;margin:4px 0 8px}
    #eanAutofillPanel .row{display:flex;gap:6px}
    #eanAutofillPanel button{flex:1;border:1px solid #333;background:#fff;color:#111;border-radius:8px;padding:8px;cursor:pointer}
    #eanAutofillPanel button:hover{filter:brightness(.95)}
    #eanAutofillToast{position:fixed;top:12px;right:12px;z-index:999999;background:#111;color:#fff;padding:10px 12px;border-radius:10px;display:none;box-shadow:0 4px 12px rgba(0,0,0,.2);font-size:13px}
  `);

  const panel = document.createElement('div');
  panel.id = 'eanAutofillPanel';
  panel.innerHTML = `
    <h3>EAN → eBay Autofill</h3>
    <input id="eanInput" placeholder="EAN eingeben (z. B. 5410439148474)" />
    <div class="row">
      <button id="eanFill">Füllen</button>
      <button id="eanCopy">Kopieren</button>
      <button id="eanPreview">Vorschau</button>
    </div>
    <div style="margin-top:6px;font-size:11px;color:#bbb">Unterstützt Prelisting & Formular – inkl. Merkmale/Chips.</div>
  `;
  document.documentElement.appendChild(panel);

  const toast = document.createElement('div'); toast.id='eanAutofillToast'; document.documentElement.appendChild(toast);
  const $ = (s,r=document)=>r.querySelector(s);
  const showToast=(t,ms=1800)=>{toast.textContent=t;toast.style.display='block';setTimeout(()=>toast.style.display='none',ms);};

  // ====== Helpers ======
  const isPrelisting = () =>
    /\/sl\/prelist/i.test(location.pathname) ||
    !!best('input[placeholder*="Was möchten Sie verkaufen" i]','input[aria-label*="Was möchten Sie verkaufen" i]','input[type="search"]');

  function best(...sels){ for(const s of sels.flat()){ const el=document.querySelector(s); if(el) return el; } return null; }

  function setValue(el, val){
    if(!el||val==null) return false;
    const tag=(el.tagName||'').toLowerCase();
    if(tag==='input'||tag==='textarea'){
      el.focus(); el.value=String(val);
      el.dispatchEvent(new Event('input',{bubbles:true}));
      el.dispatchEvent(new Event('change',{bubbles:true}));
      return true;
    }
    if(el.getAttribute && el.getAttribute('contenteditable')==='true'){
      el.focus(); document.execCommand('selectAll',false,null);
      document.execCommand('insertText',false,String(val));
      return true;
    }
    return false;
  }

  function clickIfExists(el){ if(el){ el.click(); return true; } return false; }

  // Klickt „Chip/Empfehlung“-Buttons oder Dropdown-Optionen mit Label-Text
  function clickChipLike(text){
    if(!text) return false;
    text = String(text).trim().toLowerCase();

    // Buttons/Chips
    const chips = Array.from(document.querySelectorAll('button, [role="button"], .chip, .pill, .suggestion, li, [role="option"]'));
    const chip = chips.find(n=>{
      const t=(n.textContent||'').trim().toLowerCase();
      return t===text || t.includes(text);
    });
    if(chip){ chip.click(); return true; }

    // Select-Optionen (offene Dropdowns)
    const opts = Array.from(document.querySelectorAll('option'));
    const opt = opts.find(o=>{
      const t=(o.textContent||'').trim().toLowerCase();
      return t===text || t.includes(text);
    });
    if(opt && opt.parentElement){
      opt.parentElement.value=opt.value;
      opt.parentElement.dispatchEvent(new Event('change',{bubbles:true}));
      return true;
    }
    return false;
  }

  // Sucht Eingabefeld anhand sichtbarem Label-Text
  function inputByLabel(labelText){
    labelText=labelText.toLowerCase();
    const labels=Array.from(document.querySelectorAll('label'));
    for(const lab of labels){
      const t=(lab.textContent||'').trim().toLowerCase();
      if(t.includes(labelText)){
        const forId=lab.getAttribute('for');
        if(forId){ const el=document.getElementById(forId); if(el) return el; }
        const el = lab.closest('div,section,fieldset')?.querySelector('input,textarea,div[contenteditable="true"]');
        if(el) return el;
      }
    }
    return best(`input[aria-label*="${labelText}" i]`, `input[placeholder*="${labelText}" i]`, `textarea[aria-label*="${labelText}" i]`);
  }

  // ====== Selektoren Formular (Basis) ======
  const S = {
    title: ['input[name="title"]','input[aria-label*="Titel" i]','input#title'],
    ean: ['input[name*="ean" i]','input[aria-label*="EAN" i]'],
    description: ['textarea[name="description"]','textarea[aria-label*="Beschreibung" i]','div[contenteditable="true"]'],
    price: ['input[name="price"]','input[aria-label*="Preis" i]','input[type="text"][inputmode="decimal"]'],
    conditionNew: ['input[type="radio"][value="1000"]','input[aria-label*="Neu" i]'],
    searchPre: ['input[placeholder*="Was möchten Sie verkaufen" i]','input[aria-label*="Was möchten Sie verkaufen" i]','input[type="search"]']
  };

  // ====== Füller ======
  function fillPrelisting(row){
    const el = best(...S.searchPre);
    if(!el) return false;
    setValue(el, row.titel);
    showToast('Prelisting-Titel gesetzt ✅');
    // optional Enter zum Weitergehen
    setTimeout(()=> el.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',keyCode:13,which:13,bubbles:true})), 250);
    return true;
  }

  function fillListingBasic(row){
    setValue(best(...S.title), row.titel);
    setValue(best(...S.ean), row.ean);
    clickIfExists(best(...S.conditionNew));
    setValue(best(...S.price), row.preis);

    const descEl = best(...S.description);
    if(descEl && descEl.getAttribute && descEl.getAttribute('contenteditable')==='true'){
      descEl.focus(); document.execCommand('selectAll',false,null);
      document.execCommand('insertText',false,row.beschreibung);
    } else { setValue(descEl,row.beschreibung); }
  }

  // füllt Merkmale inkl. Chips
  function fillAttributes(attrs){
    const order = Object.keys(attrs);
    for(const key of order){
      const val = attrs[key];
      if(!val) continue;

      // 1) Versuche Chip/Empfehlung zu klicken (zuerst exakter Match, dann Teil)
      if(clickChipLike(val)) continue;
      if(clickChipLike(key)) continue; // manche Chips tragen nur das Feldwort

      // 2) Suche ein Eingabefeld neben dem Label
      const el = inputByLabel(key);
      if(el){ setValue(el, val); continue; }

      // 3) generischer Fallback
      const generic = best(`input[aria-label="${key}"]`, `input[placeholder="${key}"]`);
      if(generic){ setValue(generic,val); continue; }
    }
  }

  function buildBlock(row){
    return `[Titel] = ${row.titel}
[EAN] = ${row.ean}
[Artikelpreis] = ${row.preis}
[Anzahl pro Packung] = ${row.merkmale["Anzahl pro Packung"]}
[Marke] = ${row.merkmale["Marke"]}
[Maßeinheit] = ${row.merkmale["Maßeinheit"]}
[Anzahl der Einheiten] = ${row.merkmale["Anzahl der Einheiten"]}
[Ursprungsland] = ${row.merkmale["Ursprungsland"]}
[Herstellernummer] = ${row.merkmale["Herstellernummer"]}

---------------------------------------
✅ BESCHREIBUNG:
${row.beschreibung}
---------------------------------------`;
  }

  // ====== Button-Events ======
  document.addEventListener('click', (e) => {
    const id = e.target && e.target.id;

    if(id==='eanFill'){
      const code = $('#eanInput').value.trim();
      const row = DB[code];
      if(!row){ showToast('Keine Daten zur EAN in der DB.'); return; }

      if(isPrelisting()){
        fillPrelisting(row);
        // wenn zum Formular gewechselt wird: erneut füllen
        let tries=0;
        const obs=new MutationObserver(()=>{ if(++tries>10) return obs.disconnect(); if(!isPrelisting()){ setTimeout(()=>{ fillListingBasic(row); fillAttributes(row.merkmale); },600); obs.disconnect(); }});
        obs.observe(document.body,{childList:true,subtree:true});
      } else {
        fillListingBasic(row);
        fillAttributes(row.merkmale);
        // lazy nachfüllen
        let tries=0;
        const obs=new MutationObserver(()=>{ if(++tries<=2){ setTimeout(()=>{ fillListingBasic(row); fillAttributes(row.merkmale); },300);} else obs.disconnect(); });
        obs.observe(document.body,{childList:true,subtree:true});
      }
      showToast('Felder/Attribute ausgefüllt ✅');
    }

    if(id==='eanCopy'){
      const code = $('#eanInput').value.trim();
      const row = DB[code];
      if(!row){ showToast('Keine Daten zur EAN in der DB.'); return; }
      GM_setClipboard(buildBlock(row)); showToast('Block in Zwischenablage ✅');
    }

    if(id==='eanPreview'){
      const code = $('#eanInput').value.trim();
      const row = DB[code];
      if(!row){ alert('Keine Daten für diese EAN in der Demo-DB.'); return; }
      alert(JSON.stringify(row,null,2));
    }
  });
})();

---

### ✅ Was du jetzt machst

1) In GitHub → **Add file → Upload files**  
2) **Beide Dateien** hochladen:  
   - `ebay-autofill.user.js`  
   - `README.md`  
3) Committen → fertig 🎉

Wenn du magst, schreibe ich dir jetzt noch einen kurzen **Commit-Text** und einen Vorschlag für **Release v0.3.0**.
