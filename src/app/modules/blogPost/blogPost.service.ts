import { Prisma } from "@prisma/client";
import { IAuthUser } from "../../interfaces/common";
import { IPaginationOptions } from "../../interfaces/pagination";
import { blogPostSearchAbleFields } from "./blogPost.constant";
import prisma from "../../shared/prisma";
import { paginationHelper } from "../../helper/paginationHelper";

// Create blog post
const createBlogPost = async (blogPostData: any, user?: IAuthUser) => {
  const { categoryIds, ...postData } = blogPostData;

  // Check if slug already exists
  const existingPost = await prisma.blogPost.findUnique({
    where: { slug: postData.slug },
  });

  if (existingPost) {
    throw new Error("Blog post with this slug already exists");
  }

  // Set user ID from authenticated user
  if (user) {
    postData.userId = user.id;
  }

  const result = await prisma.$transaction(async (transactionClient) => {
    // Create blog post
    const blogPost = await transactionClient.blogPost.create({
      data: {
        ...postData,
        publishedAt: postData.publishedAt
          ? new Date(postData.publishedAt)
          : postData.publishedAt === false
          ? null
          : new Date(),
      },
    });

    // Create category associations if provided
    if (categoryIds && categoryIds.length > 0) {
      // Verify all categories exist
      const categories = await transactionClient.blogCategory.findMany({
        where: { id: { in: categoryIds } },
        select: { id: true },
      });

      if (categories.length !== categoryIds.length) {
        throw new Error("One or more categories not found");
      }

      // Create associations
      await transactionClient.blogPostCategory.createMany({
        data: categoryIds.map((categoryId: string) => ({
          blogPostId: blogPost.id,
          categoryId,
        })),
      });
    }

    // If this post is marked as latest, update others to not latest
    if (postData.isLatest === true) {
      await transactionClient.blogPost.updateMany({
        where: {
          id: { not: blogPost.id },
          isLatest: true,
        },
        data: {
          isLatest: false,
        },
      });
    }

    // Get full post with relations
    const fullPost = await transactionClient.blogPost.findUnique({
      where: { id: blogPost.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImageUrl: true,
          },
        },
        blogPostCategories: {
          include: {
            category: true,
          },
        },
      },
    });

    return fullPost;
  });

  return result;
};

