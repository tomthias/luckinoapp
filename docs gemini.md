Prompt per Claude: Trasformazione di un Plugin Figma in una Web App Standalone
Obiettivo Principale: Convertire un plugin di Figma esistente per l'importazione ed esportazione di design token in una web app completamente funzionale e standalone. La web app dovrà replicare tutte le funzionalità chiave del plugin originale, ma operando interamente nel browser, senza alcuna dipendenza dall'API di Figma.

Contesto:
Il plugin originale, "Luckino Import Export," permette agli utenti di:

Importare file JSON contenenti design token (es. colori, spaziature, tipografia).

Supportare diversi formati di token, come W3C Design Tokens e Token Studio.

Analizzare e visualizzare un'anteprima delle variabili importate.

Esportare le variabili in vari formati, tra cui JSON (con diverse specifiche), CSS (standard e Tailwind), e altri.

Ti fornirò i file sorgente del plugin. Il tuo compito è di riadattare la logica e l'interfaccia utente per un ambiente web.

Struttura del Progetto della Web App
Per favore, organizza il codice sorgente della nuova web app secondo questa struttura di file:

/design-token-webapp/
|-- index.html         // L'interfaccia utente principale, basata su ui.html
|-- css/
|   |-- style.css      // Lo stile estratto e migliorato da ui.html
|-- js/
|   |-- main.js        // Logica principale dell'applicazione, adattata da code.js
|   |-- utils.js       // Funzioni di utilità (es. gestione ZIP, download file)
|   |-- examples.js    // Esempi di JSON da caricare (per i pulsanti "Load Example")
|-- assets/
|   |-- icons/         // Eventuali icone SVG
1. Sviluppo del Frontend (index.html e style.css)
Basati sul file plugin/ui.html fornito per creare il frontend.

index.html:

Ricrea la stessa struttura HTML di ui.html, includendo le tab ("Import JSON", "Export JSON", "Export CSS"), i pannelli, i pulsanti e i moduli di input.

Assicurati che i selettori ID e le classi CSS siano mantenuti per facilitare il collegamento con il JavaScript.

Includi i riferimenti ai file style.css e main.js.

css/style.css:

Estrai tutto il CSS presente nel tag <style> del file ui.html e inseriscilo in questo file.

Apporta eventuali miglioramenti necessari per garantire che lo stile sia responsive e funzioni correttamente in un browser a schermo intero (il layout a due colonne con pannelli scrollabili è particolarmente importante).

2. Adattamento della Logica JavaScript (js/main.js e js/utils.js)
Questo è il passaggio più critico. La logica dal file plugin/code.js deve essere adattata per funzionare senza l'API di Figma.

Rimuovi le Dipendenze da Figma:

Tutte le chiamate all'oggetto figma (es. figma.showUI, figma.ui.postMessage, figma.variables.*, figma.closePlugin(), etc.) devono essere rimosse o sostituite.

La logica non dovrà più interagire con le variabili di Figma, ma opererà su un oggetto JSON caricato in memoria.

Gestione della Comunicazione:

Il gestore di eventi figma.ui.onmessage deve essere sostituito da event listener standard di JavaScript. Ad esempio:

JavaScript

// Invece di: figma.ui.onmessage = msg => { if (msg.type === 'import-json') ... }
// Useremo:
document.getElementById('import-variables-button').addEventListener('click', () => {
  // Logica di importazione qui...
});
Implementa le Funzionalità Chiave:

Importazione di File:

Aggiungi un <input type="file" id="file-importer" style="display: none;"> in index.html.

Quando l'utente clicca un pulsante "Carica File", attiva questo input.

Leggi il contenuto del file JSON o ZIP caricato usando l'API FileReader.

Logica di Core (da code.js):

Migra le Funzioni Principali: Tutte le funzioni pure di code.js (che non dipendono da figma) possono essere copiate quasi interamente in js/main.js o js/utils.js. Queste includono:

detectTokenStudioFormat, convertTokenStudioFormat

analyzeJson

Tutte le funzioni di esportazione (exportVariablesToJSONAdvanced, exportVariablesToCSSAdvanced, etc.) e le loro funzioni di supporto (formatColorValue, convertToRem, etc.).

Adatta le Funzioni di Import: La funzione importVariables dovrà essere modificata per operare sull'oggetto JSON letto dal file caricato, invece che creare variabili in Figma. Il suo scopo sarà quello di analizzare e preparare i dati per l'esportazione.

Esportazione di File:

Crea una funzione in js/utils.js per scaricare i file generati.

Singolo File: Crea un Blob con il contenuto generato (JSON o CSS) e usa un link <a> con l'attributo download per avviare lo scaricamento.

File Multipli (ZIP): Usa la libreria JSZip (già presente nel codice di ui.html) per creare un archivio .zip contenente i file generati e avviare il download.

Codice Sorgente da Utilizzare
Per favore, utilizza i seguenti file come base per il tuo lavoro:

Per l'HTML e il CSS, fai riferimento a: plugin/ui.html

Per la logica JavaScript, adatta il codice da: plugin/code.js

Per i contenuti testuali e le spiegazioni, consulta: plugin/DOCUMENTATION.md

Il tuo output finale dovrebbe essere una serie di file di codice pronti per essere eseguiti come una web app statica. Grazie!