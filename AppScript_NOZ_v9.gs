// ============================================================
// PLANNING MAGASIN NOZ — Script COMPLET v9
// Coller ce code en remplacant TOUT le contenu existant
// ============================================================

var POLES = {
  "POLE1":    { valeur: 1,  bg: "#FF0000", fg: "#FFFFFF", label: "Pole 1"    },
  "POLE2":    { valeur: 7,  bg: "#00B050", fg: "#FFFFFF", label: "Pole 2"    },
  "POLE3":    { valeur: 3,  bg: "#002060", fg: "#FFFFFF", label: "Pole 3"    },
  "DIVERS":   { valeur: 6,  bg: "#C65911", fg: "#FFFFFF", label: "Divers"    },
  "CAISSES":  { valeur: 8,  bg: "#FFFF00", fg: "#000000", label: "Caisses"   },
  "SURGELE":  { valeur: 10, bg: "#FF69B4", fg: "#FFFFFF", label: "Surgeles"  },
  "TDM":      { valeur: 2,  bg: "#00B0F0", fg: "#FFFFFF", label: "TDM"       },
  "BOUTIQUE": { valeur: 9,  bg: "#C4BD97", fg: "#000000", label: "Boutiques" },
  "NETT":     { valeur: 5,  bg: "#375623", fg: "#FFFFFF", label: "Nettoyage" },
  "ECOLE":    { valeur: 4,  bg: "#9B59B6", fg: "#FFFFFF", label: "Ecole"     }
};

var COL_VIS_DEBUT = 8;
var COL_VIS_FIN   = 71;
var COL_CNT_DEBUT = 72;

var JOURS = {
  "LUNDI":    { debut: 17,  fin: 39,  col_resp: 3 },
  "MARDI":    { debut: 59,  fin: 81,  col_resp: 4 },
  "MERCREDI": { debut: 101, fin: 123, col_resp: 5 },
  "JEUDI":    { debut: 143, fin: 165, col_resp: 6 },
  "VENDREDI": { debut: 185, fin: 207, col_resp: 7 },
  "SAMEDI":   { debut: 227, fin: 249, col_resp: 8 },
  "DIMANCHE": { debut: 269, fin: 291, col_resp: 9 }
};

var POLES_RESP = [
  { valeur: 1,  ligne_matin: 3,  ligne_apmidi: 6,  label: "Pole 1",   bg: "#FF0000" },
  { valeur: 7,  ligne_matin: 11, ligne_apmidi: 14, label: "Pole 2",   bg: "#00B050" },
  { valeur: 3,  ligne_matin: 19, ligne_apmidi: 22, label: "Pole 3",   bg: "#002060" },
  { valeur: 2,  ligne_matin: 27, ligne_apmidi: 30, label: "TDM",      bg: "#00B0F0" },
  { valeur: 10, ligne_matin: 35, ligne_apmidi: 38, label: "Surgeles", bg: "#FF69B4" }
];

// ─── MENU ────────────────────────────────────────────────────
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu("PLANNING NOZ")
    .addSubMenu(ui.createMenu("Colorier selection")
      .addItem("Pole 1",    "btn_POLE1")
      .addItem("Pole 2",    "btn_POLE2")
      .addItem("Pole 3",    "btn_POLE3")
      .addItem("Divers",    "btn_DIVERS")
      .addItem("Caisses",   "btn_CAISSES")
      .addItem("Surgeles",  "btn_SURGELE")
      .addItem("TDM",       "btn_TDM")
      .addItem("Boutiques", "btn_BOUTIQUE")
      .addItem("Nett",      "btn_NETT")
      .addItem("Ecole",     "btn_ECOLE")
      .addItem("Repos",     "btn_REPOS")
      .addSeparator()
      .addItem("Effacer",   "btn_VIDER"))
    .addSeparator()
    .addSubMenu(ui.createMenu("Effacer un jour")
      .addItem("Effacer LUNDI",    "effacer_LUNDI")
      .addItem("Effacer MARDI",    "effacer_MARDI")
      .addItem("Effacer MERCREDI", "effacer_MERCREDI")
      .addItem("Effacer JEUDI",    "effacer_JEUDI")
      .addItem("Effacer VENDREDI", "effacer_VENDREDI")
      .addItem("Effacer SAMEDI",   "effacer_SAMEDI")
      .addItem("Effacer DIMANCHE", "effacer_DIMANCHE")
      .addSeparator()
      .addItem("Effacer TOUTE LA SEMAINE", "effacer_TOUT"))
    .addSeparator()
    .addItem("Creer tableaux TDM et Surgeles", "creer_tableaux_resp")
    .addItem("Configurer listes deroulantes",  "configurer_listes")
    .addItem("Supprimer boutons Boutiques et Zooms", "supprimer_boutons_inutiles")
    .addItem("Alertes legislatives",           "alertes_legislatives")
    .addSeparator()
    .addItem("Imprimer MATRICE",    "imprimer_MATRICE")
    .addItem("Imprimer RECAP",      "imprimer_RECAP")
    .addItem("Imprimer INDIVIDUEL", "imprimer_INDIVIDUEL")
    .addToUi();
}

