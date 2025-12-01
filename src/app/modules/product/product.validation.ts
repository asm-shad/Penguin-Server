import { ProductStatus } from "@prisma/client";
import { z } from "zod";

const createProductValidationSchema = z.object({
  name: z
    .string({
      required_error: "Product name is required",
      invalid_type_error: "Product name must be a string",
    })
    .min(3, "Product name must be at least 3 characters"),
  description: z.string().optional(),
  price: z
    .number({
      required_error: "Price is required",
      invalid_type_error: "Price must be a number",
    })
    .positive("Price must be a positive number"),
  discount: z.number().min(0).max(100).default(0),
  status: z.nativeEnum(ProductStatus).default("NEW"),
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
  name: z.string().min(3).optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  discount: z.number().min(0).max(100).optional(),
  status: z.nativeEnum(ProductStatus).optional(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
  sku: z.string().optional(),
  stock: z.number().int().min(0).optional(),
  brandId: z.string().optional().nullable(),
  categoryIds: z.array(z.string()).optional(),
  variants: z
    .array(
      z.object({
        id: z.string().optional(), // For updating existing variants
        name: z.string().min(1),
        value: z.string().min(1),
        sku: z.string().optional(),
        price: z.number().positive().optional(),
        stock: z.number().int().min(0),
        imageUrl: z.string().optional(),
        isActive: z.boolean().default(true),
      })
    )
    .optional(),
});

const productFilterValidationSchema = z.object({
  searchTerm: z.string().optional(),
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),
  status: z.nativeEnum(ProductStatus).optional(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
  brandId: z.string().optional(),
  categoryId: z.string().optional(),
  inStock: z.boolean().optional(),
});

const updateProductStatusSchema = z.object({
  status: z.nativeEnum(ProductStatus, {
    required_error: "Status is required",
  }),
});

const updateProductFeaturedSchema = z.object({
  isFeatured: z.boolean({
    required_error: "isFeatured is required",
  }),
});

const updateProductActiveSchema = z.object({
  isActive: z.boolean({
    required_error: "isActive is required",
  }),
});

const updateStockSchema = z.object({
  stock: z.number().int().min(0, {
    required_error: "Stock quantity is required",
  }),
  variantId: z.string().optional(), // For variant stock updates
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
