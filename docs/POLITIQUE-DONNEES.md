# Politique de Gestion des Données - PNAVIM-CI

**Version :** 1.0  
**Date :** 27 décembre 2024  
**Responsable :** ANSUT (Agence Nationale du Service Universel des Télécommunications)  
**Autorité de tutelle :** Direction Générale de l'Économie (DGE), Ministère de l'Économie et des Finances

---

## 1. Objet et Portée

La présente politique définit les règles de collecte, traitement, conservation, sécurisation et suppression des données personnelles et professionnelles des acteurs du vivrier marchand enrôlés sur la **Plateforme Nationale des Acteurs du Vivrier Marchand de Côte d'Ivoire (PNAVIM-CI)**.

Cette politique s'applique à :
- L'ANSUT (opérateur de la plateforme)
- La DGE (autorité de tutelle)
- Les agents terrain (collecteurs de données)
- Les coopératives (gestionnaires de membres)
- Les marchands (bénéficiaires)
- Les prestataires techniques (hébergement, paiements, SMS)

---

## 2. Données Collectées

### 2.1 Données d'Identité

| Donnée | Type | Obligatoire | Finalité |
|--------|------|-------------|----------|
| Nom complet | Texte | Oui | Identification du marchand |
| Date de naissance | Date | Oui | Vérification d'âge (18+ ans) |
| Numéro de téléphone | Texte | Oui | Authentification, notifications |
| Numéro CNI | Texte | Non | Vérification d'identité (optionnel) |
| Photo CNI (recto/verso) | Image | Non | Preuve d'identité (optionnel) |
| Photo de profil | Image | Non | Identification visuelle |
| Sexe | Énumération | Oui | Statistiques démographiques |

### 2.2 Données Professionnelles

| Donnée | Type | Obligatoire | Finalité |
|--------|------|-------------|----------|
| Type d'activité | Énumération | Oui | Catégorisation métier |
| Marché d'affectation | Référence | Oui | Géolocalisation, statistiques |
| Licence commerciale | Texte | Non | Preuve d'activité formelle |
| Photo de licence | Image | Non | Vérification légale |
| Produits vendus | Liste | Oui | Gestion de stock, marché virtuel |
| Chiffre d'affaires | Numérique | Non | Évaluation économique |

### 2.3 Données Financières

| Donnée | Type | Obligatoire | Finalité |
|--------|------|-------------|----------|
| Ventes quotidiennes | Numérique | Oui | Suivi d'activité, caisse |
| Transactions Mobile Money | Historique | Oui | Paiements, traçabilité |
| Cotisations CNPS | Historique | Oui | Protection sociale (retraite) |
| Cotisations CMU | Historique | Oui | Protection sociale (santé) |
| Épargne | Numérique | Non | Micro-finance, objectifs |
| Solde de caisse | Numérique | Oui | Gestion de trésorerie |

### 2.4 Données de Géolocalisation

| Donnée | Type | Obligatoire | Finalité |
|--------|------|-------------|----------|
| GPS du marché | Coordonnées | Oui | Cartographie SIG, itinéraires |
| GPS de l'enrôlement | Coordonnées | Oui | Vérification terrain, audit |

### 2.5 Données Techniques

| Donnée | Type | Obligatoire | Finalité |
|--------|------|-------------|----------|
| Logs d'authentification | Historique | Oui | Sécurité, audit |
| Logs d'actions | Historique | Oui | Traçabilité, support |
| Adresse IP | Texte | Oui | Sécurité, anti-fraude |
| User-Agent | Texte | Oui | Compatibilité, statistiques |

---

## 3. Finalités du Traitement

Les données sont collectées et traitées pour les finalités suivantes :

1. **Inclusion financière numérique** : Donner accès aux services financiers digitaux (Mobile Money, épargne)
2. **Protection sociale** : Faciliter l'adhésion à la CNPS (retraite) et CMU (santé)
3. **Formalisation de l'économie informelle** : Enregistrer les acteurs du vivrier dans le système formel
4. **Gestion d'activité** : Fournir des outils de caisse, stock, marché virtuel
5. **Statistiques nationales** : Produire des indicateurs économiques pour l'État
6. **Cartographie SIG** : Visualiser la répartition géographique des acteurs
7. **Support et assistance** : Résoudre les problèmes techniques et métier

