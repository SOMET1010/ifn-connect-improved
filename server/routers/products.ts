import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { 
  getProductsByMerchant,
  createProduct,
  updateProduct,
  deleteProduct,
  getMerchantStock,
  updateStock,
  getLowStock,
} from '../db-products';
import { getMerchantByUserId } from '../db-merchant';

export const productsRouter = router({
  /**
   * Liste des produits d'un marchand
   */
  listByMerchant: protectedProcedure
    .input(z.object({
      merchantId: z.number(),
    }))
    .query(async ({ input }) => {
      const products = await getProductsByMerchant(input.merchantId);
      return products;
    }),

  /**
   * Créer un nouveau produit
   */
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      nameDioula: z.string().optional(),
      category: z.string().optional(),
      unit: z.string().min(1),
      basePrice: z.number().positive().optional(),
      imageUrl: z.string().optional(),
      pictogramUrl: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const product = await createProduct(input);
      return product;
    }),

  /**
   * Mettre à jour un produit
   */
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      nameDioula: z.string().optional(),
      category: z.string().optional(),
      unit: z.string().optional(),
      basePrice: z.number().positive().optional(),
      imageUrl: z.string().optional(),
      pictogramUrl: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const result = await updateProduct(id, data);
      return result;
    }),

  /**
   * Supprimer un produit
   */
  delete: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ input }) => {
      const result = await deleteProduct(input.id);
      return result;
    }),
});

export const stockRouter = router({
  /**
   * Liste du stock d'un marchand
   */
  listByMerchant: protectedProcedure
    .input(z.object({
      merchantId: z.number(),
    }))
    .query(async ({ input }) => {
      const stock = await getMerchantStock(input.merchantId);
      return stock;
    }),

  /**
   * Mettre à jour les quantités en stock
   */
  update: protectedProcedure
    .input(z.object({
      productId: z.number(),
      quantity: z.number(),
      minThreshold: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Récupérer le merchantId depuis le contexte utilisateur
      const merchant = await getMerchantByUserId(ctx.user.id);
      if (!merchant) {
        throw new Error('Merchant not found');
      }
      
      const result = await updateStock({
        ...input,
        merchantId: merchant.id,
      });
      return result;
    }),

  /**
   * Produits en stock bas
   */
  lowStock: protectedProcedure
    .input(z.object({
      merchantId: z.number(),
    }))
    .query(async ({ input }) => {
      const lowStockItems = await getLowStock(input.merchantId);
      return lowStockItems;
    }),
});