// ─── CREER TABLEAUX TDM ET SURGELES ──────────────────────────
function creer_tableaux_resp() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("RESPONSABLE_POLE");
  if (!sheet) { SpreadsheetApp.getUi().alert("Feuille RESPONSABLE_POLE introuvable !"); return; }

  var JOURS_LABELS = ["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"];

  function creerBloc(ligneDebut, label, bgColor) {
    sheet.getRange(ligneDebut - 1, 1, 1, 9).clearContent().setBackground(null);
    for (var j = 0; j < 7; j++) {
      var cell = sheet.getRange(ligneDebut, 3 + j);
      cell.setValue(JOURS_LABELS[j]);
      cell.setBackground(bgColor);
      cell.setFontColor("#FFFFFF");
      cell.setFontWeight("bold");
      cell.setHorizontalAlignment("center");
    }
    sheet.getRange(ligneDebut + 1, 1).setValue(label).setFontWeight("bold").setVerticalAlignment("middle");
    sheet.getRange(ligneDebut + 1, 2).setValue("Matin").setFontWeight("bold").setVerticalAlignment("middle");
    sheet.getRange(ligneDebut + 1, 3, 3, 7).setBackground("#F5F5F5");
    sheet.getRange(ligneDebut + 4, 2).setValue("Apres-midi").setFontWeight("bold").setVerticalAlignment("middle");
    sheet.getRange(ligneDebut + 4, 3, 3, 7).setBackground("#E8F5E9");
    sheet.getRange(ligneDebut, 1, 7, 9).setBorder(true, true, true, true, true, false,
      "black", SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
    sheet.getRange(ligneDebut + 4, 1, 3, 9).setBorder(true, false, false, false, false, false,
      "black", SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
  }

  creerBloc(26, "TDM",      "#00B0F0");
  creerBloc(34, "Surgeles", "#FF69B4");
  ss.toast("Tableaux TDM et Surgeles crees !", "Planning NOZ", 3);
}

// ─── MISE A JOUR RESPONSABLE_POLE ────────────────────────────
function majResponsablePoleJour_(matrice, nomJour) {
  var ss       = SpreadsheetApp.getActiveSpreadsheet();
  var respPole = ss.getSheetByName("RESPONSABLE_POLE");
  if (!respPole) return;

  var jour  = JOURS[nomJour];
  var nbLig = jour.fin - jour.debut + 1;
  var col   = jour.col_resp;
  var data  = matrice.getRange(jour.debut, 1, nbLig, 135).getValues();

  for (var p = 0; p < POLES_RESP.length; p++) {
    var pole       = POLES_RESP[p];
    var nomsMatin  = [];
    var nomsApmidi = [];

    for (var i = 0; i < nbLig; i++) {
      var row    = data[i];
      var prenom = String(row[5] || "").trim();
      if (!prenom) continue;
      var hasMatin = false, hasApmidi = false;
      for (var c = 71; c <= 134; c++) {
        if (Number(row[c] || 0) === pole.valeur) {
          if (c - 71 <= 27) hasMatin  = true;
          else              hasApmidi = true;
        }
      }
      if (hasMatin)  nomsMatin.push(prenom);
      if (hasApmidi) nomsApmidi.push(prenom);
    }

    for (var r = 0; r < 3; r++) {
      respPole.getRange(pole.ligne_matin  + r, col).setValue(r < nomsMatin.length  ? nomsMatin[r]  : "");
      respPole.getRange(pole.ligne_apmidi + r, col).setValue(r < nomsApmidi.length ? nomsApmidi[r] : "");
    }
  }
}

function majRespPoleDepuisLignes_(sheet, ligDebut, ligFin) {
  var joursKeys = Object.keys(JOURS);
  for (var j = 0; j < joursKeys.length; j++) {
    var cfg = JOURS[joursKeys[j]];
    if (ligFin >= cfg.debut && ligDebut <= cfg.fin) {
      majResponsablePoleJour_(sheet, joursKeys[j]);
    }
  }
}

// ─── COULEURS ────────────────────────────────────────────────
function appliquerPole_(cle) {
  var ss       = SpreadsheetApp.getActiveSpreadsheet();
  var cfg      = POLES[cle];
  var sel      = ss.getActiveRange();
  var sheet    = sel.getSheet();
  var colDebut = sel.getColumn();
  var colFin   = sel.getLastColumn();
  var ligDebut = sel.getRow();
  var ligFin   = sel.getLastRow();
  var nbLig    = ligFin - ligDebut + 1;
  var nbCol    = colFin - colDebut + 1;

  if (sheet.getName() !== "MATRICE") {
    ss.toast("Aller sur la feuille MATRICE avant de colorier", "Attention", 4);
    return;
  }
  if (colDebut < COL_VIS_DEBUT || colFin > COL_VIS_FIN) {
    ss.toast("Selectionner des cellules dans la zone horaire (H a BS)", "Attention", 4);
    return;
  }

  sel.setBackground(cfg.bg).setFontColor(cfg.fg);

  var vals = [];
  for (var r = 0; r < nbLig; r++) {
    var row = [];
    for (var c = 0; c < nbCol; c++) row.push(cfg.valeur);
    vals.push(row);
  }
  sheet.getRange(ligDebut, colDebut + 64, nbLig, nbCol).setValues(vals);

  majRespPoleDepuisLignes_(sheet, ligDebut, ligFin);
  ss.toast(cfg.label + " applique", "Planning NOZ", 3);
}

// ─── REPOS — toute la journee 6h-21h ─────────────────────────
function btn_REPOS() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sel   = ss.getActiveRange();
  var sheet = sel.getSheet();

  if (sheet.getName() !== "MATRICE") {
    ss.toast("Aller sur la feuille MATRICE", "Attention", 4);
    return;
  }

  var ligDebut = sel.getRow();
  var ligFin   = sel.getLastRow();
  var nbLig    = ligFin - ligDebut + 1;

  sheet.getRange(ligDebut, 8, nbLig, 64).setBackground("#000000").setFontColor("#FFFFFF");
  sheet.getRange(ligDebut, 72, nbLig, 64).clearContent();

  majRespPoleDepuisLignes_(sheet, ligDebut, ligFin);
  ss.toast("Repos applique sur toute la journee (6h-21h)", "Planning NOZ", 3);
}