---

## 4. Base Légale du Traitement

Le traitement des données repose sur les bases légales suivantes :

- **Intérêt public** : Mission de service public confiée à l'ANSUT par l'État ivoirien
- **Consentement éclairé** : Acceptation explicite des marchands lors de l'enrôlement
- **Obligation légale** : Conformité avec les lois sur la protection sociale (CNPS, CMU)
- **Exécution d'un contrat** : Fourniture des services de la plateforme

---

## 5. Qui Accède aux Données ?

### 5.1 Accès par Rôle

| Rôle | Données Accessibles | Restrictions |
|------|---------------------|--------------|
| **Marchand** | Ses propres données uniquement | Pas d'accès aux autres marchands |
| **Agent Terrain** | Marchands qu'il a enrôlés | Pas d'accès aux marchands d'autres agents |
| **Coopérative** | Ses membres uniquement | Pas d'accès aux non-membres |
| **Administrateur ANSUT** | Toutes les données (lecture seule) | Logs d'audit obligatoires |
| **Administrateur DGE** | Statistiques agrégées uniquement | Pas d'accès aux données individuelles |

### 5.2 Accès Tiers

| Tiers | Données Partagées | Finalité | Base Légale |
|-------|-------------------|----------|-------------|
| **InTouch (Mobile Money)** | Téléphone, montants | Paiements | Exécution du contrat |
| **CNPS** | Nom, téléphone, cotisations | Protection sociale | Obligation légale |
| **CMU** | Nom, téléphone, cotisations | Protection sociale | Obligation légale |
| **Brevo (SMS)** | Téléphone | Notifications | Intérêt légitime |
| **Resend (Email)** | Email (si fourni) | Notifications | Intérêt légitime |
| **Manus Platform (Hébergement)** | Toutes les données | Infrastructure technique | Exécution du contrat |

**Aucune donnée n'est vendue ou cédée à des tiers commerciaux.**

---

## 6. Durée de Conservation

| Type de Donnée | Durée de Conservation | Justification |
|----------------|----------------------|---------------|
| **Données d'identité** | Durée de vie du compte + 5 ans | Obligation légale comptable |
| **Transactions financières** | 10 ans | Obligation légale comptable (Code de Commerce) |
| **Cotisations CNPS/CMU** | 10 ans | Obligation légale (Code de Sécurité Sociale) |
| **Logs d'audit** | 3 ans minimum | Traçabilité, conformité RGPD |
| **Sessions d'authentification** | 7 jours (auto-expiration) | Sécurité |
| **Documents d'identité (CNI, licence)** | Durée de vie du compte + 5 ans | Preuve légale |
| **Photos de profil** | Durée de vie du compte | Identification |

**Après expiration :** Les données sont supprimées définitivement (soft delete puis hard delete après 90 jours).

---

## 7. Sécurité des Données

### 7.1 Mesures Techniques

- **Chiffrement** : HTTPS (TLS 1.3) pour toutes les communications
- **Authentification** : OAuth 2.0 + JWT + PIN 4 chiffres pour marchands
- **Contrôle d'accès** : Row Level Security (RLS) au niveau base de données
- **Rate Limiting** : Protection contre les attaques par force brute
- **Antivirus** : Scan automatique des fichiers uploadés
- **Logs d'audit** : Traçabilité de toutes les actions sensibles
- **Backups** : Sauvegardes quotidiennes avec rétention 30 jours
- **Sanitization** : Masquage automatique des données sensibles dans les logs

### 7.2 Mesures Organisationnelles

- **Formation** : Sensibilisation des agents terrain à la protection des données
- **Accès restreint** : Principe du moindre privilège (least privilege)
- **Audit régulier** : Revue trimestrielle des accès et logs
- **Politique de mot de passe** : Complexité minimale, renouvellement annuel
- **Gestion des incidents** : Procédure de notification en cas de fuite de données

---

## 8. Droits des Utilisateurs

Conformément à la loi n° 2013-450 du 19 juin 2013 relative à la protection des données à caractère personnel en Côte d'Ivoire, les marchands disposent des droits suivants :

