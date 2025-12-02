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
  const { name, slug: customSlug, description, isFeatured } = req.body;

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

  const result = await prisma.category.create({
    data: {
      name,
      slug,
      description,
      imageUrl,
      isFeatured: isFeatured || false,
    },
  });

  return result;
};

// Get all categories with filtering and pagination
const getAllFromDB = async (params: any, options: IPaginationOptions) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const { searchTerm, isFeatured, hasProducts, ...filterData } = params;

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
  });

  return result;
};

// Get single category by slug
const getBySlug = async (slug: string) => {
  const result = await prisma.category.findUniqueOrThrow({
    where: { slug },
  });

  return result;
};

// Update category (slug is immutable)
const updateCategory = async (id: string, req: Request) => {
  const file = req.file;
  const {
    name,
    description,
    imageUrl: existingImageUrl,
    isFeatured,
  } = req.body;

  let imageUrl: string | undefined = existingImageUrl;

  // Handle file upload
  if (file) {
    const uploadToCloudinary = await fileUploader.uploadToCloudinary(file);
    imageUrl = uploadToCloudinary?.secure_url;
  }

  const result = await prisma.category.update({
    where: { id },
    data: {
      name,
      description,
      imageUrl,
      isFeatured,
    },
  });

  return result;
};

// Update category featured status
const updateCategoryFeatured = async (
  id: string,
  featured: { isFeatured: boolean }
) => {
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
      productCategories: true,
    },
  });

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

// Get featured categories
const getFeaturedCategories = async () => {
  const result = await prisma.category.findMany({
    where: {
      isFeatured: true,
    },
    orderBy: {
      name: "asc",
    },
    take: 8, // Limit to 8 featured categories
  });

  return result;
};

// Get all categories for navigation
const getNavigationCategories = async () => {
  const categories = await prisma.category.findMany({
    orderBy: {
      name: "asc",
    },
  });

  return categories;
};

export const categoryService = {
  createCategory,
  getAllFromDB,
  getById,
  getBySlug,
  updateCategory,
  updateCategoryFeatured,
  deleteCategory,
  getFeaturedCategories,
  getNavigationCategories,
};
