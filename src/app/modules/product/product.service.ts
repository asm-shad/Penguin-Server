import { Prisma, ProductStatus } from "@prisma/client";
import { Request } from "express";
import { IAuthUser } from "../../interfaces/common";
import { IPaginationOptions } from "../../interfaces/pagination";
import { productSearchAbleFields } from "./product.constant";
import { fileUploader } from "../../helper/fileUploader";
import prisma from "../../shared/prisma";
import { paginationHelper } from "../../helper/paginationHelper";
import slugify from "slugify";

// Create product
const createProduct = async (req: Request) => {
  const files = req.files as Express.Multer.File[];
  const {
    name,
    description,
    price,
    discount,
    status,
    isFeatured,
    isActive,
    sku,
    stock,
    brandId,
    categoryIds,
    variants,
  } = req.body;

  // Generate slug from name
  const slug = slugify(name, {
    lower: true,
    strict: true,
    trim: true,
  });

  // Check if slug already exists
  const existingSlug = await prisma.product.findUnique({
    where: { slug },
  });

  if (existingSlug) {
    throw new Error(
      "Product slug already exists. Please provide a different product name."
    );
  }

  // Calculate sale price - ALWAYS set salePrice, even if no discount
  const salePrice = discount > 0 ? price - (price * discount) / 100 : price; // Changed from undefined to price

  // Handle file uploads
  let productImages: {
    imageUrl: string;
    altText?: string;
    sortOrder: number;
    isPrimary: boolean;
  }[] = [];

  if (files && files.length > 0) {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const uploadToCloudinary = await fileUploader.uploadToCloudinary(file);
      productImages.push({
        imageUrl: uploadToCloudinary?.secure_url || "",
        altText: name,
        sortOrder: i,
        isPrimary: i === 0, // First image is primary
      });
    }
  }

  const result = await prisma.$transaction(async (transactionClient) => {
    // Step 1: Create the product with slug
    const createdProduct = await transactionClient.product.create({
      data: {
        name,
        slug, // Added slug
        description,
        price,
        discount,
        salePrice, // This will always have a value now
        status: status as ProductStatus,
        isFeatured,
        isActive,
        sku,
        stock,
        brandId: brandId || null,
      },
    });
    // Step 2: Create product images
    if (productImages.length > 0) {
      await transactionClient.productImage.createMany({
        data: productImages.map((img) => ({
          ...img,
          productId: createdProduct.id,
        })),
      });
    }

    // Step 3: Link categories
    if (categoryIds && categoryIds.length > 0) {
      await transactionClient.productCategory.createMany({
        data: categoryIds.map((categoryId: string) => ({
          productId: createdProduct.id,
          categoryId,
        })),
      });
    }

    // Step 4: Create variants if provided
    if (variants && variants.length > 0) {
      await transactionClient.productVariant.createMany({
        data: variants.map((variant: any, index: number) => ({
          productId: createdProduct.id,
          name: variant.name,
          value: variant.value,
          sku: variant.sku,
          price: variant.price,
          stock: variant.stock || 0,
          imageUrl: variant.imageUrl,
          isActive: variant.isActive !== false,
        })),
      });
    }

    // Step 5: Return full product with relations
    const fullProduct = await transactionClient.product.findUnique({
      where: { id: createdProduct.id },
      include: {
        brand: true,
        productCategories: {
          include: {
            category: true,
          },
        },
        productImages: true,
        productVariants: true,
      },
    });

    return fullProduct;
  });

  return result;
};

