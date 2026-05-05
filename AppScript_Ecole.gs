// =============================================
//  NOZ P854 — Apps Script : ajout tâche ÉCOLE
//  Code tâche : 5  |  Couleur : violet #9B59B6
//
//  INSTALLATION :
//  1. Ouvrir le Google Sheet MATRICE
//  2. Extensions → Apps Script
//  3. Coller ce code, Enregistrer
//  4. Lancer ajouterEcole()
// =============================================

// Couleur violet pour École (identique à l'app)
const COULEUR_ECOLE   = '#9B59B6';  // violet
const CODE_ECOLE      = '5';

// Couleurs des autres tâches (pour la mise en forme conditionnelle)
const COULEURS_TACHES = {
  '1': '#C0392B',  // Pôle 1  — rouge
  '2': '#00BCD4',  // TDM     — cyan
  '3': '#2980B9',  // Pôle 3  — bleu
  '5': '#9B59B6',  // École   — violet  ← NOUVEAU
  '6': '#7D5A2E',  // Divers  — marron
  '7': '#27AE60',  // Pôle 2  — vert
  '8': '#F39C12',  // Caisses — orange
};

// ——— FONCTION PRINCIPALE ————————————————————
function ajouterEcole() {
  const ss     = SpreadsheetApp.getActiveSpreadsheet();
  const matrice = ss.getSheetByName('MATRICE');

  if (!matrice) {
    SpreadsheetApp.getUi().alert('Feuille MATRICE introuvable.');
    return;
  }

  // 1. Ajouter la mise en forme conditionnelle pour le code 5
  ajouterMiseEnFormeConditionnelle(matrice);

  // 2. Mettre à jour la légende dans la feuille
  mettreAJourLegende(ss);

  SpreadsheetApp.getUi().alert('✅ École (code 5) ajouté avec succès !\n\nDans la grille MATRICE, tape "5" dans une cellule pour affecter École à un employé.');
}

// ——— MISE EN FORME CONDITIONNELLE ———————————
function ajouterMiseEnFormeConditionnelle(sheet) {
  // Plage de la grille horaire : colonnes I à JB (9 à 270), toutes les lignes employés
  // Adapter si ta grille commence ailleurs
  const plageGrille = sheet.getRange('I1:JB500');

  const regles = sheet.getConditionalFormatRules();

  // Vérifier si la règle pour code 5 existe déjà
  const dejaPresente = regles.some(r => {
    const cond = r.getBooleanCondition();
    return cond && cond.getCriteriaValues &&
           String(cond.getCriteriaValues()[0]).includes('5');
  });

  if (!dejaPresente) {
    const nouvelleRegle = SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo(CODE_ECOLE)
      .setBackground(COULEUR_ECOLE)
      .setFontColor('#FFFFFF')
      .setRanges([plageGrille])
      .build();
    regles.push(nouvelleRegle);
    sheet.setConditionalFormatRules(regles);
    Logger.log('Règle conditionnelle École (code 5) ajoutée.');
  } else {
    Logger.log('Règle conditionnelle École déjà présente.');
  }
}

// ——— MISE À JOUR LÉGENDE ————————————————————
function mettreAJourLegende(ss) {
  // Cherche une feuille "Légende" ou la crée
  let legende = ss.getSheetByName('Légende');
  if (!legende) {
    legende = ss.insertSheet('Légende');
    legende.getRange('A1').setValue('Code').setFontWeight('bold');
    legende.getRange('B1').setValue('Tâche').setFontWeight('bold');
    legende.getRange('C1').setValue('Couleur').setFontWeight('bold');
  }

  // Données des tâches
  const taches = [
    ['1', 'Pôle 1',  '#C0392B'],
    ['2', 'TDM',     '#00BCD4'],
    ['3', 'Pôle 3',  '#2980B9'],
    ['5', 'École',   '#9B59B6'],
    ['6', 'Divers',  '#7D5A2E'],
    ['7', 'Pôle 2',  '#27AE60'],
    ['8', 'Caisses', '#F39C12'],
  ];

  // Écrire à partir de la ligne 2
  taches.forEach((t, i) => {
    const row = i + 2;
    legende.getRange(row, 1).setValue(t[0]);
    legende.getRange(row, 2).setValue(t[1]);
    const cell = legende.getRange(row, 3);
    cell.setValue(t[2]);
    cell.setBackground(t[2]);
    cell.setFontColor('#FFFFFF');
  });

  Logger.log('Légende mise à jour.');
}

// ——— OPTIONNEL : colorier manuellement une plage ———
// Sélectionne des cellules dans MATRICE et lance cette fonction
// pour les passer en code 5 (École) avec la bonne couleur
function marquerSelectionEcole() {
  const ss     = SpreadsheetApp.getActiveSpreadsheet();
  const sheet  = ss.getActiveSheet();
  const range  = sheet.getActiveRange();

  range.setValue(CODE_ECOLE);
  range.setBackground(COULEUR_ECOLE);
  range.setFontColor('#FFFFFF');

  Logger.log(`${range.getA1Notation()} marqué comme École (code 5).`);
}
