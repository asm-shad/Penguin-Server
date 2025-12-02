import { Prisma } from "@prisma/client";
import { IAuthUser } from "../../interfaces/common";
import { IPaginationOptions } from "../../interfaces/pagination";
import { productReviewSearchAbleFields } from "./productReview.constant";
import prisma from "../../shared/prisma";
import { paginationHelper } from "../../helper/paginationHelper";

// Create review
const createReview = async (reviewData: any, user: IAuthUser) => {
  const { productId, rating, title, comment } = reviewData;

  // Check if user has already reviewed this product
  const existingReview = await prisma.productReview.findUnique({
    where: {
      productId_userId: {
        productId,
        userId: user.id,
      },
    },
  });

  if (existingReview) {
    throw new Error("You have already reviewed this product");
  }

  // Validate rating
  if (rating < 1 || rating > 5) {
    throw new Error("Rating must be between 1 and 5");
  }

  // Verify product exists and is active
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      isActive: true,
    },
  });

  if (!product) {
    throw new Error("Product not found or is not active");
  }

  // Check if user has purchased this product (optional validation)
  const hasPurchased = await prisma.orderItem.findFirst({
    where: {
      productId,
      order: {
        userId: user.id,
        status: { in: ["PAID", "SHIPPED", "DELIVERED"] },
      },
    },
  });

  // You can uncomment this if you want to enforce purchase validation
  // if (!hasPurchased) {
  //   throw new Error("You must purchase this product before reviewing it");
  // }

  const result = await prisma.productReview.create({
    data: {
      productId,
      userId: user.id,
      rating,
      title,
      comment,
      isApproved: false, // Default to not approved
    },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          productImages: {
            where: { isPrimary: true },
            take: 1,
          },
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImageUrl: true,
        },
      },
    },
  });

  return result;
};