// Get all products with filtering and pagination
const getAllFromDB = async (params: any, options: IPaginationOptions) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const {
    searchTerm,
    minPrice,
    maxPrice,
    status,
    isFeatured,
    isActive,
    brandId,
    categoryId,
    inStock,
    ...filterData
  } = params;

  const andConditions: Prisma.ProductWhereInput[] = [];

  // Search term
  if (searchTerm) {
    andConditions.push({
      OR: productSearchAbleFields.map((field) => ({
        [field]: {
          contains: searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }

  // Price range
  if (minPrice !== undefined || maxPrice !== undefined) {
    const priceCondition: any = {};
    if (minPrice !== undefined) priceCondition.gte = minPrice;
    if (maxPrice !== undefined) priceCondition.lte = maxPrice;
    andConditions.push({ price: priceCondition });
  }

  // Status filter
  if (status) {
    andConditions.push({ status });
  }

  // Featured filter
  if (isFeatured !== undefined) {
    andConditions.push({ isFeatured: isFeatured === "true" });
  }

  // Active filter
  if (isActive !== undefined) {
    andConditions.push({ isActive: isActive === "true" });
  }

  // Brand filter
  if (brandId) {
    andConditions.push({ brandId });
  }

  // Category filter
  if (categoryId) {
    andConditions.push({
      productCategories: {
        some: {
          categoryId,
        },
      },
    });
  }

  // Stock filter
  if (inStock !== undefined) {
    if (inStock === "true") {
      andConditions.push({
        OR: [
          { stock: { gt: 0 } },
          { productVariants: { some: { stock: { gt: 0 } } } },
        ],
      });
    } else {
      andConditions.push({
        AND: [
          { stock: { equals: 0 } },
          { productVariants: { every: { stock: { equals: 0 } } } },
        ],
      });
    }
  }

  // Other filter fields
  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      AND: Object.keys(filterData).map((key) => ({
        [key]: {
          equals: (filterData as any)[key],
        },
      })),
    });
  }

  const whereConditions: Prisma.ProductWhereInput = {
    AND: andConditions.length > 0 ? andConditions : undefined,
  };

  const result = await prisma.product.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? {
            [options.sortBy]: options.sortOrder,
          }
        : {
            createdAt: "desc",
          },
    include: {
      brand: true,
      productCategories: {
        include: {
          category: true,
        },
      },
      productImages: {
        orderBy: {
          sortOrder: "asc",
        },
      },
      productVariants: true,
      _count: {
        select: {
          productReviews: true,
          wishlists: true,
        },
      },
    },
  });

  const total = await prisma.product.count({
    where: whereConditions,
  });

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: result,
  };
};

// Get single product by ID
const getById = async (id: string) => {
  const result = await prisma.product.findUniqueOrThrow({
    where: { id },
    include: {
      brand: true,
      productCategories: {
        include: {
          category: true,
        },
      },
      productImages: {
        orderBy: {
          sortOrder: "asc",
        },
      },
      productVariants: true,
      productReviews: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profileImageUrl: true,
            },
          },
        },
        where: {
          isApproved: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      _count: {
        select: {
          wishlists: true,
          productReviews: true,
        },
      },
    },
  });

  return result;
};

// Get single product by slug
const getBySlug = async (slug: string) => {
  const result = await prisma.product.findUniqueOrThrow({
    where: { slug },
    include: {
      brand: true,
      productCategories: {
        include: {
          category: true,
        },
      },
      productImages: {
        orderBy: {
          sortOrder: "asc",
        },
      },
      productVariants: true,
      productReviews: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profileImageUrl: true,
            },
          },
        },
        where: {
          isApproved: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      _count: {
        select: {
          wishlists: true,
          productReviews: true,
        },
      },
    },
  });

  return result;
};

