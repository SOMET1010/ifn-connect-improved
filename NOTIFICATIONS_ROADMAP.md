# 📬 Roadmap Notifications Automatiques

## ✅ Phase 1 : Notifications Visuelles (P0-2 - IMPLÉMENTÉ)

### Fonctionnalités actuelles

- **Composant ExpirationAlert** : Badge d'alerte dans le dashboard marchand
- **Détection automatique** : Affiche les couvertures expirant dans 30 jours
- **Hiérarchisation** : Affiche la couverture la plus urgente en premier
- **Action rapide** : Bouton "Renouveler maintenant" vers `/merchant/social-protection`

### Procédure tRPC disponible

```typescript
trpc.socialProtection.getExpiringProtections.useQuery({
  daysThreshold: 30, // Nombre de jours avant expiration
});
```

---

## 🚀 Phase 2 : Notifications Email (P1 - À IMPLÉMENTER)

### Objectif
Envoyer des emails automatiques aux marchands dont la couverture sociale expire bientôt.

### Infrastructure requise

1. **Service d'envoi d'emails**
   - Option 1 : SendGrid (recommandé pour la Côte d'Ivoire)
   - Option 2 : AWS SES
   - Option 3 : Mailgun

2. **Templates d'emails**
   - Email "Votre CNPS expire dans 30 jours"
   - Email "Votre CMU expire dans 7 jours"
   - Email "Votre RSTI expire demain"

3. **Cron job quotidien**
   - Exécution à 8h00 (heure locale)
   - Détection des expirations dans 30, 7 et 1 jour(s)
   - Envoi d'emails groupés

### Implémentation

```typescript
// server/jobs/send-expiration-emails.ts
import { getDb } from '../db';
import { merchantSocialProtection, merchants, users } from '../../drizzle/schema';
import { sendEmail } from '../_core/email'; // À créer

export async function sendExpirationEmails() {
  const db = await getDb();
  if (!db) return;

  const now = new Date();
  const in30Days = new Date();
  in30Days.setDate(in30Days.getDate() + 30);

  const in7Days = new Date();
  in7Days.setDate(in7Days.getDate() + 7);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Récupérer les marchands avec couverture expirant bientôt
  const expiringProtections = await db
    .select({
      merchantId: merchants.id,
      email: users.email,
      name: users.name,
      cnpsExpiryDate: merchantSocialProtection.cnpsExpiryDate,
      cmuExpiryDate: merchantSocialProtection.cmuExpiryDate,
      rstiExpiryDate: merchantSocialProtection.rstiExpiryDate,
    })
    .from(merchantSocialProtection)
    .innerJoin(merchants, eq(merchantSocialProtection.merchantId, merchants.id))
    .innerJoin(users, eq(merchants.userId, users.id))
    .where(
      sql`(
        (${merchantSocialProtection.cnpsExpiryDate} BETWEEN ${now} AND ${in30Days})
        OR (${merchantSocialProtection.cmuExpiryDate} BETWEEN ${now} AND ${in30Days})
        OR (${merchantSocialProtection.rstiExpiryDate} BETWEEN ${now} AND ${in30Days})
      )`
    );

  // Envoyer les emails
  for (const merchant of expiringProtections) {
    if (!merchant.email) continue;

    // Déterminer les couvertures à renouveler
    const expiring = [];
    if (merchant.cnpsExpiryDate && merchant.cnpsExpiryDate <= in30Days) {
      expiring.push({ type: 'CNPS', date: merchant.cnpsExpiryDate });
    }
    if (merchant.cmuExpiryDate && merchant.cmuExpiryDate <= in30Days) {
      expiring.push({ type: 'CMU', date: merchant.cmuExpiryDate });
    }
    if (merchant.rstiExpiryDate && merchant.rstiExpiryDate <= in30Days) {
      expiring.push({ type: 'RSTI', date: merchant.rstiExpiryDate });
    }

    await sendEmail({
      to: merchant.email,
      subject: `Renouvellement de votre couverture sociale`,
      template: 'expiration-reminder',
      data: {
        name: merchant.name,
        expiring,
        renewalUrl: `https://pnavim-ci.manus.space/merchant/social-protection`,
      },
    });
  }
}
```

### Configuration du cron job

```typescript
// server/_core/cron.ts
import cron from 'node-cron';
import { sendExpirationEmails } from '../jobs/send-expiration-emails';

// Exécuter tous les jours à 8h00
cron.schedule('0 8 * * *', async () => {
  console.log('[CRON] Envoi des notifications d'expiration...');
  await sendExpirationEmails();
  console.log('[CRON] Notifications envoyées');
});
```

---

## 📱 Phase 3 : Notifications SMS (P2 - À IMPLÉMENTER)

### Objectif
Envoyer des SMS aux marchands dont la couverture expire dans moins de 7 jours.

### Infrastructure requise

1. **Service SMS**
   - Option 1 : Twilio (international)
   - Option 2 : Orange SMS API (local Côte d'Ivoire)
   - Option 3 : MTN SMS API

2. **Templates SMS**
   - "PNAVIM: Votre CNPS expire dans 7 jours. Renouvelez sur pnavim-ci.manus.space"
   - "PNAVIM: Votre CMU expire demain. Renouvelez maintenant: pnavim-ci.manus.space"

3. **Limitation des envois**
   - Maximum 1 SMS par jour par marchand
   - Éviter les doublons email + SMS

### Implémentation

```typescript
// server/_core/sms.ts
import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function sendSMS(to: string, message: string) {
  await client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER,
    to,
  });
}
```

---

## 🔔 Phase 4 : Notifications Push (P2 - À IMPLÉMENTER)

### Objectif
Envoyer des notifications push aux marchands via l'application web (PWA).

### Infrastructure requise

1. **Service Worker**
   - Enregistrement du service worker
   - Gestion des permissions de notification

2. **Backend notifications**
   - Firebase Cloud Messaging (FCM)
   - Stockage des tokens de notification

3. **UI de gestion**
   - Paramètres de notification dans le profil marchand
   - Opt-in/opt-out pour chaque type de notification

---

## 📊 Métriques à suivre

- Taux d'ouverture des emails
- Taux de clic sur "Renouveler maintenant"
- Taux de conversion (email → demande de renouvellement)
- Délai moyen entre notification et renouvellement
- Nombre de couvertures expirées (à minimiser)

---

## 🎯 Objectif final

**Réduire le nombre de couvertures expirées de 80%** en alertant proactivement les marchands 30, 7 et 1 jour(s) avant l'expiration.