// ─── VIDER — efface toute la ligne si Repos, sinon la selection ──
function btn_VIDER() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sel   = ss.getActiveRange();
  var sheet = sel.getSheet();

  if (sheet.getName() !== "MATRICE") {
    ss.toast("Aller sur la feuille MATRICE", "Attention", 4);
    return;
  }

  var ligDebut = sel.getRow();
  var ligFin   = sel.getLastRow();
  var nbLig    = ligFin - ligDebut + 1;

  var bgCellule = sheet.getRange(ligDebut, 8).getBackground();
  var estRepos  = (bgCellule === "#000000");

  if (estRepos) {
    sheet.getRange(ligDebut, 8, nbLig, 64).setBackground(null).setFontColor("#000000").clearContent();
    sheet.getRange(ligDebut, 72, nbLig, 64).clearContent();
  } else {
    var colDebut = sel.getColumn();
    var colFin   = sel.getLastColumn();
    if (colDebut >= 8 && colFin <= 71) {
      sel.setBackground(null).setFontColor("#000000").clearContent();
      sheet.getRange(ligDebut, colDebut + 64, nbLig, colFin - colDebut + 1).clearContent();
    } else {
      ss.toast("Selectionner des cellules dans la zone horaire (H a BS)", "Attention", 4);
      return;
    }
  }

  majRespPoleDepuisLignes_(sheet, ligDebut, ligFin);
  ss.toast("Efface !", "Planning NOZ", 2);
}

