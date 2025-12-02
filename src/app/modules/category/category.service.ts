import { Prisma } from "@prisma/client";
import { Request } from "express";
import { IPaginationOptions } from "../../interfaces/pagination";
import { categorySearchAbleFields } from "./category.constant";
import { fileUploader } from "../../helper/fileUploader";
import prisma from "../../shared/prisma";
import { paginationHelper } from "../../helper/paginationHelper";
import slugify from "slugify";

// Generate slug from name
const generateSlug = (name: string): string => {
  return slugify(name, {
    lower: true,
    strict: true,
    trim: true,
  });
};

// Create category
const createCategory = async (req: Request) => {
  const file = req.file;
  const {
    name,
    slug: customSlug,
    description,
    isFeatured,
    parentId,
  } = req.body;

  let imageUrl: string | undefined;

  // Handle file upload
  if (file) {
    const uploadToCloudinary = await fileUploader.uploadToCloudinary(file);
    imageUrl = uploadToCloudinary?.secure_url;
  }

  // Generate slug if not provided
  const slug = customSlug || generateSlug(name);

  // Check if slug already exists
  const existingSlug = await prisma.category.findUnique({
    where: { slug },
  });

  if (existingSlug) {
    throw new Error("Slug already exists. Please provide a different slug.");
  }

  // Check parent category exists if parentId is provided
  if (parentId) {
    const parentCategory = await prisma.category.findUnique({
      where: { id: parentId },
    });

    if (!parentCategory) {
      throw new Error("Parent category not found");
    }
  }

  const result = await prisma.category.create({
    data: {
      name,
      slug,
      description,
      imageUrl,
      isFeatured,
      parentId: parentId || null,
    },
    include: {
      parent: true,
      children: true,
      productCategories: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              isActive: true,
              productImages: {
                where: { isPrimary: true },
                take: 1,
              },
            },
          },
        },
      },
    },
  });

  return result;
};

