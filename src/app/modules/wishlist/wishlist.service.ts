import { IAuthUser } from "../../interfaces/common";
import prisma from "../../shared/prisma";

// Add product to wishlist
const addToWishlist = async (wishlistData: any, user: IAuthUser) => {
  const { productId } = wishlistData;

  // Check if product exists and is active
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      isActive: true,
    },
  });

  if (!product) {
    throw new Error("Product not found or is not active");
  }

  // Check if already in wishlist
  const existingWishlist = await prisma.wishlist.findUnique({
    where: {
      userId_productId: {
        userId: user.id,
        productId,
      },
    },
  });

  if (existingWishlist) {
    throw new Error("Product is already in your wishlist");
  }

  const result = await prisma.wishlist.create({
    data: {
      userId: user.id,
      productId,
    },
    include: {
      product: {
        include: {
          productImages: {
            where: { isPrimary: true },
            take: 1,
          },
          brand: {
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

// Remove product from wishlist
const removeFromWishlist = async (productId: string, user: IAuthUser) => {
  // Check if product exists in wishlist
  const wishlistItem = await prisma.wishlist.findUnique({
    where: {
      userId_productId: {
        userId: user.id,
        productId,
      },
    },
  });

  if (!wishlistItem) {
    throw new Error("Product not found in your wishlist");
  }

  const result = await prisma.wishlist.delete({
    where: {
      id: wishlistItem.id,
    },
  });

  return result;
};

// Get user's wishlist
const getMyWishlist = async (user: IAuthUser) => {
  // First get all wishlist items
  const wishlistItems = await prisma.wishlist.findMany({
    where: {
      userId: user.id,
    },
    include: {
      product: {
        include: {
          productImages: {
            where: { isPrimary: true },
            take: 1,
          },
          brand: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          productCategories: {
            include: {
              category: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
            take: 2,
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Filter out inactive products on the server side
  const filteredWishlist = wishlistItems.filter(
    (item) => item.product.isActive
  );

  return filteredWishlist;
};

// Check if product is in wishlist
const checkInWishlist = async (productId: string, user: IAuthUser) => {
  const wishlistItem = await prisma.wishlist.findUnique({
    where: {
      userId_productId: {
        userId: user.id,
        productId,
      },
    },
    select: {
      id: true,
      createdAt: true,
    },
  });

  return {
    isInWishlist: !!wishlistItem,
    productId,
    wishlistId: wishlistItem?.id,
    addedAt: wishlistItem?.createdAt,
  };
};

// Clear entire wishlist
const clearWishlist = async (user: IAuthUser) => {
  const result = await prisma.wishlist.deleteMany({
    where: {
      userId: user.id,
    },
  });

  return {
    deletedCount: result.count,
    message: `Successfully removed ${result.count} items from wishlist`,
  };
};

// Get wishlist count
const getWishlistCount = async (user: IAuthUser) => {
  const count = await prisma.wishlist.count({
    where: {
      userId: user.id,
    },
  });

  return { count };
};

// Get wishlist with only active products (alternative approach)
const getMyActiveWishlist = async (user: IAuthUser) => {
  // Using a more complex query to filter at database level
  const result = await prisma.wishlist.findMany({
    where: {
      userId: user.id,
      product: {
        isActive: true, // This works because it's filtering the wishlist based on product status
      },
    },
    include: {
      product: {
        include: {
          productImages: {
            where: { isPrimary: true },
            take: 1,
          },
          brand: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          productCategories: {
            include: {
              category: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
            take: 2,
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return result;
};

export const wishlistService = {
  addToWishlist,
  removeFromWishlist,
  getMyWishlist,
  getMyActiveWishlist, // Add this if you want database-level filtering
  checkInWishlist,
  clearWishlist,
  getWishlistCount,
};