function btn_POLE1()    { appliquerPole_("POLE1");    }
function btn_POLE2()    { appliquerPole_("POLE2");    }
function btn_POLE3()    { appliquerPole_("POLE3");    }
function btn_DIVERS()   { appliquerPole_("DIVERS");   }
function btn_CAISSES()  { appliquerPole_("CAISSES");  }
function btn_SURGELE()  { appliquerPole_("SURGELE");  }
function btn_TDM()      { appliquerPole_("TDM");      }
function btn_BOUTIQUE() { appliquerPole_("BOUTIQUE"); }
function btn_NETT()     { appliquerPole_("NETT");     }
function btn_ECOLE()    { appliquerPole_("ECOLE");    }

// ─── EFFACER UN JOUR ─────────────────────────────────────────
function effacerJour_(nom) {
  var ui    = SpreadsheetApp.getUi();
  var msg   = nom === "TOUT" ? "TOUTE LA SEMAINE" : nom;
  var rep   = ui.alert("Confirmation", "Effacer " + msg + " ?", ui.ButtonSet.YES_NO);
  if (rep !== ui.Button.YES) return;
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("MATRICE");
  var noms  = nom === "TOUT" ? Object.keys(JOURS) : [nom];
  for (var i = 0; i < noms.length; i++) {
    var cfg   = JOURS[noms[i]];
    var nbLig = cfg.fin - cfg.debut + 1;
    sheet.getRange(cfg.debut, COL_VIS_DEBUT, nbLig, 64).clearContent().setBackground(null);
    sheet.getRange(cfg.debut, COL_CNT_DEBUT, nbLig, 64).clearContent();
    sheet.getRange(cfg.debut, 6, nbLig, 2).clearContent();
    majResponsablePoleJour_(sheet, noms[i]);
  }
  ss.toast(msg + " efface !", "Planning NOZ", 3);
}

function effacer_LUNDI()    { effacerJour_("LUNDI");    }
function effacer_MARDI()    { effacerJour_("MARDI");    }
function effacer_MERCREDI() { effacerJour_("MERCREDI"); }
function effacer_JEUDI()    { effacerJour_("JEUDI");    }
function effacer_VENDREDI() { effacerJour_("VENDREDI"); }
function effacer_SAMEDI()   { effacerJour_("SAMEDI");   }
function effacer_DIMANCHE() { effacerJour_("DIMANCHE"); }
function effacer_TOUT()     { effacerJour_("TOUT");     }

