# Guide de Configuration Sentry pour IFN Connect

## 📊 Qu'est-ce que Sentry ?

Sentry est une plateforme de monitoring d'erreurs en temps réel qui permet de :
- Détecter automatiquement les erreurs et exceptions
- Recevoir des alertes par email/Slack quand des bugs surviennent
- Analyser les traces d'exécution pour déboguer rapidement
- Suivre les performances de l'application

## 🚀 Étapes de Configuration

### 1. Créer un compte Sentry (Gratuit)

1. Aller sur [https://sentry.io/signup/](https://sentry.io/signup/)
2. Créer un compte gratuit (jusqu'à 5 000 erreurs/mois)
3. Choisir **"React"** comme plateforme principale
4. Donner un nom à votre projet (ex: "IFN Connect")

### 2. Récupérer votre DSN

Une fois le projet créé :

1. Aller dans **Settings** → **Projects** → **[Votre Projet]**
2. Cliquer sur **Client Keys (DSN)**
3. Copier le **DSN** qui ressemble à :
   ```
   https://abc123def456@o123456.ingest.sentry.io/7890123
   ```

### 3. Ajouter le DSN dans Manus

1. Ouvrir l'interface de gestion Manus (Management UI)
2. Aller dans **Settings** → **Secrets**
3. Cliquer sur **"Add Secret"**
4. Ajouter la variable :
   - **Nom** : `VITE_SENTRY_DSN`
   - **Valeur** : Coller votre DSN Sentry

### 4. Redémarrer l'application

Après avoir ajouté le secret, redémarrer le serveur de développement pour que la variable soit prise en compte.

## ✅ Vérification

Pour vérifier que Sentry fonctionne :

1. Ouvrir la console du navigateur
2. Déclencher une erreur volontaire (par exemple, cliquer sur un bouton qui n'existe pas)
3. Aller sur votre dashboard Sentry
4. Vous devriez voir l'erreur apparaître en quelques secondes

## 📈 Fonctionnalités Activées

Une fois configuré, Sentry capturera automatiquement :

- ✅ **Erreurs JavaScript** : Exceptions non gérées dans le frontend
- ✅ **Erreurs React** : Erreurs dans les composants (via Error Boundary)
- ✅ **Erreurs de réseau** : Échecs d'appels API
- ✅ **Informations contextuelles** : URL, navigateur, système d'exploitation
- ✅ **Breadcrumbs** : Actions utilisateur avant l'erreur (clics, navigation)

## 🔒 Sécurité

- Le DSN est **public** et peut être exposé dans le code frontend
- Il permet uniquement d'**envoyer** des erreurs à Sentry, pas de les lire
- Les données sensibles (mots de passe, tokens) ne sont **jamais** envoyées

## 💡 Conseils

- **Alertes** : Configurez des alertes email dans Sentry pour être notifié immédiatement
- **Releases** : Utilisez les releases Sentry pour suivre les erreurs par version
- **Source Maps** : Activez les source maps pour voir le code original dans les traces
- **Filtres** : Filtrez les erreurs non critiques (ex: extensions navigateur)

## 📚 Ressources

- [Documentation Sentry](https://docs.sentry.io/)
- [Guide React](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Best Practices](https://docs.sentry.io/platforms/javascript/best-practices/)

## 🆘 Support

Si vous rencontrez des problèmes :
1. Vérifiez que le DSN est correct (format : `https://...@...ingest.sentry.io/...`)
2. Vérifiez que la variable `VITE_SENTRY_DSN` est bien définie
3. Redémarrez le serveur après avoir ajouté le secret
4. Consultez les logs du navigateur pour voir si Sentry s'initialise

---

**Note** : Sentry est optionnel. L'application fonctionne normalement sans configuration Sentry, mais vous ne recevrez pas d'alertes automatiques en cas d'erreur.