// Get all categories with filtering and pagination
const getAllFromDB = async (params: any, options: IPaginationOptions) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const { searchTerm, isFeatured, parentId, hasProducts, ...filterData } =
    params;

  const andConditions: Prisma.CategoryWhereInput[] = [];

  // Search term
  if (searchTerm) {
    andConditions.push({
      OR: categorySearchAbleFields.map((field) => ({
        [field]: {
          contains: searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }

  // Featured filter
  if (isFeatured !== undefined) {
    andConditions.push({ isFeatured: isFeatured === "true" });
  }

  // Parent filter
  if (parentId !== undefined) {
    if (parentId === "null" || parentId === null) {
      andConditions.push({ parentId: null });
    } else {
      andConditions.push({ parentId });
    }
  }

  // Has products filter
  if (hasProducts !== undefined) {
    if (hasProducts === "true") {
      andConditions.push({
        productCategories: {
          some: {
            product: {
              isActive: true,
            },
          },
        },
      });
    } else {
      andConditions.push({
        productCategories: {
          none: {},
        },
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

  const whereConditions: Prisma.CategoryWhereInput = {
    AND: andConditions.length > 0 ? andConditions : undefined,
  };

  const result = await prisma.category.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? {
            [options.sortBy]: options.sortOrder,
          }
        : {
            name: "asc",
          },
    include: {
      parent: true,
      children: {
        include: {
          _count: {
            select: {
              productCategories: true,
            },
          },
        },
      },
      _count: {
        select: {
          productCategories: true,
          children: true,
        },
      },
    },
  });

  const total = await prisma.category.count({
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

// Get single category by ID
const getById = async (id: string) => {
  const result = await prisma.category.findUniqueOrThrow({
    where: { id },
    include: {
      parent: true,
      children: {
        include: {
          _count: {
            select: {
              productCategories: true,
            },
          },
        },
      },
      productCategories: {
        include: {
          product: {
            include: {
              brand: true,
              productImages: {
                where: { isPrimary: true },
                take: 1,
              },
              productVariants: true,
            },
          },
        },
        take: 20, // Limit products per category
      },
      _count: {
        select: {
          productCategories: true,
          children: true,
        },
      },
    },
  });

  return result;
};

// Get single category by slug
const getBySlug = async (slug: string) => {
  const result = await prisma.category.findUniqueOrThrow({
    where: { slug },
    include: {
      parent: true,
      children: {
        include: {
          _count: {
            select: {
              productCategories: {
                where: {
                  product: {
                    isActive: true,
                  },
                },
              },
            },
          },
        },
      },
      productCategories: {
        where: {
          product: {
            isActive: true,
          },
        },
        include: {
          product: {
            include: {
              brand: true,
              productImages: {
                where: { isPrimary: true },
                take: 1,
              },
              productVariants: true,
              _count: {
                select: {
                  productReviews: true,
                },
              },
            },
          },
        },
      },
      _count: {
        select: {
          productCategories: {
            where: {
              product: {
                isActive: true,
              },
            },
          },
          children: true,
        },
      },
    },
  });

  return result;
};

// Update category
const updateCategory = async (id: string, req: Request) => {
  const file = req.file;
  const {
    name,
    slug: customSlug,
    description,
    imageUrl: existingImageUrl,
    isFeatured,
    parentId,
  } = req.body;

  let imageUrl: string | undefined = existingImageUrl;

  // Handle file upload
  if (file) {
    const uploadToCloudinary = await fileUploader.uploadToCloudinary(file);
    imageUrl = uploadToCloudinary?.secure_url;
  }

  // Get current category
  const currentCategory = await prisma.category.findUniqueOrThrow({
    where: { id },
  });

  // Generate slug if name changed and no custom slug provided
  let slug = currentCategory.slug;
  if (name && name !== currentCategory.name && !customSlug) {
    slug = generateSlug(name);

    // Check if new slug already exists (excluding current category)
    const existingSlug = await prisma.category.findUnique({
      where: { slug },
    });

    if (existingSlug && existingSlug.id !== id) {
      throw new Error("Slug already exists. Please provide a different slug.");
    }
  } else if (customSlug && customSlug !== currentCategory.slug) {
    slug = customSlug;

    // Check if new slug already exists
    const existingSlug = await prisma.category.findUnique({
      where: { slug },
    });

    if (existingSlug) {
      throw new Error("Slug already exists. Please provide a different slug.");
    }
  }

  // Check parent category exists if parentId is provided
  if (parentId) {
    const parentCategory = await prisma.category.findUnique({
      where: { id: parentId },
    });

    if (!parentCategory) {
      throw new Error("Parent category not found");
    }

    // Prevent circular reference (category cannot be its own parent)
    if (parentId === id) {
      throw new Error("Category cannot be its own parent");
    }

    // Check for circular reference in hierarchy
    const checkCircularReference = async (
      categoryId: string,
      targetId: string
    ): Promise<boolean> => {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
        include: { children: true },
      });

      if (!category) return false;
      if (category.id === targetId) return true;

      for (const child of category.children) {
        if (await checkCircularReference(child.id, targetId)) {
          return true;
        }
      }

      return false;
    };

    if (await checkCircularReference(parentId, id)) {
      throw new Error(
        "Cannot set parent as it would create a circular reference"
      );
    }
  }

  const result = await prisma.category.update({
    where: { id },
    data: {
      name,
      slug,
      description,
      imageUrl,
      isFeatured,
      parentId: parentId === null ? null : parentId || currentCategory.parentId,
    },
    include: {
      parent: true,
      children: true,
      productCategories: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              isActive: true,
              productImages: {
                where: { isPrimary: true },
                take: 1,
              },
            },
          },
        },
      },
    },
  });

  return result;
};

// Update category featured status
const updateCategoryFeatured = async (
  id: string,
  featured: { isFeatured: boolean }
) => {
  const categoryData = await prisma.category.findUniqueOrThrow({
    where: { id },
  });

  const updatedCategory = await prisma.category.update({
    where: { id },
    data: { isFeatured: featured.isFeatured },
  });

  return updatedCategory;
};

// Delete category
const deleteCategory = async (id: string) => {
  const categoryData = await prisma.category.findUniqueOrThrow({
    where: { id },
    include: {
      children: true,
      productCategories: true,
    },
  });

  // Check if category has children
  if (categoryData.children.length > 0) {
    throw new Error(
      "Cannot delete category with subcategories. Delete subcategories first."
    );
  }

  // Check if category has products
  if (categoryData.productCategories.length > 0) {
    throw new Error(
      "Cannot delete category with products. Remove products first."
    );
  }

  const deletedCategory = await prisma.category.delete({
    where: { id },
  });

  return deletedCategory;
};

// Get category tree (hierarchical structure)
const getCategoryTree = async () => {
  const allCategories = await prisma.category.findMany({
    include: {
      children: {
        include: {
          children: true, // 2 levels deep
        },
      },
      _count: {
        select: {
          productCategories: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  // Build tree structure
  const buildTree = (categories: any[], parentId: string | null = null) => {
    const tree: any[] = [];

    categories
      .filter((category) => category.parentId === parentId)
      .forEach((category) => {
        const node = {
          ...category,
          children: buildTree(categories, category.id),
        };
        tree.push(node);
      });

    return tree;
  };

  return buildTree(allCategories);
};

// Get featured categories with product count
const getFeaturedCategories = async () => {
  const result = await prisma.category.findMany({
    where: {
      isFeatured: true,
      parentId: null, // Only top-level categories
    },
    include: {
      _count: {
        select: {
          productCategories: {
            where: {
              product: {
                isActive: true,
              },
            },
          },
        },
      },
      productCategories: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              discount: true,
              salePrice: true,
              productImages: {
                where: { isPrimary: true },
                take: 1,
              },
            },
          },
        },
        take: 4, // Get 4 products per category
      },
    },
    orderBy: {
      name: "asc",
    },
    take: 8, // Limit to 8 featured categories
  });

  return result;
};

// Get categories for navigation (parent categories with children)
const getNavigationCategories = async () => {
  const parentCategories = await prisma.category.findMany({
    where: {
      parentId: null,
    },
    include: {
      children: {
        include: {
          _count: {
            select: {
              productCategories: {
                where: {
                  product: {
                    isActive: true,
                  },
                },
              },
            },
          },
        },
        orderBy: {
          name: "asc",
        },
      },
      _count: {
        select: {
          productCategories: {
            where: {
              product: {
                isActive: true,
              },
            },
          },
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  return parentCategories;
};

export const categoryService = {
  createCategory,
  getAllFromDB,
  getById,
  getBySlug,
  updateCategory,
  updateCategoryFeatured,
  deleteCategory,
  getCategoryTree,
  getFeaturedCategories,
  getNavigationCategories,
};