// ─── ALERTES LEGISLATIVES ────────────────────────────────────
function alertes_legislatives() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("MATRICE");
  ss.toast("Analyse en cours...", "Alertes", 5);
  var rapport = [], total = 0;
  var noms = Object.keys(JOURS);
  for (var d = 0; d < noms.length; d++) {
    var nomJour = noms[d];
    var cfg     = JOURS[nomJour];
    var nbLig   = cfg.fin - cfg.debut + 1;
    var data    = sheet.getRange(cfg.debut, 1, nbLig, COL_VIS_FIN).getValues();
    for (var i = 0; i < nbLig; i++) {
      var row      = data[i];
      var fonction = String(row[0] || "").trim();
      var hContrat = Number(row[1] || 0);
      var prenom   = String(row[5] || "").trim();
      var nom      = String(row[6] || "").trim();
      if (!fonction || fonction === "Gerant" || (!prenom && !nom)) continue;
      var employe  = (prenom + " " + nom).trim() || fonction;
      var partiel  = hContrat < 35;
      var hDeb = -1, hFin = -1, nbCren = 0;
      var nbPauses = 0, durPause = 0, enPause = false, debPause = -1;
      for (var c = 7; c < 71; c++) {
        var val   = Number(row[c] || 0);
        var heure = 6 + (c - 7) * 0.25;
        if (val > 0) {
          if (hDeb < 0) hDeb = heure;
          hFin = heure + 0.25; nbCren++;
          if (enPause) { durPause += heure - debPause; nbPauses++; enPause = false; debPause = -1; }
        } else {
          if (!enPause && hDeb >= 0) { enPause = true; debPause = heure; }
        }
      }
      if (hDeb < 0) continue;
      var durTrav = nbCren * 0.25;
      var amp     = hFin - hDeb;
      var alertes = [];
      if (durTrav > 10)                   alertes.push("Duree " + durTrav.toFixed(2) + "h > 10h max");
      if (durTrav > 0 && durTrav < 3.5)  alertes.push("Duree " + durTrav.toFixed(2) + "h < 3h30 min");
      if (amp > 13)                       alertes.push("Amplitude " + amp.toFixed(2) + "h > 13h");
      if (durTrav > 6 && nbPauses === 0)  alertes.push("Travail > 6h sans coupure");
      if (nbPauses > 0 && durPause < 0.5) alertes.push("Coupure " + Math.round(durPause*60) + "min < 30min");
      if (nbPauses > 1)                   alertes.push(nbPauses + " coupures (1 seule/jour)");
      if (partiel && durPause >= 2)       alertes.push("Coupure > 1h59 temps partiel");
      if (alertes.length > 0) {
        total += alertes.length;
        rapport.push(nomJour + " - " + employe + " :");
        for (var a = 0; a < alertes.length; a++) rapport.push("  ! " + alertes[a]);
        sheet.getRange(cfg.debut + i, 6).setBackground("#FFCCCC").setFontWeight("bold");
      } else {
        sheet.getRange(cfg.debut + i, 6).setBackground(null).setFontWeight("normal");
      }
    }
  }
  var ui = SpreadsheetApp.getUi();
  if (total === 0) {
    ui.alert("OK", "Aucune alerte - planning conforme.", ui.ButtonSet.OK);
  } else {
    ui.alert("Alertes (" + total + ")", rapport.slice(0, 25).join("\n"), ui.ButtonSet.OK);
  }
}

// ─── NAVIGATION ──────────────────────────────────────────────
function planning_individuel() { SpreadsheetApp.getActiveSpreadsheet().getSheetByName("INDIVIDUEL").activate(); }
function planning_sem()        { SpreadsheetApp.getActiveSpreadsheet().getSheetByName("RECAP").activate(); }
function aller_MATRICE()       { SpreadsheetApp.getActiveSpreadsheet().getSheetByName("MATRICE").activate(); }
function recap_hebdo()         { planning_sem(); }
function planning_pole() {
  var s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("RESPONSABLE_POLE");
  if (s) s.activate();
}

// ─── ZOOM ────────────────────────────────────────────────────
function zoom_plus()  { SpreadsheetApp.getActiveSpreadsheet().toast("Zoom : Ctrl + Shift + =", "Zoom +", 4); }
function zoom_moins() { SpreadsheetApp.getActiveSpreadsheet().toast("Zoom : Ctrl + -", "Zoom -", 4); }

// ─── NOMBRE DE PERSONNES ─────────────────────────────────────
function nombre_personnes() {
  var ui  = SpreadsheetApp.getUi();
  var rep = ui.prompt("Nombre de personnes", "Combien d'employes cette semaine ? (1 a 23)", ui.ButtonSet.OK_CANCEL);
  if (rep.getSelectedButton() !== ui.Button.OK) return;
  var nb = parseInt(rep.getResponseText());
  if (isNaN(nb) || nb < 1 || nb > 23) { ui.alert("Valeur invalide (1 a 23)."); return; }
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("MATRICE");
  var noms  = Object.keys(JOURS);
  for (var i = 0; i < noms.length; i++) {
    var cfg   = JOURS[noms[i]];
    var total = cfg.fin - cfg.debut + 1;
    sheet.showRows(cfg.debut, nb);
    if (total - nb > 0) sheet.hideRows(cfg.debut + nb, total - nb);
  }
  SpreadsheetApp.getActiveSpreadsheet().toast(nb + " personnes configurees", "Planning NOZ", 3);
}