// Update product
const updateProduct = async (id: string, req: Request) => {
  const files = req.files as Express.Multer.File[];
  const {
    name,
    description,
    price,
    discount,
    status,
    isFeatured,
    isActive,
    sku,
    stock,
    brandId,
    categoryIds,
    variants,
  } = req.body;

  // Calculate sale price - ALWAYS set salePrice, even if no discount
  const salePrice = discount > 0 ? price - (price * discount) / 100 : price; // Changed from undefined to price

  // Handle file uploads for new images
  let newProductImages: {
    imageUrl: string;
    altText?: string;
    sortOrder: number;
    isPrimary: boolean;
  }[] = [];

  if (files && files.length > 0) {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const uploadToCloudinary = await fileUploader.uploadToCloudinary(file);
      newProductImages.push({
        imageUrl: uploadToCloudinary?.secure_url || "",
        altText: name || "Product image",
        sortOrder: i,
        isPrimary: false, // Will be set based on existing images
      });
    }
  }

  const result = await prisma.$transaction(async (transactionClient) => {
    // Step 1: Get current product to determine image sort order
    const currentProduct = await transactionClient.product.findUnique({
      where: { id },
      include: {
        productImages: true,
      },
    });

    // Step 2: Update the product (NO slug update)
    const updatedProduct = await transactionClient.product.update({
      where: { id },
      data: {
        name,
        description,
        price,
        discount,
        salePrice, // This will always have a value now
        status: status as ProductStatus,
        isFeatured,
        isActive,
        sku,
        stock,
        brandId: brandId || null,
      },
    });

    // Step 3: Update categories if provided
    if (categoryIds) {
      // Remove existing categories
      await transactionClient.productCategory.deleteMany({
        where: { productId: id },
      });

      // Add new categories
      if (categoryIds.length > 0) {
        await transactionClient.productCategory.createMany({
          data: categoryIds.map((categoryId: string) => ({
            productId: id,
            categoryId,
          })),
        });
      }
    }

    // Step 4: Add new images if provided
    if (newProductImages.length > 0) {
      const currentImageCount = currentProduct?.productImages.length || 0;
      await transactionClient.productImage.createMany({
        data: newProductImages.map((img, index) => ({
          ...img,
          productId: id,
          sortOrder: currentImageCount + index,
        })),
      });
    }

    // Step 5: Update variants if provided
    if (variants) {
      // Delete existing variants (or update them based on id)
      const existingVariants = await transactionClient.productVariant.findMany({
        where: { productId: id },
      });

      const variantsToDelete = existingVariants.filter(
        (ev) => !variants.some((v: any) => v.id === ev.id)
      );

      if (variantsToDelete.length > 0) {
        await transactionClient.productVariant.deleteMany({
          where: {
            id: { in: variantsToDelete.map((v) => v.id) },
          },
        });
      }

      // Update or create variants
      for (const variant of variants) {
        if (variant.id) {
          // Update existing variant
          await transactionClient.productVariant.update({
            where: { id: variant.id },
            data: {
              name: variant.name,
              value: variant.value,
              sku: variant.sku,
              price: variant.price,
              stock: variant.stock,
              imageUrl: variant.imageUrl,
              isActive: variant.isActive,
            },
          });
        } else {
          // Create new variant
          await transactionClient.productVariant.create({
            data: {
              productId: id,
              name: variant.name,
              value: variant.value,
              sku: variant.sku,
              price: variant.price,
              stock: variant.stock || 0,
              imageUrl: variant.imageUrl,
              isActive: variant.isActive !== false,
            },
          });
        }
      }
    }

    // Step 6: Return updated product
    const fullProduct = await transactionClient.product.findUnique({
      where: { id },
      include: {
        brand: true,
        productCategories: {
          include: {
            category: true,
          },
        },
        productImages: {
          orderBy: {
            sortOrder: "asc",
          },
        },
        productVariants: true,
      },
    });

    return fullProduct;
  });

  return result;
};

