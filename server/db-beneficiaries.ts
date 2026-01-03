import { getDb } from "./db";
import { beneficiaries, type InsertBeneficiary } from "../drizzle/schema-wallet";
import { users } from "../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";

/**
 * Récupérer la liste des bénéficiaires d'un utilisateur
 */
export async function getBeneficiariesByOwnerId(ownerId: number) {
  const db = await getDb();
  if (!db) return [];

  const beneficiaryList = await db
    .select({
      id: beneficiaries.id,
      contactId: beneficiaries.contactId,
      nickname: beneficiaries.nickname,
      isActive: beneficiaries.isActive,
      createdAt: beneficiaries.createdAt,
      contact: {
        id: users.id,
        name: users.name,
        phone: users.phone,
        email: users.email,
      },
    })
    .from(beneficiaries)
    .leftJoin(users, eq(users.id, beneficiaries.contactId))
    .where(
      and(
        eq(beneficiaries.ownerId, ownerId),
        eq(beneficiaries.isActive, true)
      )
    );

  return beneficiaryList;
}

/**
 * Ajouter un bénéficiaire
 */
export async function addBeneficiary(data: {
  ownerId: number;
  contactId: number;
  nickname?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const existing = await db
    .select()
    .from(beneficiaries)
    .where(
      and(
        eq(beneficiaries.ownerId, data.ownerId),
        eq(beneficiaries.contactId, data.contactId)
      )
    );

  if (existing.length > 0) {
    if (!existing[0].isActive) {
      const [updated] = await db
        .update(beneficiaries)
        .set({
          isActive: true,
          nickname: data.nickname || existing[0].nickname,
          updatedAt: new Date(),
        })
        .where(eq(beneficiaries.id, existing[0].id))
        .returning();
      return updated;
    }
    throw new Error("Ce contact est déjà dans vos bénéficiaires");
  }

  const [beneficiary] = await db
    .insert(beneficiaries)
    .values({
      ownerId: data.ownerId,
      contactId: data.contactId,
      nickname: data.nickname,
      isActive: true,
    })
    .returning();

  return beneficiary;
}

/**
 * Ajouter un bénéficiaire à partir d'un numéro de téléphone
 */
export async function addBeneficiaryByPhone(
  ownerId: number,
  phone: string,
  nickname?: string
) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const [contact] = await db
    .select({
      id: users.id,
      name: users.name,
      phone: users.phone,
    })
    .from(users)
    .where(eq(users.phone, phone));

  if (!contact) {
    throw new Error("Aucun utilisateur trouvé avec ce numéro de téléphone");
  }

  if (contact.id === ownerId) {
    throw new Error("Vous ne pouvez pas vous ajouter vous-même");
  }

  return await addBeneficiary({
    ownerId,
    contactId: contact.id,
    nickname: nickname || contact.name || undefined,
  });
}

/**
 * Mettre à jour le surnom d'un bénéficiaire
 */
export async function updateBeneficiaryNickname(
  beneficiaryId: number,
  ownerId: number,
  nickname: string
) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const [updated] = await db
    .update(beneficiaries)
    .set({
      nickname,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(beneficiaries.id, beneficiaryId),
        eq(beneficiaries.ownerId, ownerId)
      )
    )
    .returning();

  if (!updated) {
    throw new Error("Bénéficiaire introuvable");
  }

  return updated;
}

/**
 * Supprimer un bénéficiaire (soft delete)
 */
export async function removeBeneficiary(beneficiaryId: number, ownerId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const [updated] = await db
    .update(beneficiaries)
    .set({
      isActive: false,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(beneficiaries.id, beneficiaryId),
        eq(beneficiaries.ownerId, ownerId)
      )
    )
    .returning();

  if (!updated) {
    throw new Error("Bénéficiaire introuvable");
  }

  return updated;
}

/**
 * Vérifier si un contact est déjà un bénéficiaire
 */
export async function isBeneficiary(ownerId: number, contactId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const [existing] = await db
    .select({ id: beneficiaries.id })
    .from(beneficiaries)
    .where(
      and(
        eq(beneficiaries.ownerId, ownerId),
        eq(beneficiaries.contactId, contactId),
        eq(beneficiaries.isActive, true)
      )
    );

  return !!existing;
}