// ─── ENREGISTRER SOUS ────────────────────────────────────────
function enregistrer_sous() {
  var ss   = SpreadsheetApp.getActiveSpreadsheet();
  var url  = "https://docs.google.com/spreadsheets/d/" + ss.getId() + "/copy";
  var html = HtmlService.createHtmlOutput(
    '<script>window.open("' + url + '","_blank");google.script.host.close();<\/script>'
  ).setWidth(10).setHeight(10);
  SpreadsheetApp.getUi().showModalDialog(html, "Copie du planning...");
}

// ─── IMPRESSION ──────────────────────────────────────────────
function imprimer_(nomFeuille) {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(nomFeuille);
  if (!sheet) { SpreadsheetApp.getUi().alert("Feuille " + nomFeuille + " introuvable !"); return; }
  sheet.activate();
  var url  = "https://docs.google.com/spreadsheets/d/" + ss.getId()
    + "/export?format=pdf&gid=" + sheet.getSheetId()
    + "&size=A4&portrait=false&fitw=true&gridlines=false&printtitle=false";
  var html = HtmlService.createHtmlOutput(
    '<script>window.open("' + url + '","_blank");google.script.host.close();<\/script>'
  ).setWidth(10).setHeight(10);
  SpreadsheetApp.getUi().showModalDialog(html, "Ouverture PDF...");
}

function btn_imprimer()        { imprimer_("MATRICE");    }
function imprimer_MATRICE()    { imprimer_("MATRICE");    }
function imprimer_RECAP()      { imprimer_("RECAP");      }
function imprimer_INDIVIDUEL() { imprimer_("INDIVIDUEL"); }

// ─── CONFIGURATION LISTES DEROULANTES ────────────────────────
function configurer_listes() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var feuilleEmp = ss.getSheetByName("EMPLOYES");
  if (!feuilleEmp) feuilleEmp = ss.insertSheet("EMPLOYES");

  feuilleEmp.getRange("A1").setValue("PRENOM").setFontWeight("bold").setBackground("#1B2A4A").setFontColor("#FFFFFF");
  feuilleEmp.getRange("B1").setValue("NOM").setFontWeight("bold").setBackground("#1B2A4A").setFontColor("#FFFFFF");
  feuilleEmp.setColumnWidth(1, 150);
  feuilleEmp.setColumnWidth(2, 150);
  feuilleEmp.getRange("A1:B30").setBorder(true, true, true, true, true, true);

  var fonctions = ["Gerant","AEM","AM","EMP","Contrat Pro","Stagiaire"];
  var rule_fonctions = SpreadsheetApp.newDataValidation()
    .requireValueInList(fonctions, true).setAllowInvalid(false).build();

  var matrice = ss.getSheetByName("MATRICE");
  var blocs_A = ["A17:A39","A59:A81","A101:A123","A143:A165","A185:A207","A227:A249","A269:A291"];
  for (var i = 0; i < blocs_A.length; i++) matrice.getRange(blocs_A[i]).setDataValidation(rule_fonctions);

  var rule_prenom = SpreadsheetApp.newDataValidation()
    .requireValueInRange(feuilleEmp.getRange("A2:A30"), true).setAllowInvalid(true).build();
  var blocs_F = ["F17:F39","F59:F81","F101:F123","F143:F165","F185:F207","F227:F249","F269:F291"];
  for (var j = 0; j < blocs_F.length; j++) matrice.getRange(blocs_F[j]).setDataValidation(rule_prenom);

  var rule_nom = SpreadsheetApp.newDataValidation()
    .requireValueInRange(feuilleEmp.getRange("B2:B30"), true).setAllowInvalid(true).build();
  var blocs_G = ["G17:G39","G59:G81","G101:G123","G143:G165","G185:G207","G227:G249","G269:G291"];
  for (var k = 0; k < blocs_G.length; k++) matrice.getRange(blocs_G[k]).setDataValidation(rule_nom);

  ss.toast("Configuration terminee ! Remplis la feuille EMPLOYES avec tes noms.", "Planning NOZ", 6);
  feuilleEmp.activate();
}

