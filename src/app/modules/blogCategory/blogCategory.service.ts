import { Prisma } from "@prisma/client";
import { IPaginationOptions } from "../../interfaces/pagination";
import { blogCategorySearchAbleFields } from "./blogCategory.constant";
import prisma from "../../shared/prisma";
import { paginationHelper } from "../../helper/paginationHelper";

// Create blog category
const createBlogCategory = async (categoryData: any) => {
  // Check if slug already exists
  const existingCategory = await prisma.blogCategory.findUnique({
    where: { slug: categoryData.slug },
  });

  if (existingCategory) {
    throw new Error("Blog category with this slug already exists");
  }

  const result = await prisma.blogCategory.create({
    data: categoryData,
  });

  return result;
};

// Get all blog categories
const getAllBlogCategories = async (
  params: any,
  options: IPaginationOptions
) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const { searchTerm, ...filterData } = params;

  const andConditions: Prisma.BlogCategoryWhereInput[] = [];

  if (searchTerm) {
    andConditions.push({
      OR: blogCategorySearchAbleFields.map((field) => ({
        [field]: {
          contains: searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }

  const whereConditions: Prisma.BlogCategoryWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.blogCategory.findMany({
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
      _count: {
        select: {
          blogPostCategories: true,
        },
      },
    },
  });

  const total = await prisma.blogCategory.count({
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

// Get blog category by ID
const getBlogCategoryById = async (id: string) => {
  const result = await prisma.blogCategory.findUniqueOrThrow({
    where: { id },
    include: {
      blogPostCategories: {
        include: {
          blogPost: {
            select: {
              id: true,
              title: true,
              slug: true,
              excerpt: true,
              featuredImageUrl: true,
              publishedAt: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        take: 10,
      },
      _count: {
        select: {
          blogPostCategories: true,
        },
      },
    },
  });

  return result;
};

// Get blog category by slug
const getBlogCategoryBySlug = async (slug: string) => {
  const result = await prisma.blogCategory.findUniqueOrThrow({
    where: { slug },
    include: {
      blogPostCategories: {
        include: {
          blogPost: {
            select: {
              id: true,
              title: true,
              slug: true,
              excerpt: true,
              featuredImageUrl: true,
              publishedAt: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: {
          blogPost: {
            publishedAt: "desc",
          },
        },
      },
      _count: {
        select: {
          blogPostCategories: true,
        },
      },
    },
  });

  return result;
};

// Update blog category
const updateBlogCategory = async (id: string, updateData: any) => {
  // Check if updating slug and it already exists
  if (updateData.slug) {
    const existingCategory = await prisma.blogCategory.findFirst({
      where: {
        slug: updateData.slug,
        id: { not: id },
      },
    });

    if (existingCategory) {
      throw new Error("Blog category with this slug already exists");
    }
  }

  const result = await prisma.blogCategory.update({
    where: { id },
    data: updateData,
  });

  return result;
};

// Delete blog category
const deleteBlogCategory = async (id: string) => {
  // Check if category has posts
  const postsCount = await prisma.blogPostCategory.count({
    where: { categoryId: id },
  });

  if (postsCount > 0) {
    throw new Error(
      "Cannot delete category that has blog posts. Remove posts first or reassign them."
    );
  }

  const result = await prisma.blogCategory.delete({
    where: { id },
  });

  return result;
};

export const blogCategoryService = {
  createBlogCategory,
  getAllBlogCategories,
  getBlogCategoryById,
  getBlogCategoryBySlug,
  updateBlogCategory,
  deleteBlogCategory,
};
