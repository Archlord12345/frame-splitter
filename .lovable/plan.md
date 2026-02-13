

# 🎬 Application de Découpage Vidéo en Images

## Vue d'ensemble
Application web permettant d'importer une vidéo et d'en extraire des images (frames), avec trois modes d'extraction, une galerie d'aperçu, et la sauvegarde des projets via un backend.

---

## 1. Page d'accueil & Authentification
- Page de présentation de l'application avec un appel à l'action
- Inscription / Connexion via email (Supabase Auth)
- Accès au tableau de bord après connexion

## 2. Tableau de bord utilisateur
- Liste des projets d'extraction précédents (historique)
- Bouton pour créer un nouveau projet d'extraction
- Possibilité de supprimer d'anciens projets

## 3. Page d'extraction vidéo (cœur de l'app)
- **Import vidéo** : glisser-déposer ou sélection de fichier (formats courants : MP4, WebM, MOV)
- **Lecteur vidéo intégré** avec barre de progression et contrôles (play, pause, avancer/reculer)
- **3 modes d'extraction** :
  - ⏱ **Intervalle régulier** : choisir un intervalle (ex : 1 image toutes les 2 secondes)
  - 🔢 **Nombre total d'images** : indiquer combien d'images extraire, réparties uniformément sur la durée
  - 🖱 **Manuel** : naviguer dans la vidéo et cliquer pour capturer une image à l'instant souhaité
- Extraction réalisée côté navigateur via l'API Canvas (pas besoin d'envoyer la vidéo au serveur pour l'extraction)

## 4. Galerie d'aperçu
- Affichage en grille de toutes les images extraites avec timestamp
- Possibilité de sélectionner/désélectionner des images individuelles
- Suppression d'images non souhaitées avant export

## 5. Export des images
- **Téléchargement en ZIP** : toutes les images sélectionnées dans un fichier ZIP
- **Téléchargement individuel** : clic sur une image pour la télécharger seule
- Format de sortie : PNG ou JPEG (choix utilisateur)

## 6. Sauvegarde backend (Supabase)
- Sauvegarde des métadonnées du projet (nom de la vidéo, paramètres d'extraction, date)
- Stockage des images extraites dans Supabase Storage
- Possibilité de retrouver et re-télécharger ses images depuis l'historique

## 7. Design & UX
- Interface moderne et épurée, responsive (desktop et mobile)
- Thème sombre/clair
- Indicateurs de progression lors de l'extraction
- Notifications de succès/erreur via toasts

