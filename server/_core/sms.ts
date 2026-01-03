import { TRPCError } from "@trpc/server";
import { ENV } from "./env";

export type SMSPayload = {
  phone: string;
  message: string;
};

const PHONE_REGEX = /^(\+225)?[0-9]{10}$/;
const MESSAGE_MAX_LENGTH = 1600;

function validatePhoneNumber(phone: string): string {
  const normalized = phone.replace(/\s+/g, "").trim();

  if (!PHONE_REGEX.test(normalized)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Numéro de téléphone invalide. Format attendu: +225XXXXXXXXXX ou XXXXXXXXXX",
    });
  }

  if (normalized.startsWith("+225")) {
    return normalized;
  }

  return `+225${normalized}`;
}

function validateMessage(message: string): string {
  const trimmed = message.trim();

  if (trimmed.length === 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Le message SMS ne peut pas être vide.",
    });
  }

  if (trimmed.length > MESSAGE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Le message SMS ne peut pas dépasser ${MESSAGE_MAX_LENGTH} caractères.`,
    });
  }

  return trimmed;
}

function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendSMSProduction(phone: string, message: string): Promise<boolean> {
  try {
    if (!ENV.smsApiUrl || !ENV.smsApiKey || !ENV.smsSenderId) {
      console.error("[SMS] Configuration manquante. Vérifiez SMS_API_URL, SMS_API_KEY, et SMS_SENDER_ID");
      return false;
    }

    const payload = {
      sender: ENV.smsSenderId,
      recipient: phone,
      message: message,
    };

    console.log(`[SMS Production] Envoi vers ${phone}`);

    const response = await fetch(ENV.smsApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${ENV.smsApiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[SMS] Erreur API ANSUT Hub: ${response.status} - ${errorText}`);
      return false;
    }

    const result = await response.json();
    console.log(`[SMS] Succès:`, result);
    return true;
  } catch (error) {
    console.error("[SMS] Erreur lors de l'envoi:", error);
    return false;
  }
}

async function sendSMSDevelopment(phone: string, message: string): Promise<boolean> {
  console.log("\n==== SMS MOCK (DEV MODE) ====");
  console.log(`To: ${phone}`);
  console.log(`Message: ${message}`);
  console.log("=============================\n");

  return true;
}

export async function sendSMS(payload: SMSPayload): Promise<boolean> {
  const phone = validatePhoneNumber(payload.phone);
  const message = validateMessage(payload.message);

  if (ENV.isProduction) {
    return sendSMSProduction(phone, message);
  } else {
    return sendSMSDevelopment(phone, message);
  }
}

export async function sendVerificationCode(phone: string): Promise<{ code: string; success: boolean }> {
  const code = generateVerificationCode();
  const message = `Votre code de vérification PNAVIM est: ${code}. Ce code expire dans 10 minutes.`;

  const success = await sendSMS({ phone, message });

  return { code, success };
}

export async function sendPinResetCode(phone: string): Promise<{ code: string; success: boolean }> {
  const code = generateVerificationCode();
  const message = `Votre code de réinitialisation PNAVIM est: ${code}. Ce code expire dans 10 minutes.`;

  const success = await sendSMS({ phone, message });

  return { code, success };
}

export async function sendBulkSMS(phones: string[], message: string): Promise<{ sent: number; failed: number }> {
  const validatedMessage = validateMessage(message);
  let sent = 0;
  let failed = 0;

  for (const phone of phones) {
    try {
      const success = await sendSMS({ phone, message: validatedMessage });
      if (success) {
        sent++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error(`Failed to send SMS to ${phone}:`, error);
      failed++;
    }
  }

  return { sent, failed };
}
