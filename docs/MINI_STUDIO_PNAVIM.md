# Mini Studio PNAVIM - Voice Production Platform

## Overview

Le Mini Studio PNAVIM est une plateforme intégrée de production vocale qui permet aux administrateurs de créer, transformer et gérer les contenus vocaux pour l'assistant vocal SUTA et les commerçants du réseau PNAVIM.

## Fonctionnalités

### 1. Enregistrement Vocal
- **Enregistrement direct** depuis le navigateur avec MediaRecorder API
- **Support pause/reprise** pendant l'enregistrement
- **Timer en temps réel** pour suivre la durée
- **Prévisualisation** avant upload
- **Texte du script** optionnel pour documentation

### 2. Transformation Vocale (Speech-to-Speech)
- **Transformation automatique** avec ElevenLabs API
- **3 voix SUTA disponibles**:
  - Tantie Akissi (voix maternelle et chaleureuse)
  - Pro Bill (voix professionnelle et confiante)
  - Ambianceur Patrick (voix enjouée et motivante)
- **Traitement asynchrone** avec suivi du statut
- **Téléchargement** des audios transformés

### 3. Bibliothèque de Contenus
- **Gestion centralisée** de tous les enregistrements
- **Recherche** par texte ou ID
- **Lecture directe** dans le navigateur
- **Métadonnées** (durée, taille, date)
- **Suppression** avec confirmation

## Architecture Technique

### Base de Données

#### Tables
1. **voice_recordings** - Enregistrements originaux
   - id (uuid)
   - admin_user_id (integer)
   - original_text (text)
   - audio_url (text)
   - duration_seconds (integer)
   - file_size_bytes (integer)
   - status (draft/processing/completed/failed)
   - metadata (jsonb)

2. **voice_transformations** - Transformations vocales
   - id (uuid)
   - recording_id (uuid)
   - source_voice_id (text)
   - target_voice_id (text)
   - transformation_type (speech_to_speech/text_to_speech)
   - output_audio_url (text)
   - status (pending/processing/completed/failed)
   - processing_time_ms (integer)

3. **voice_personas_custom** - Voix personnalisées
   - id (uuid)
   - name (text)
   - description (text)
   - elevenlabs_voice_id (text)
   - sample_audio_url (text)
   - is_active (boolean)

#### Sécurité
- **RLS activé** sur toutes les tables
- **Accès admin uniquement** pour créer/modifier
- **Politiques strictes** basées sur le rôle utilisateur

### Backend (TRPC)

#### Routes API (`voiceProduction.*`)

**Enregistrements**
- `uploadRecording` - Obtenir URL signée pour upload
- `listRecordings` - Lister avec filtres
- `getRecording` - Récupérer un enregistrement
- `updateRecording` - Modifier métadonnées
- `deleteRecording` - Supprimer (cascade transformations)

**Transformations**
- `transformVoice` - Lancer transformation asynchrone
- `getTransformation` - État d'une transformation
- `listTransformations` - Historique transformations

**Voix Personnalisées**
- `createCustomPersona` - Ajouter nouvelle voix
- `listCustomPersonas` - Lister voix actives
- `updateCustomPersona` - Modifier voix
- `deleteCustomPersona` - Supprimer voix

### Frontend (React)

#### Composants Principaux

**VoiceStudio** (`/admin/voice-studio`)
- Page principale avec onglets
- Navigation Enregistrer/Transformer/Bibliothèque
- État partagé pour sélection enregistrement

**VoiceRecordingWidget**
- Interface d'enregistrement
- Contrôles lecture/pause/stop
- Upload vers storage

**VoiceTransformationPanel**
- Sélection voix cible
- Lancement transformations
- Affichage historique avec lecture/téléchargement

**VoiceLibrary**
- Grille d'enregistrements
- Recherche et filtres
- Actions (écouter/transformer/supprimer)

## Workflow Utilisateur

### Scénario 1: Créer un nouveau message vocal

1. **Enregistrer**
   - Cliquer sur onglet "Enregistrer"
   - Optionnel: saisir le texte du script
   - Cliquer sur microphone
   - Enregistrer le message
   - Stop et écouter
   - Upload vers la bibliothèque

2. **Transformer**
   - Passage automatique à l'onglet "Transformer"
   - Sélectionner la voix SUTA désirée
   - Cliquer "Transformer la voix"
   - Attendre le traitement (3-10s)
   - Écouter le résultat
   - Télécharger si satisfait

3. **Réutiliser**
   - Aller dans "Bibliothèque"
   - Retrouver l'enregistrement
   - Créer d'autres transformations avec d'autres voix

