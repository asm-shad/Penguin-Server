import { Prisma } from "@prisma/client";
import { Request } from "express";
import { IPaginationOptions } from "../../interfaces/pagination";
import { brandSearchAbleFields } from "./brand.constant";
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

// Create brand
const createBrand = async (req: Request) => {
  const file = req.file;
  const { name, slug: customSlug, description } = req.body;

  let imageUrl: string | undefined;

  // Handle file upload
  if (file) {
    const uploadToCloudinary = await fileUploader.uploadToCloudinary(file);
    imageUrl = uploadToCloudinary?.secure_url;
  }

  // Generate slug if not provided
  const slug = customSlug || generateSlug(name);

  // Check if slug already exists
  const existingSlug = await prisma.brand.findUnique({
    where: { slug },
  });

  if (existingSlug) {
    throw new Error(
      "Brand slug already exists. Please provide a different slug or name."
    );
  }

  // Check if name already exists
  const existingName = await prisma.brand.findUnique({
    where: { name },
  });

  if (existingName) {
    throw new Error("Brand name already exists.");
  }

  const result = await prisma.brand.create({
    data: {
      name,
      slug,
      description,
      imageUrl,
    },
  });

  return result;
};

// Get all brands with filtering and pagination
const getAllFromDB = async (params: any, options: IPaginationOptions) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const { searchTerm, hasProducts, ...filterData } = params;

  const andConditions: Prisma.BrandWhereInput[] = [];

  // Search term
  if (searchTerm) {
    andConditions.push({
      OR: brandSearchAbleFields.map((field) => ({
        [field]: {
          contains: searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }

  // Has products filter
  if (hasProducts !== undefined) {
    if (hasProducts === "true") {
      andConditions.push({
        products: {
          some: {},
        },
      });
    } else {
      andConditions.push({
        products: {
          none: {},
        },
      });
    }
  }

  const whereConditions: Prisma.BrandWhereInput = {
    AND: andConditions.length > 0 ? andConditions : undefined,
  };

  // SIMPLIFIED: Only basic brand info, no product includes
  const result = await prisma.brand.findMany({
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
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      imageUrl: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          products: true,
        },
      },
    },
  });

  const total = await prisma.brand.count({
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

// Get single brand by ID
const getById = async (id: string) => {
  const result = await prisma.brand.findUniqueOrThrow({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      imageUrl: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return result;
};

// Get single brand by slug
const getBySlug = async (slug: string) => {
  const result = await prisma.brand.findUniqueOrThrow({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      imageUrl: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return result;
};

// Update brand
const updateBrand = async (id: string, req: Request) => {
  const file = req.file;
  const { name, description, imageUrl: existingImageUrl } = req.body;

  let imageUrl: string | undefined = existingImageUrl;

  // Handle file upload
  if (file) {
    const uploadToCloudinary = await fileUploader.uploadToCloudinary(file);
    imageUrl = uploadToCloudinary?.secure_url;
  }

  // Get current brand
  const currentBrand = await prisma.brand.findUniqueOrThrow({
    where: { id },
  });

  // Check if name already exists (excluding current brand)
  if (name && name !== currentBrand.name) {
    const existingName = await prisma.brand.findUnique({
      where: { name },
    });

    if (existingName && existingName.id !== id) {
      throw new Error("Brand name already exists.");
    }
  }

  const result = await prisma.brand.update({
    where: { id },
    data: {
      name,
      description,
      imageUrl,
    },
  });

  return result;
};

// Delete brand
const deleteBrand = async (id: string) => {
  const brandData = await prisma.brand.findUniqueOrThrow({
    where: { id },
    include: {
      products: true,
    },
  });

  // Check if brand has products
  if (brandData.products.length > 0) {
    throw new Error(
      "Cannot delete brand with products. Remove or reassign products first."
    );
  }

  const deletedBrand = await prisma.brand.delete({
    where: { id },
  });

  return deletedBrand;
};

// Get popular brands (brands with most products)
const getPopularBrands = async () => {
  const result = await prisma.brand.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      imageUrl: true,
      _count: {
        select: {
          products: true,
        },
      },
    },
    orderBy: {
      products: {
        _count: "desc",
      },
    },
    take: 10,
  });

  return result;
};

// Get all brands for dropdown (simple list)
const getAllBrandsForDropdown = async () => {
  const result = await prisma.brand.findMany({
    select: {
      id: true,
      name: true,
      imageUrl: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return result;
};

export const brandService = {
  createBrand,
  getAllFromDB,
  getById,
  getBySlug,
  updateBrand,
  deleteBrand,
  getPopularBrands,
  getAllBrandsForDropdown,
};