### 8.1 Droit d'Accès

Tout marchand peut demander une copie de ses données personnelles en contactant l'ANSUT.

**Procédure :** Demande écrite ou via l'interface de la plateforme (section "Mon Profil" → "Exporter mes données").

### 8.2 Droit de Rectification

Tout marchand peut corriger ses données inexactes ou incomplètes.

**Procédure :** Modification directe via l'interface ou demande à l'agent terrain.

### 8.3 Droit de Suppression

Tout marchand peut demander la suppression de son compte et de ses données.

**Procédure :** Demande écrite à l'ANSUT avec justificatif d'identité.

**Exceptions :** Les données soumises à obligation légale de conservation (transactions, cotisations) seront anonymisées mais conservées.

### 8.4 Droit d'Opposition

Tout marchand peut s'opposer au traitement de ses données pour des finalités non essentielles (marketing, statistiques).

**Procédure :** Désactivation via l'interface (section "Paramètres" → "Notifications").

### 8.5 Droit à la Portabilité

Tout marchand peut récupérer ses données dans un format structuré et lisible par machine (JSON, CSV).

**Procédure :** Export via l'interface (section "Mon Profil" → "Exporter mes données").

---

## 9. Transfert de Données Hors de Côte d'Ivoire

Les données sont hébergées sur des serveurs situés en **Côte d'Ivoire** ou dans des pays offrant un niveau de protection équivalent (Union Européenne, États-Unis avec Privacy Shield).

**Transferts autorisés :**
- **Manus Platform (USA)** : Hébergement cloud avec garanties contractuelles (DPA)
- **InTouch (Côte d'Ivoire)** : Paiements Mobile Money (local)
- **Brevo (France/UE)** : Envoi de SMS (RGPD)
- **Resend (USA)** : Envoi d'emails (Privacy Shield)

**Aucun transfert vers des pays à risque** (Chine, Russie, etc.).

---

## 10. Notification des Violations de Données

En cas de violation de données (fuite, piratage, accès non autorisé), l'ANSUT s'engage à :

1. **Notification immédiate** : Informer l'ARTCI (Autorité de Régulation des Télécommunications) dans les **72 heures**
2. **Notification aux utilisateurs** : Informer les marchands concernés dans les **7 jours** si risque élevé
3. **Mesures correctives** : Mettre en place des correctifs pour éviter la récurrence
4. **Rapport public** : Publier un rapport d'incident (anonymisé) sur le site de l'ANSUT

---

## 11. Responsabilité et Contact

### 11.1 Responsable du Traitement

**ANSUT (Agence Nationale du Service Universel des Télécommunications)**  
Adresse : Abidjan, Plateau, Côte d'Ivoire  
Email : contact@ansut.ci  
Téléphone : +225 XX XX XX XX XX

### 11.2 Délégué à la Protection des Données (DPO)

**Nom :** [À désigner]  
Email : dpo@ansut.ci  
Téléphone : +225 XX XX XX XX XX

### 11.3 Autorité de Contrôle

**ARTCI (Autorité de Régulation des Télécommunications de Côte d'Ivoire)**  
Adresse : Abidjan, Plateau, Côte d'Ivoire  
Email : contact@artci.ci  
Site web : www.artci.ci

---

## 12. Modifications de la Politique

Cette politique peut être modifiée pour refléter les évolutions légales, techniques ou organisationnelles.

**Procédure de modification :**
1. Validation par l'ANSUT et la DGE
2. Notification aux utilisateurs (email, SMS, bannière sur la plateforme)
3. Délai de 30 jours avant application
4. Publication de la nouvelle version sur le site officiel

**Historique des versions :**
- **Version 1.0** (27 décembre 2024) : Version initiale

---

## 13. Acceptation de la Politique

En s'enrôlant sur la plateforme PNAVIM-CI, le marchand reconnaît avoir pris connaissance de la présente politique et accepte le traitement de ses données personnelles dans les conditions définies ci-dessus.

**Signature électronique :** Lors de l'enrôlement, le marchand valide son consentement en cochant la case "J'accepte la politique de gestion des données".

---

**Document officiel - ANSUT / DGE**  
**Pour toute question, contactez : dpo@ansut.ci**
