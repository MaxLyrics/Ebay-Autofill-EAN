# 📦 EAN → eBay Autofill (Tampermonkey Script)

Ein Tampermonkey-Userscript, das eBay-Angebote automatisch anhand einer **EAN** befüllt.

✅ Unterstützt:
- 🛒 eBay.de – *Prelisting & Verkaufsformular*
- 📱 Kleinanzeigen.de – *optional erweiterbar*

---

## 🚀 Funktionen

✅ Eingabe einer EAN über ein kleines Overlay (oben rechts sichtbar)  
✅ Automatisches Ausfüllen von:
- Titel
- EAN
- Artikelbeschreibung
- Preis
- Zustand
- Merkmale (z. B. Schraubengröße, Material, Kopfform, Länge, Produktart, Klasse, Maßsystem, etc.)
- Anzahl pro Packung & Maßeinheit
- Gewicht & Paketmaße (optional)

✅ Unterstützt eBays Vorschlags-Chips (z. B. „Metrisch“, „Kreuzschlitz“, „Verzinkt“ etc.)  
✅ Funktioniert bereits auf der **Prelisting-Seite** (füllt das Feld und kann automatisch Enter drücken)  
✅ Kann Artikelwerte als strukturierten Text in die Zwischenablage kopieren  
✅ Datenbank (`DB`) im Script für weitere EANs erweiterbar  

---

## 📥 Installation (Tampermonkey)

1. **Tampermonkey installieren**
   - Chrome: https://www.tampermonkey.net  
   - Firefox: https://addons.mozilla.org/de/firefox/addon/tampermonkey/

2. Diese Datei öffnen: [`ebay-autofill.user.js`](./ebay-autofill.user.js)

3. Im Tampermonkey:
   - „Neues Userscript“ erstellen  
   - Inhalt durch `ebay-autofill.user.js` ersetzen  
   - Speichern ✅

> 🔄 Auto-Update ist aktiv: Die Datei enthält `@updateURL` und `@downloadURL`, die bei künftigen Änderungen genutzt werden können.

4. eBay-Angebotsseite öffnen → oben rechts erscheint das Eingabe-Panel ✅

---

## 🛠️ Verwendung

1. EAN eingeben (z. B. `5410439148474`)
2. Auf **„Füllen“** klicken  
   ✔ Befindet man sich auf der Prelisting-Seite → Script setzt Titel & startet Prozess  
   ✔ Befindet man sich bereits im Formular → Felder wie Titel, EAN, Preis, Beschreibung & Merkmale werden eingetragen  
3. Fotos hochladen → fertig 🎉

---

## 📦 Weitere Produkte hinzufügen (DB erweitern)

```js
const DB = {
  "DEINEEAN123": {
    titel: "...",
    ean: "DEINEEAN123",
    merkmale: {
      "Material": "...",
      "Produktart": "...",
      "Länge": "...",
      // weitere Felder ...
    },
    preis: "X,XX",
    beschreibung: `Dein Beschreibungstext ...`
  }
};
Update README with full EAN → eBay Autofill documentation