### Scénario 2: Transformer un enregistrement existant

1. Aller dans "Bibliothèque"
2. Rechercher l'enregistrement
3. Cliquer "Transformer"
4. Sélectionner nouvelle voix
5. Télécharger le résultat

## Intégration ElevenLabs

### Configuration Requise

Variables d'environnement:
```
ELEVENLABS_API_KEY=<your-api-key>
ELEVENLABS_TANTIE_VOICE_ID=<tantie-voice-id>
ELEVENLABS_PRO_VOICE_ID=<pro-voice-id>
ELEVENLABS_AMBIANCEUR_VOICE_ID=<ambianceur-voice-id>
```

### APIs Utilisées

**Speech-to-Speech** (`/v1/speech-to-speech/{voice_id}`)
- Entrée: Audio original (webm/mp3)
- Sortie: Audio transformé (mp3)
- Modèle: `eleven_multilingual_sts_v2`

**Text-to-Speech** (`/v1/text-to-speech/{voice_id}`)
- Entrée: Texte
- Sortie: Audio généré (mp3)
- Modèle: `eleven_multilingual_v2`

### Paramètres Voix

```typescript
Tantie Akissi:
  stability: 0.75
  similarity_boost: 0.85
  style: 0.3
  use_speaker_boost: true

Pro Bill:
  stability: 0.85
  similarity_boost: 0.75
  style: 0.0
  use_speaker_boost: true

Ambianceur Patrick:
  stability: 0.65
  similarity_boost: 0.80
  style: 0.5
  use_speaker_boost: true
```

## Storage

### Buckets Supabase Storage

**voice-recordings/**
- Format: `{user_id}/{timestamp}-{filename}`
- Type: audio/webm, audio/mp3
- Accès: Admin uniquement

**voice-transformations/**
- Format: `{transformation_id}/{timestamp}-output.mp3`
- Type: audio/mpeg
- Accès: Admin uniquement

### URLs Signées
- Durée: 1 heure
- Régénération automatique à chaque requête

## Cas d'Usage

### Production de Contenu
1. **Messages de bienvenue** pour nouveaux marchands
2. **Tutoriels vocaux** pour formation
3. **Notifications** contextuelles
4. **Conseils du jour** variés
5. **Messages événementiels** (fêtes, promotions)

### Personnalisation
- Adapter le ton selon le contexte
- Créer des variations d'un même message
- Tester différentes voix
- Archiver les versions approuvées

### Workflow Production
1. **Brouillon**: Script écrit par équipe contenu
2. **Enregistrement**: Voice artist enregistre
3. **Transformation**: Génération versions SUTA
4. **Validation**: Écoute et sélection meilleure version
5. **Publication**: Intégration dans l'app

## Limitations et Considérations

### Techniques
- **Taille max fichier**: 10 MB (limite MediaRecorder)
- **Durée max**: 5 minutes par enregistrement
- **Formats supportés**: webm (enregistrement), mp3 (transformation)
- **Traitement async**: 3-10s selon durée audio

### Coûts ElevenLabs
- Speech-to-Speech: ~30 caractères/seconde d'audio
- Text-to-Speech: Coût direct par caractère
- Monitorer usage mensuel

### UX
- Demande permission microphone
- Pas de support hors ligne
- Compatible navigateurs modernes (Chrome, Firefox, Safari)

## Évolutions Futures

### V1.1 - Édition Audio
- Trim début/fin
- Normalisation volume
- Suppression silences

### V1.2 - Batch Processing
- Upload multiple fichiers
- Transformation en masse
- Export ZIP

### V1.3 - Analytics
- Statistiques d'usage
- Voix les plus utilisées
- Temps de traitement moyens

### V1.4 - Clonage Vocal
- Upload échantillons voix custom
- Création voix ElevenLabs
- Gestion voix personnalisées

## Support et Maintenance

### Logs
- Tous les appels API ElevenLabs sont loggés
- Erreurs de transformation sauvegardées
- Métriques de performance disponibles

### Monitoring
- Statut transformations en temps réel
- Alertes si échecs répétés
- Surveillance quotas ElevenLabs

### Backup
- Enregistrements originaux préservés
- Transformations archivées
- Métadonnées versionnées

## Accès

**URL**: `/admin/voice-studio`
**Rôle requis**: Admin
**Navigation**: Admin Dashboard → Voice Studio

---

**Version**: 1.0.0
**Date**: Janvier 2026
**Équipe**: PNAVIM Tech