// Get all blog posts
const getAllBlogPosts = async (
  params: any,
  options: IPaginationOptions,
  publishedOnly: boolean = false
) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const {
    searchTerm,
    userId,
    categoryId,
    isLatest,
    categorySlug,
    ...filterData
  } = params;

  const andConditions: Prisma.BlogPostWhereInput[] = [];

  // Only show published posts for public access
  if (publishedOnly) {
    andConditions.push({
      publishedAt: { not: null },
    });
  }

  if (searchTerm) {
    andConditions.push({
      OR: blogPostSearchAbleFields.map((field) => ({
        [field]: {
          contains: searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }

  // User filter
  if (userId) {
    andConditions.push({ userId });
  }

  // Category filter (through join table)
  if (categoryId) {
    andConditions.push({
      blogPostCategories: {
        some: {
          categoryId,
        },
      },
    });
  }

  // Category slug filter
  if (categorySlug) {
    const category = await prisma.blogCategory.findUnique({
      where: { slug: categorySlug },
      select: { id: true },
    });

    if (category) {
      andConditions.push({
        blogPostCategories: {
          some: {
            categoryId: category.id,
          },
        },
      });
    }
  }

  // Latest filter
  if (isLatest === "true") {
    andConditions.push({ isLatest: true });
  }

  const whereConditions: Prisma.BlogPostWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.blogPost.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? {
            [options.sortBy]: options.sortOrder,
          }
        : {
            publishedAt: "desc",
          },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImageUrl: true,
        },
      },
      blogPostCategories: {
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
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

  const total = await prisma.blogPost.count({
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

// Get blog post by ID
const getBlogPostById = async (id: string, publishedOnly: boolean = false) => {
  const whereCondition: Prisma.BlogPostWhereUniqueInput = { id };

  // Add published filter for public access
  if (publishedOnly) {
    (whereCondition as any).publishedAt = { not: null };
  }

  const result = await prisma.blogPost.findUniqueOrThrow({
    where: whereCondition,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImageUrl: true,
        },
      },
      blogPostCategories: {
        include: {
          category: true,
        },
      },
    },
  });

  return result;
};

// Get blog post by slug
const getBlogPostBySlug = async (
  slug: string,
  publishedOnly: boolean = false
) => {
  const whereCondition: Prisma.BlogPostWhereUniqueInput = { slug };

  // Add published filter for public access
  if (publishedOnly) {
    (whereCondition as any).publishedAt = { not: null };
  }

  const result = await prisma.blogPost.findUniqueOrThrow({
    where: whereCondition,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImageUrl: true,
        },
      },
      blogPostCategories: {
        include: {
          category: true,
        },
      },
    },
  });

  return result;
};

// Update blog post
const updateBlogPost = async (
  id: string,
  updateData: any,
  user?: IAuthUser
) => {
  const { categoryIds, ...postData } = updateData;

  // Check if updating slug and it already exists
  if (postData.slug) {
    const existingPost = await prisma.blogPost.findFirst({
      where: {
        slug: postData.slug,
        id: { not: id },
      },
    });

    if (existingPost) {
      throw new Error("Blog post with this slug already exists");
    }
  }

  const result = await prisma.$transaction(async (transactionClient) => {
    // Update blog post
    const updatedPost = await transactionClient.blogPost.update({
      where: { id },
      data: {
        ...postData,
        publishedAt: postData.publishedAt
          ? new Date(postData.publishedAt)
          : postData.publishedAt === false
          ? null
          : undefined,
      },
    });

    // Update categories if provided
    if (categoryIds !== undefined) {
      // Delete existing categories
      await transactionClient.blogPostCategory.deleteMany({
        where: { blogPostId: id },
      });

      // Add new categories if provided
      if (categoryIds && categoryIds.length > 0) {
        // Verify all categories exist
        const categories = await transactionClient.blogCategory.findMany({
          where: { id: { in: categoryIds } },
          select: { id: true },
        });

        if (categories.length !== categoryIds.length) {
          throw new Error("One or more categories not found");
        }

        // Create new associations
        await transactionClient.blogPostCategory.createMany({
          data: categoryIds.map((categoryId: string) => ({
            blogPostId: id,
            categoryId,
          })),
        });
      }
    }

    // If this post is marked as latest, update others to not latest
    if (postData.isLatest === true) {
      await transactionClient.blogPost.updateMany({
        where: {
          id: { not: id },
          isLatest: true,
        },
        data: {
          isLatest: false,
        },
      });
    }

    // Get full updated post
    const fullPost = await transactionClient.blogPost.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImageUrl: true,
          },
        },
        blogPostCategories: {
          include: {
            category: true,
          },
        },
      },
    });

    return fullPost;
  });

  return result;
};

// Delete blog post
const deleteBlogPost = async (id: string) => {
  const result = await prisma.$transaction(async (transactionClient) => {
    // Delete category associations first
    await transactionClient.blogPostCategory.deleteMany({
      where: { blogPostId: id },
    });

    // Delete the blog post
    const deletedPost = await transactionClient.blogPost.delete({
      where: { id },
    });

    return deletedPost;
  });

  return result;
};

// Get latest blog posts
const getLatestBlogPosts = async (limit: number = 5) => {
  const result = await prisma.blogPost.findMany({
    where: {
      publishedAt: { not: null },
      isLatest: true,
    },
    take: limit,
    orderBy: {
      publishedAt: "desc",
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImageUrl: true,
        },
      },
      blogPostCategories: {
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
    },
  });

  return result;
};

// Get my blog posts (for authenticated users)
const getMyBlogPosts = async (
  user: IAuthUser,
  params: any,
  options: IPaginationOptions
) => {
  // Add user ID to filters
  const filters = { ...params, userId: user.id };
  return getAllBlogPosts(filters, options, false); // false = show all (including drafts)
};

export const blogPostService = {
  createBlogPost,
  getAllBlogPosts,
  getBlogPostById,
  getBlogPostBySlug,
  updateBlogPost,
  deleteBlogPost,
  getLatestBlogPosts,
  getMyBlogPosts,
};
