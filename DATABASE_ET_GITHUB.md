# Guide : Gestion de la Base de Données des Candidats & Upload vers GitHub
# دليل : إدارة وتعبئة قاعدة بيانات المترشحين والرفع إلى GitHub

---

## 1. Remplir la liste des candidats avec une base de données
## 1. تعبئة قائمة المترشحين بواسطة قاعدة بيانات

L'application intègre désormais un **Gestionnaire de Base de Données complet** accessible depuis le bouton noir **« Base de Données / GitHub »** (ou **قاعدة البيانات / GitHub**) dans la barre de navigation supérieure.

### Formats pris en charge :
1. **Fichier JSON (.json)** :
   - Fichier de base de données structurée.
   - Idéal pour les sauvegardes complètes (incluant tous les statuts des 11 documents officiels, les rôles, les dates et coordonnées).
2. **Tableau Excel CSV (.csv)** :
   - Tableau avec séparateur virgule ou point-virgule, encodé en UTF-8 pour supporter les caractères arabes.
   - Mappe automatiquement les en-têtes en arabe ou en français (`NIN`, `اللقب`, `الاسم`, `Nom`, `Prénom`, `المجلس`, `Conseil`, `Date Naissance`, `Téléphone`, `Profession`, etc.).

### Modes d'importation :
- **Remplacer toute la liste (استبدال وتفريغ القائمة)** : Efface la liste actuelle et charge intégralement votre nouvelle base de données.
- **Fusionner & Ajouter (دمج وإضافة)** : Met à jour les candidats existants (par NIN ou identifiant) et ajoute les nouveaux sans rien supprimer.

### Modèles téléchargeables :
Dans l'onglet **« 1. Importer & Remplir la Base »**, vous disposez de deux boutons :
- **« Modèle CSV Excel »** (`modele_import_candidats_fln.csv`) : prêt à être ouvert et rempli dans Excel ou Google Sheets.
- **« Modèle JSON »** (`modele_import_candidats_fln.json`) : modèle JSON prêt à l'emploi.

---

## 2. Uploader et publier votre projet sur GitHub
## 2. كيفية رفع التطبيق وقاعدة البيانات إلى GitHub

### Méthode 1 : Export Direct depuis Google AI Studio (La plus simple)
1. En haut à droite de l'écran Google AI Studio, cliquez sur le menu **Paramètres (Settings / Share)**.
2. Cliquez sur l'option **« Export to GitHub »**.
3. Autorisez votre compte GitHub et choisissez le nom du dépôt (ex : `fln-bologhine-elections-2026`).
4. Cliquez sur **Create / Push**. Votre code et votre application sont instantanément mis en ligne sur GitHub !

### Pour que vos candidats soient enregistrés de manière permanente sur GitHub :
1. Ouvrez le modal **« Base de Données / GitHub »** dans l'application.
2. Allez dans l'onglet **« 3. Uploader vers GitHub »** (ou **« 2. Exporter »**).
3. Cliquez sur le bouton vert **« Télécharger initialCandidates.ts »** (ou copiez le code source généré).
4. Placez ce fichier téléchargé à l'emplacement `src/data/initialCandidates.ts` de votre projet.
5. Poussez sur GitHub : tous les utilisateurs ou déploiements auront dès le départ votre liste complète de candidats !

### Méthode 2 : Ligne de commande Git (Terminal / Local)
Si vous travaillez en local ou avez téléchargé l'archive ZIP :

```bash
# Initialiser le dépôt git local
git init

# Ajouter tous les fichiers du projet
git add .

# Valider la version
git commit -m "Mise a jour de la liste des candidats FLN Bologhine"

# Définir la branche principale
git branch -M main

# Associer à votre dépôt GitHub (remplacez l'URL par la vôtre)
git remote add origin https://github.com/votre-nom/fln-bologhine-elections.git

# Pousser les fichiers vers GitHub
git push -u origin main
```