// Update product status
const updateProductStatus = async (
  id: string,
  statusData: {
    status: ProductStatus;
    discount?: number; // Optional discount for HOT and SALE statuses
  }
) => {
  const { status, discount } = statusData;

  const productData = await prisma.product.findUniqueOrThrow({
    where: { id },
  });

  let updateData: any = {
    status: status,
  };

  // If status is HOT or SALE and discount is provided
  if ((status === "HOT" || status === "SALE") && discount !== undefined) {
    // Validate discount
    if (discount < 0 || discount > 100) {
      throw new Error("Discount must be between 0 and 100");
    }

    updateData.discount = discount;
    // Calculate sale price (discounted price)
    updateData.salePrice =
      productData.price - (productData.price * discount) / 100;
  } else if (status === "HOT" || status === "SALE") {
    // If status is HOT or SALE but no discount provided, keep existing discount
    // and recalculate sale price with existing discount
    updateData.salePrice =
      productData.discount > 0
        ? productData.price - (productData.price * productData.discount) / 100
        : productData.price;
  } else {
    // For other statuses (NEW, OUT_OF_STOCK, DISCONTINUED)
    // Set salePrice to be the same as base price (no discount)
    updateData.discount = 0;
    updateData.salePrice = productData.price;
  }

  // If status is OUT_OF_STOCK or DISCONTINUED, also set isActive to false
  if (status === "OUT_OF_STOCK" || status === "DISCONTINUED") {
    updateData.isActive = false;
  }

  const updatedProduct = await prisma.product.update({
    where: { id },
    data: updateData,
  });

  return updatedProduct;
};

// Update product featured status
const updateProductFeatured = async (
  id: string,
  featured: { isFeatured: boolean }
) => {
  const productData = await prisma.product.findUniqueOrThrow({
    where: { id },
  });

  const updatedProduct = await prisma.product.update({
    where: { id },
    data: { isFeatured: featured.isFeatured },
  });

  return updatedProduct;
};

// Update product active status
const updateProductActive = async (
  id: string,
  active: { isActive: boolean }
) => {
  const productData = await prisma.product.findUniqueOrThrow({
    where: { id },
  });

  const updatedProduct = await prisma.product.update({
    where: { id },
    data: { isActive: active.isActive },
  });

  return updatedProduct;
};

const updateStock = async (
  id: string,
  stockData: { stock: number; variantId?: string; reason?: string },
  user: IAuthUser
) => {
  const { stock, variantId, reason } = stockData;

  return await prisma.$transaction(async (transactionClient) => {
    let previousStock = 0;
    let newStock = stock;

    if (variantId) {
      // Update variant stock
      const variant = await transactionClient.productVariant.findUniqueOrThrow({
        where: { id: variantId },
      });

      previousStock = variant.stock;
      newStock = stock;

      await transactionClient.productVariant.update({
        where: { id: variantId },
        data: { stock },
      });
    } else {
      // Update product stock
      const product = await transactionClient.product.findUniqueOrThrow({
        where: { id },
      });

      previousStock = product.stock;
      newStock = stock;

      await transactionClient.product.update({
        where: { id },
        data: { stock },
      });
    }

    // Create inventory record
    await transactionClient.productInventory.create({
      data: {
        productId: id,
        variantId: variantId || null,
        changeType: "ADJUSTMENT",
        previousStock,
        newStock,
        changeQuantity: newStock - previousStock,
        reason: reason || "Manual adjustment",
        userId: user?.id, // Changed to user?.id
      },
    });

    // Return updated product/variant
    if (variantId) {
      return await transactionClient.productVariant.findUnique({
        where: { id: variantId },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
            },
          },
        },
      });
    } else {
      return await transactionClient.product.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          sku: true,
          stock: true,
        },
      });
    }
  });
};

// Delete product (soft delete)
const deleteProduct = async (id: string) => {
  const productData = await prisma.product.findUniqueOrThrow({
    where: { id },
  });

  // Soft delete by setting isActive to false
  const deletedProduct = await prisma.product.update({
    where: { id },
    data: { isActive: false },
  });

  return deletedProduct;
};

