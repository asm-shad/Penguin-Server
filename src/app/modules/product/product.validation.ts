import { ProductStatus } from "@prisma/client";
import { z } from "zod";

const createProductValidationSchema = z.object({
  name: z
    .string()
    .min(1, "Product name is required")
    .min(3, "Product name must be at least 3 characters"),
  description: z.string().optional(),
  price: z
    .number()
    .min(0.01, "Price must be a positive number")
    .positive("Price must be a positive number"),
  discount: z.number().min(0).max(100).default(0),
  status: z.enum(ProductStatus).default("NEW"),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  sku: z.string().optional(),
  stock: z.number().int().min(0).default(0),
  brandId: z.string().optional(),
  categoryIds: z.array(z.string()).min(1, "At least one category is required"),
  variants: z
    .array(
      z.object({
        name: z.string().min(1, "Variant name is required"),
        value: z.string().min(1, "Variant value is required"),
        sku: z.string().optional(),
        price: z.number().positive().optional(),
        stock: z.number().int().min(0).default(0),
        imageUrl: z.string().optional(),
        isActive: z.boolean().default(true),
      })
    )
    .optional(),
});

const updateProductValidationSchema = z.object({
  name: z
    .string()
    .min(1, "Product name is required")
    .min(3, "Product name must be at least 3 characters")
    .optional(),
  description: z.string().optional(),
  price: z
    .number()
    .min(0.01, "Price must be a positive number")
    .positive("Price must be a positive number")
    .optional(),
  discount: z.number().min(0).max(100).optional(),
  status: z.enum(ProductStatus).optional(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
  sku: z.string().optional(),
  stock: z.number().int().min(0).optional(),
  brandId: z.string().optional().nullable(),
  categoryIds: z.array(z.string()).optional(),
  variants: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string().min(1, "Variant name is required"),
        value: z.string().min(1, "Variant value is required"),
        sku: z.string().optional(),
        price: z.number().positive().optional(),
        stock: z.number().int().min(0, "Stock must be 0 or more"),
        imageUrl: z.string().optional(),
        isActive: z.boolean().default(true),
      })
    )
    .optional(),
});

const productFilterValidationSchema = z.object({
  searchTerm: z.string().optional(),
  minPrice: z.number().min(0, "Minimum price must be positive").optional(),
  maxPrice: z.number().min(0, "Maximum price must be positive").optional(),
  status: z.enum(ProductStatus).optional(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
  brandId: z.string().optional(),
  categoryId: z.string().optional(),
  inStock: z.boolean().optional(),
});

const updateProductStatusSchema = z.object({
  status: z.enum(ProductStatus),
});

const updateProductFeaturedSchema = z.object({
  isFeatured: z.boolean(),
});

const updateProductActiveSchema = z.object({
  isActive: z.boolean(),
});

const updateStockSchema = z.object({
  stock: z.number().int().min(0, "Stock quantity is required"),
  variantId: z.string().optional(),
  reason: z.string().optional(),
});

export const productValidation = {
  createProductValidationSchema,
  updateProductValidationSchema,
  productFilterValidationSchema,
  updateProductStatusSchema,
  updateProductFeaturedSchema,
  updateProductActiveSchema,
  updateStockSchema,
};
