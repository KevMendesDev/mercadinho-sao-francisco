import { z } from "zod";
import { UserRole } from "@/database/entities/enums";

export const loginSchema = z.object({
  email: z.email().max(190).transform((value) => value.trim().toLowerCase()),
  password: z.string().min(8).max(128),
  branchId: z.uuid(),
});

export const productSchema = z.object({
  name: z.string().trim().min(2).max(180),
  brand: z.string().trim().max(120).optional().nullable(),
  categoryId: z.uuid().optional().nullable().or(z.literal("")),
  barcode: z.string().trim().regex(/^\d{8,14}$/).optional().nullable().or(z.literal("")),
  unit: z.enum(["ML", "G", "KG", "L"]),
  weight: z.coerce.number().positive().finite(),
});

export const categorySchema = z.object({ name: z.string().trim().min(2).max(120) });

export const userCreateSchema = z.object({
  name: z.string().trim().min(2).max(160),
  email: z.email().transform((value) => value.trim().toLowerCase()),
  password: z.string().min(8).max(128),
  role: z.enum(UserRole),
  branchIds: z.array(z.uuid()).refine((ids) => new Set(ids).size === ids.length, "Filiais não podem ser repetidas.").default([]),
  active: z.boolean().default(true),
});

export const userUpdateSchema = z.object({
  name: z.string().trim().min(2).max(160).optional(),
  role: z.enum(UserRole).optional(),
  branchIds: z.array(z.uuid()).refine((ids) => new Set(ids).size === ids.length, "Filiais não podem ser repetidas.").optional(),
  active: z.boolean().optional(),
});

export const stockEntrySchema = z.object({
  productId: z.uuid(),
  branchId: z.uuid(),
  quantity: z.coerce.number().int().positive(),
  expirationDate: z.iso.date(),
  reason: z.string().trim().max(300).optional().nullable(),
});

export const stockExitSchema = z.object({
  productId: z.uuid(),
  branchId: z.uuid(),
  quantity: z.coerce.number().int().positive(),
  reason: z.string().trim().min(3).max(300),
});

export const stockAdjustmentSchema = z.object({
  batchId: z.uuid(),
  newQuantity: z.coerce.number().int().min(0),
  reason: z.string().trim().min(3).max(300),
});