// Get featured products
const getFeaturedProducts = async () => {
  const result = await prisma.product.findMany({
    where: {
      isFeatured: true,
      isActive: true,
    },
    take: 10,
    include: {
      brand: true,
      productImages: {
        where: { isPrimary: true },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return result;
};

const getProductsByStatus = async (
  statusParam: string,
  options: IPaginationOptions
) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);

  // Convert the status parameter to uppercase to match enum
  const upperStatus = statusParam.toUpperCase();

  // Validate if it's a valid ProductStatus enum value
  if (!Object.values(ProductStatus).includes(upperStatus as ProductStatus)) {
    throw new Error(
      `Invalid status parameter: ${statusParam}. Valid values are: ${Object.values(
        ProductStatus
      ).join(", ")}`
    );
  }

  // Simple where condition - just match the status field in database
  const whereCondition: Prisma.ProductWhereInput = {
    isActive: true,
    status: upperStatus as ProductStatus,
  };

  const result = await prisma.product.findMany({
    where: whereCondition,
    skip,
    take: limit,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      brand: true,
      productImages: {
        where: { isPrimary: true },
      },
      productCategories: {
        include: {
          category: true,
        },
      },
      _count: {
        select: {
          productReviews: true,
          wishlists: true,
        },
      },
    },
  });

  const total = await prisma.product.count({
    where: whereCondition,
  });

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: result,
  };
};

// Get products by category slug
const getProductsByCategorySlug = async (
  categorySlug: string,
  params: any,
  options: IPaginationOptions
) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const {
    searchTerm,
    minPrice,
    maxPrice,
    status,
    isFeatured,
    isActive,
    brandId,
    inStock,
    ...filterData
  } = params;

  const andConditions: Prisma.ProductWhereInput[] = [];

  // Add category slug filter
  andConditions.push({
    productCategories: {
      some: {
        category: {
          slug: categorySlug,
        },
      },
    },
  });

  // Search term
  if (searchTerm) {
    andConditions.push({
      OR: productSearchAbleFields.map((field) => ({
        [field]: {
          contains: searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }

  // Price range
  if (minPrice !== undefined || maxPrice !== undefined) {
    const priceCondition: any = {};
    if (minPrice !== undefined) priceCondition.gte = minPrice;
    if (maxPrice !== undefined) priceCondition.lte = maxPrice;
    andConditions.push({ price: priceCondition });
  }

  // Status filter
  if (status) {
    andConditions.push({ status });
  }

  // Featured filter
  if (isFeatured !== undefined) {
    andConditions.push({ isFeatured: isFeatured === "true" });
  }

  // Active filter
  if (isActive !== undefined) {
    andConditions.push({ isActive: isActive === "true" });
  }

  // Brand filter
  if (brandId) {
    andConditions.push({ brandId });
  }

  // Stock filter
  if (inStock !== undefined) {
    if (inStock === "true") {
      andConditions.push({
        OR: [
          { stock: { gt: 0 } },
          { productVariants: { some: { stock: { gt: 0 } } } },
        ],
      });
    } else {
      andConditions.push({
        AND: [
          { stock: { equals: 0 } },
          { productVariants: { every: { stock: { equals: 0 } } } },
        ],
      });
    }
  }

  const whereConditions: Prisma.ProductWhereInput = {
    AND: andConditions.length > 0 ? andConditions : undefined,
  };

  const result = await prisma.product.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? {
            [options.sortBy]: options.sortOrder,
          }
        : {
            createdAt: "desc",
          },
    include: {
      brand: true,
      productCategories: {
        include: {
          category: true,
        },
      },
      productImages: {
        orderBy: {
          sortOrder: "asc",
        },
        take: 1, // Get only primary image
      },
      productVariants: true,
      _count: {
        select: {
          productReviews: true,
          wishlists: true,
        },
      },
    },
  });

  const total = await prisma.product.count({
    where: whereConditions,
  });

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: result,
  };
};

export const productService = {
  createProduct,
  getAllFromDB,
  getById,
  getBySlug,
  updateProduct,
  updateProductStatus,
  updateProductFeatured,
  updateProductActive,
  updateStock,
  deleteProduct,
  getFeaturedProducts,
  getProductsByStatus,
  getProductsByCategorySlug,
};