// ─── REMPLISSAGE AUTO NOM QUAND PRENOM CHOISI ────────────────
function onEdit(e) {
  var sheet = e.range.getSheet();
  if (sheet.getName() !== "MATRICE") return;
  var col = e.range.getColumn();
  var row = e.range.getRow();
  if (col !== 6) return;
  var prenom = String(e.value || "").trim();
  if (!prenom) { sheet.getRange(row, 7).clearContent(); return; }
  var ss       = SpreadsheetApp.getActiveSpreadsheet();
  var employes = ss.getSheetByName("EMPLOYES");
  if (!employes) return;
  var data = employes.getRange("A2:B30").getValues();
  for (var i = 0; i < data.length; i++) {
    var prenomEmp = String(data[i][0] || "").trim();
    var nomEmp    = String(data[i][1] || "").trim();
    if (prenomEmp.toLowerCase() === prenom.toLowerCase() && nomEmp) {
      sheet.getRange(row, 7).setValue(nomEmp);
      return;
    }
  }
}

// ─── SUPPRIMER BOUTONS BOUTIQUES ET ZOOMS ────────────────────
function supprimer_boutons_inutiles() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var noms  = ["MATRICE","RECAP","INDIVIDUEL","RESPONSABLE_POLE"];
  var count = 0;
  for (var n = 0; n < noms.length; n++) {
    var sheet = ss.getSheetByName(noms[n]);
    if (!sheet) continue;
    var drawings = sheet.getDrawings();
    for (var d = 0; d < drawings.length; d++) {
      try {
        var action = String(drawings[d].getOnAction() || "").toLowerCase();
        if (action === "btn_boutique" || action === "zoom_plus" || action === "zoom_moins") {
          drawings[d].remove();
          count++;
        }
      } catch(e) {}
    }
  }
  ss.toast(count + " bouton(s) supprimes !", "Planning NOZ", 3);
}

// ─── SUPPRIMER BOUTONS PAR TEXTE ─────────────────────────────
function supprimer_boutons_v2() {
  var ss       = SpreadsheetApp.getActiveSpreadsheet();
  var sheets   = ss.getSheets();
  var count    = 0;
  var motsCles = ["boutique","zoom"];
  for (var n = 0; n < sheets.length; n++) {
    var sheet    = sheets[n];
    var drawings = sheet.getDrawings();
    for (var d = drawings.length - 1; d >= 0; d--) {
      try {
        var action = String(drawings[d].getOnAction() || "").toLowerCase();
        var col    = drawings[d].getContainerInfo().getAnchorColumn();
        var row    = drawings[d].getContainerInfo().getAnchorRow();
        var suppr  = false;
        for (var m = 0; m < motsCles.length; m++) {
          if (action.indexOf(motsCles[m]) >= 0) suppr = true;
        }
        if (!action && row <= 2 && col <= 2) suppr = true;
        if (suppr) { drawings[d].remove(); count++; }
      } catch(e) {}
    }
  }
  ss.toast(count + " bouton(s) supprimes !", "Planning NOZ", 3);
}

// ============================================================
// BOUTONS → FONCTIONS (clic droit → Attribuer un script)
// Pole 1              → btn_POLE1
// Pole 2              → btn_POLE2
// Pole 3              → btn_POLE3
// Divers              → btn_DIVERS
// Caisses             → btn_CAISSES
// Surg.               → btn_SURGELE
// TDM                 → btn_TDM
// Boutiques           → btn_BOUTIQUE
// Nett                → btn_NETT
// Ecole               → btn_ECOLE        ← NOUVEAU
// Repos               → btn_REPOS
// Vider               → btn_VIDER
// Planning individuel → planning_individuel
// Planning Sem        → planning_sem
// Recap Hebdo         → recap_hebdo
// Retour a la matrice → aller_MATRICE
// Zoom -              → zoom_moins
// Zoom +              → zoom_plus
// Imprimer            → btn_imprimer
// Nombre de personnes → nombre_personnes
// Enregistrer sous    → enregistrer_sous
// Planning Pole       → planning_pole
// ============================================================
