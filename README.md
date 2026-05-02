# NOZ P854 — Application Planning

Application web de gestion de planning pour le magasin NOZ de Louvroil (P854).

## Fonctionnalités

- **Planning global** : vue semaine avec tous les employés, horaires et compteur d'heures
- **Page individuelle** : fiche détaillée par employé avec timeline visuelle
- **Calendrier simulé** : vue mensuelle avec les shifts affichés par jour
- **Export PDF** : impression directe depuis le navigateur
- Responsive (mobile + desktop)
- Compatible dark mode

## Structure du projet

```
noz-planning/
├── index.html      ← Point d'entrée
├── style.css       ← Styles
├── data.js         ← Données (employés + planning)
├── app.js          ← Logique de l'application
└── README.md
```

## Modifier le planning

Tout se passe dans `data.js` :

### Ajouter / modifier un employé
```js
{
  prenom: 'Prénom',
  nom: 'Nom',
  role: 'EMP',       // 'AM' | 'EMP' | 'CPRO'
  contrat: 35,       // heures hebdo
  shifts: [
    { j: 'Lun', deb: 9, fin: 17, task: 'Caisse' },
    { j: 'Mar', deb: 0, fin: 0,  task: null },   // REPOS = deb:0
    // ... (6 shifts : Lun → Sam)
  ],
}
```

### Tâches disponibles
| Clé | Couleur |
|-----|---------|
| `Manager` | Bleu |
| `Relais AM` | Bleu clair |
| `Polyvalent` | Vert |
| `Caisse` | Rouge |
| `Caisse-AM` | Rouge |
| `CPRO PM` | Violet |
| `MEP` | Cyan |
| `TDM` | Orange |

## Déploiement GitHub Pages

1. Créer un repo GitHub (ex: `noz-planning`)
2. Push les fichiers dans `main`
3. Aller dans **Settings → Pages → Source → Deploy from branch (main)**
4. URL : `https://[username].github.io/noz-planning/`

## Utilisation locale

Ouvrir `index.html` directement dans un navigateur — aucun serveur requis.

---

*NOZ Louvroil P854 — Gérance mandat*