// Get all reviews
const getAllReviews = async (params: any, options: IPaginationOptions) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const {
    searchTerm,
    rating,
    productId,
    userId,
    isApproved,
    productName,
    userName,
    ...filterData
  } = params;

  const andConditions: Prisma.ProductReviewWhereInput[] = [];

  // Only show approved reviews by default for public access
  if (isApproved === undefined) {
    andConditions.push({ isApproved: true });
  }

  if (searchTerm) {
    andConditions.push({
      OR: productReviewSearchAbleFields.map((field) => ({
        [field]: {
          contains: searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }

  if (rating) {
    andConditions.push({ rating: parseInt(rating) });
  }

  if (productId) {
    andConditions.push({ productId });
  }

  if (userId) {
    andConditions.push({ userId });
  }

  if (isApproved !== undefined) {
    andConditions.push({ isApproved: isApproved === "true" });
  }

  // Filter by product name
  if (productName) {
    andConditions.push({
      product: {
        name: {
          contains: productName,
          mode: "insensitive",
        },
      },
    });
  }

  // Filter by user name
  if (userName) {
    andConditions.push({
      user: {
        name: {
          contains: userName,
          mode: "insensitive",
        },
      },
    });
  }

  const whereConditions: Prisma.ProductReviewWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.productReview.findMany({
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
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          productImages: {
            where: { isPrimary: true },
            take: 1,
          },
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImageUrl: true,
        },
      },
    },
  });

  const total = await prisma.productReview.count({
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

// Get review by ID
const getReviewById = async (id: string) => {
  const result = await prisma.productReview.findUniqueOrThrow({
    where: { id },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          productImages: {
            where: { isPrimary: true },
            take: 1,
          },
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImageUrl: true,
        },
      },
    },
  });

  return result;
};

// Get reviews for a specific product
const getProductReviews = async (
  productId: string,
  params: any,
  options: IPaginationOptions
) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const { rating, isApproved, searchTerm } = params;

  const andConditions: Prisma.ProductReviewWhereInput[] = [{ productId }];

  // Only show approved reviews for public access
  if (isApproved === undefined) {
    andConditions.push({ isApproved: true });
  }

  if (rating) {
    andConditions.push({ rating: parseInt(rating) });
  }

  if (searchTerm) {
    andConditions.push({
      OR: productReviewSearchAbleFields.map((field) => ({
        [field]: {
          contains: searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }

  const whereConditions: Prisma.ProductReviewWhereInput = {
    AND: andConditions,
  };

  const result = await prisma.productReview.findMany({
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
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImageUrl: true,
        },
      },
    },
  });

  const total = await prisma.productReview.count({
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

// Get my reviews
const getMyReviews = async (
  user: IAuthUser,
  params: any,
  options: IPaginationOptions
) => {
  const filters = { ...params, userId: user.id };
  return getAllReviews(filters, options);
};

// Update review
const updateReview = async (id: string, updateData: any, user: IAuthUser) => {
  // Check if review exists and belongs to user
  const review = await prisma.productReview.findUniqueOrThrow({
    where: { id },
  });

  if (review.userId !== user.id) {
    throw new Error("You can only update your own reviews");
  }

  // Validate rating if updating
  if (updateData.rating && (updateData.rating < 1 || updateData.rating > 5)) {
    throw new Error("Rating must be between 1 and 5");
  }

  const result = await prisma.productReview.update({
    where: { id },
    data: {
      ...updateData,
      isApproved: false, // Reset approval status when updated
    },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImageUrl: true,
        },
      },
    },
  });

  return result;
};

// Delete review
const deleteReview = async (id: string, user: IAuthUser) => {
  // Check if review exists and belongs to user
  const review = await prisma.productReview.findUniqueOrThrow({
    where: { id },
  });

  if (review.userId !== user.id) {
    throw new Error("You can only delete your own reviews");
  }

  const result = await prisma.productReview.delete({
    where: { id },
  });

  return result;
};

// Toggle review approval (admin only)
const toggleReviewApproval = async (id: string, approvalData: any) => {
  const { isApproved } = approvalData;

  const result = await prisma.productReview.update({
    where: { id },
    data: { isApproved },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return result;
};

// Get review statistics for a product
const getReviewStatistics = async (productId: string) => {
  // Verify product exists
  await prisma.product.findUniqueOrThrow({
    where: { id: productId },
  });

  const [
    totalReviews,
    approvedReviews,
    averageRating,
    ratingDistribution,
    recentReviews,
  ] = await Promise.all([
    prisma.productReview.count({ where: { productId } }),
    prisma.productReview.count({ where: { productId, isApproved: true } }),
    prisma.productReview.aggregate({
      where: { productId, isApproved: true },
      _avg: { rating: true },
    }),
    prisma.productReview.groupBy({
      by: ["rating"],
      where: { productId, isApproved: true },
      _count: { rating: true },
      orderBy: {
        rating: "desc",
      },
    }),
    prisma.productReview.findMany({
      where: { productId, isApproved: true },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profileImageUrl: true,
          },
        },
      },
    }),
  ]);

  // Calculate percentage for each rating
  const ratingPercentages: Record<number, number> = {};
  ratingDistribution.forEach((item) => {
    ratingPercentages[item.rating] =
      approvedReviews > 0 ? (item._count.rating / approvedReviews) * 100 : 0;
  });

  return {
    totalReviews,
    approvedReviews,
    pendingReviews: totalReviews - approvedReviews,
    averageRating: averageRating._avg.rating || 0,
    ratingDistribution: ratingDistribution.reduce((acc, item) => {
      acc[item.rating] = item._count.rating;
      return acc;
    }, {} as Record<number, number>),
    ratingPercentages,
    recentReviews,
  };
};

// Get recent reviews
const getRecentReviews = async (limit: number = 10) => {
  const result = await prisma.productReview.findMany({
    where: {
      isApproved: true,
    },
    take: limit,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          productImages: {
            where: { isPrimary: true },
            take: 1,
          },
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          profileImageUrl: true,
        },
      },
    },
  });

  return result;
};

// Get pending reviews for admin
const getPendingReviews = async (params: any, options: IPaginationOptions) => {
  const filters = { ...params, isApproved: false };
  return getAllReviews(filters, options);
};

// Bulk approve reviews
const bulkApproveReviews = async (approvalData: any) => {
  const { reviewIds, isApproved } = approvalData;

  const result = await prisma.productReview.updateMany({
    where: {
      id: { in: reviewIds },
    },
    data: { isApproved },
  });

  return {
    updatedCount: result.count,
    message: `Successfully ${isApproved ? "approved" : "rejected"} ${
      result.count
    } reviews`,
  };
};

// Get user review statistics
const getUserReviewStats = async (userId: string) => {
  const [totalReviews, approvedReviews, pendingReviews, averageRating] =
    await Promise.all([
      prisma.productReview.count({ where: { userId } }),
      prisma.productReview.count({ where: { userId, isApproved: true } }),
      prisma.productReview.count({ where: { userId, isApproved: false } }),
      prisma.productReview.aggregate({
        where: { userId, isApproved: true },
        _avg: { rating: true },
      }),
    ]);

  return {
    totalReviews,
    approvedReviews,
    pendingReviews,
    averageRating: averageRating._avg.rating || 0,
    approvalRate: totalReviews > 0 ? (approvedReviews / totalReviews) * 100 : 0,
  };
};

export const productReviewService = {
  createReview,
  getAllReviews,
  getReviewById,
  getProductReviews,
  getMyReviews,
  updateReview,
  deleteReview,
  toggleReviewApproval,
  getReviewStatistics,
  getRecentReviews,
  getPendingReviews,
  bulkApproveReviews,
  getUserReviewStats,
};
