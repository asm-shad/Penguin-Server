import {
  UserRole,
  OrderStatus,
  PaymentStatus,
  ReturnStatus,
  ProductStatus,
  UserStatus,
} from "@prisma/client";
import { IAuthUser } from "../../interfaces/common";
import prisma from "../../shared/prisma";
import httpStatus from "http-status";
import ApiError from "../../errors/ApiErrors";

const fetchDashboardMetaData = async (user: IAuthUser) => {
  let metaData;
  switch (user?.role) {
    case UserRole.SUPER_ADMIN:
      metaData = await getSuperAdminMetaData();
      break;
    case UserRole.ADMIN:
      metaData = await getAdminMetaData();
      break;
    case UserRole.PRODUCT_MANAGER:
      metaData = await getProductManagerMetaData(user);
      break;
    case UserRole.CUSTOMER_SUPPORT:
      metaData = await getCustomerSupportMetaData(user);
      break;
    case UserRole.USER:
      metaData = await getUserMetaData(user);
      break;
    default:
      throw new ApiError(httpStatus.BAD_REQUEST, "Invalid user role!");
  }

  return metaData;
};

// SUPER_ADMIN Dashboard
const getSuperAdminMetaData = async () => {
  // Counts
  const [
    totalUsers,
    totalOrders,
    totalProducts,
    totalRevenue,
    recentOrders,
    userGrowth,
    revenueByMonth,
    topProducts,
    orderStatusDistribution,
    productStatusDistribution,
    recentPayments,
    returnRequests,
  ] = await Promise.all([
    // Total Users Count
    prisma.user.count({
      where: { isDeleted: false },
    }),

    // Total Orders Count
    prisma.order.count(),

    // Total Products Count
    prisma.product.count({
      where: { isActive: true },
    }),

    // Total Revenue (sum of completed payments)
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { paymentStatus: PaymentStatus.COMPLETED },
    }),

    // Recent Orders (last 10)
    prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { name: true, email: true },
        },
        orderItems: {
          take: 1,
        },
      },
    }),

    // User Growth (last 6 months)
    getUserGrowthData(),

    // Revenue by Month (last 6 months)
    getRevenueByMonth(),

    // Top Selling Products
    getTopSellingProducts(),

    // Order Status Distribution
    getOrderStatusDistribution(),

    // Product Status Distribution
    getProductStatusDistribution(),

    // Recent Payments
    prisma.payment.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        order: {
          select: { orderNumber: true },
        },
        user: {
          select: { name: true },
        },
      },
    }),

    // Recent Return Requests
    prisma.returnRequest.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        order: {
          select: { orderNumber: true },
        },
        user: {
          select: { name: true },
        },
      },
    }),
  ]);

  // Role-wise user distribution
  const userDistribution = await prisma.user.groupBy({
    by: ["role"],
    where: { isDeleted: false },
    _count: { id: true },
  });

  const formattedUserDistribution = userDistribution.map(
    ({ role, _count }) => ({
      role,
      count: _count.id,
    })
  );

  return {
    counts: {
      totalUsers,
      totalOrders,
      totalProducts,
      totalRevenue: totalRevenue._sum.amount || 0,
      activeUsers: await prisma.user.count({
        where: { userStatus: UserStatus.ACTIVE, isDeleted: false },
      }),
      pendingOrders: await prisma.order.count({
        where: { status: OrderStatus.PENDING },
      }),
      totalReturnRequests: await prisma.returnRequest.count(),
    },
    charts: {
      userGrowth,
      revenueByMonth,
      orderStatusDistribution,
      productStatusDistribution,
      userDistribution: formattedUserDistribution,
    },
    lists: {
      recentOrders,
      topProducts,
      recentPayments,
      returnRequests,
    },
  };
};

// ADMIN Dashboard
const getAdminMetaData = async () => {
  const [
    totalOrders,
    totalRevenue,
    totalProducts,
    recentOrders,
    orderStatusDistribution,
    revenueByMonth,
    topProducts,
    returnRequests,
  ] = await Promise.all([
    prisma.order.count(),

    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { paymentStatus: PaymentStatus.COMPLETED },
    }),

    prisma.product.count({
      where: { isActive: true },
    }),

    prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    }),

    getOrderStatusDistribution(),

    getRevenueByMonth(),

    getTopSellingProducts(),

    prisma.returnRequest.findMany({
      take: 5,
      where: { status: ReturnStatus.REQUESTED },
      orderBy: { createdAt: "desc" },
      include: {
        order: {
          select: { orderNumber: true },
        },
      },
    }),
  ]);

  return {
    counts: {
      totalOrders,
      totalRevenue: totalRevenue._sum.amount || 0,
      totalProducts,
      todayOrders: await getTodayOrdersCount(),
      pendingReturns: await prisma.returnRequest.count({
        where: { status: ReturnStatus.REQUESTED },
      }),
    },
    charts: {
      orderStatusDistribution,
      revenueByMonth,
    },
    lists: {
      recentOrders,
      topProducts,
      returnRequests,
    },
  };
};

// PRODUCT_MANAGER Dashboard
const getProductManagerMetaData = async (user: IAuthUser) => {
  const [
    totalProducts,
    lowStockProducts,
    newProducts,
    productStatusDistribution,
    topSellingCategories,
    recentInventories,
  ] = await Promise.all([
    prisma.product.count({
      where: { isActive: true },
    }),

    prisma.product.count({
      where: {
        isActive: true,
        stock: { lt: 10 }, // Less than 10 units
      },
    }),

    prisma.product.count({
      where: {
        isActive: true,
        status: ProductStatus.NEW,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
    }),

    getProductStatusDistribution(),

    getTopSellingCategories(),

    prisma.productInventory.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        product: {
          select: { name: true },
        },
        variant: {
          select: { name: true, value: true },
        },
        user: {
          select: { name: true },
        },
      },
    }),
  ]);

  // Get products created by this manager (if tracking creator is implemented)
  const productsByStatus = await prisma.product.groupBy({
    by: ["status"],
    where: { isActive: true },
    _count: { id: true },
  });

  const formattedProductsByStatus = productsByStatus.map(
    ({ status, _count }) => ({
      status,
      count: _count.id,
    })
  );

  return {
    counts: {
      totalProducts,
      lowStockProducts,
      newProducts,
      outOfStockProducts: await prisma.product.count({
        where: {
          isActive: true,
          OR: [{ stock: 0 }, { status: ProductStatus.OUT_OF_STOCK }],
        },
      }),
      featuredProducts: await prisma.product.count({
        where: { isFeatured: true, isActive: true },
      }),
    },
    charts: {
      productStatusDistribution: formattedProductsByStatus,
      topSellingCategories,
    },
    lists: {
      lowStockProductsList: await prisma.product.findMany({
        take: 5,
        where: {
          isActive: true,
          stock: { lt: 10 },
        },
        orderBy: { stock: "asc" },
        select: {
          id: true,
          name: true,
          stock: true,
          sku: true,
        },
      }),
      recentInventories,
    },
  };
};

// CUSTOMER_SUPPORT Dashboard
const getCustomerSupportMetaData = async (user: IAuthUser) => {
  const [
    pendingTickets,
    todayOrders,
    recentOrders,
    recentReturnRequests,
    recentPayments,
  ] = await Promise.all([
    // Count of return requests needing attention
    prisma.returnRequest.count({
      where: {
        status: {
          in: [ReturnStatus.REQUESTED, ReturnStatus.APPROVED],
        },
      },
    }),

    getTodayOrdersCount(),

    prisma.order.findMany({
      take: 10,
      where: {
        status: {
          in: [OrderStatus.PENDING, OrderStatus.PROCESSING],
        },
      },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    }),

    prisma.returnRequest.findMany({
      take: 10,
      where: {
        status: ReturnStatus.REQUESTED,
      },
      orderBy: { createdAt: "desc" },
      include: {
        order: {
          select: { orderNumber: true },
        },
        user: {
          select: { name: true, email: true },
        },
      },
    }),

    prisma.payment.findMany({
      take: 10,
      where: {
        paymentStatus: PaymentStatus.FAILED,
      },
      orderBy: { createdAt: "desc" },
      include: {
        order: {
          select: { orderNumber: true },
        },
        user: {
          select: { name: true },
        },
      },
    }),
  ]);

  // Orders requiring shipping updates
  const ordersNeedingShipping = await prisma.order.count({
    where: {
      status: OrderStatus.PAID,
      shipping: null, // Orders paid but not shipped
    },
  });

  return {
    counts: {
      pendingTickets,
      todayOrders,
      ordersNeedingShipping,
      failedPayments: await prisma.payment.count({
        where: { paymentStatus: PaymentStatus.FAILED },
      }),
      totalOpenReturns: await prisma.returnRequest.count({
        where: {
          status: {
            not: ReturnStatus.COMPLETED,
          },
        },
      }),
    },
    lists: {
      recentOrders,
      recentReturnRequests,
      recentPayments,
      // Recent customer inquiries (if you have a contact/support ticket system)
      recentReviews: await prisma.productReview.findMany({
        take: 5,
        where: { isApproved: false },
        orderBy: { createdAt: "desc" },
        include: {
          product: {
            select: { name: true },
          },
          user: {
            select: { name: true },
          },
        },
      }),
    },
  };
};

// USER Dashboard
const getUserMetaData = async (user: IAuthUser) => {
  const userData = await prisma.user.findUniqueOrThrow({
    where: {
      email: user?.email,
      userStatus: UserStatus.ACTIVE,
    },
  });

  const [
    totalOrders,
    recentOrders,
    wishlistCount,
    totalReviews,
    orderStatusDistribution,
  ] = await Promise.all([
    prisma.order.count({
      where: { userId: userData.id },
    }),

    prisma.order.findMany({
      take: 5,
      where: { userId: userData.id },
      orderBy: { createdAt: "desc" },
      include: {
        orderItems: {
          take: 2,
          include: {
            product: {
              select: { name: true, productImages: true },
            },
          },
        },
      },
    }),

    prisma.wishlist.count({
      where: { userId: userData.id },
    }),

    prisma.productReview.count({
      where: { userId: userData.id },
    }),

    prisma.order.groupBy({
      by: ["status"],
      where: { userId: userData.id },
      _count: { id: true },
    }),
  ]);

  const formattedOrderStatusDistribution = orderStatusDistribution.map(
    ({ status, _count }) => ({
      status,
      count: Number(_count.id),
    })
  );

  // Pending return requests
  const pendingReturns = await prisma.returnRequest.count({
    where: {
      userId: userData.id,
      status: {
        not: ReturnStatus.COMPLETED,
      },
    },
  });

  // Recent reviews
  const recentReviews = await prisma.productReview.findMany({
    take: 3,
    where: { userId: userData.id },
    orderBy: { createdAt: "desc" },
    include: {
      product: {
        select: { name: true, slug: true },
      },
    },
  });

  return {
    counts: {
      totalOrders,
      wishlistCount,
      totalReviews,
      pendingReturns,
      totalSpent: await getUserTotalSpent(userData.id),
    },
    lists: {
      recentOrders,
      recentReviews,
      wishlistItems: await prisma.wishlist.findMany({
        take: 3,
        where: { userId: userData.id },
        orderBy: { createdAt: "desc" },
        include: {
          product: {
            select: {
              name: true,
              price: true,
              salePrice: true,
              productImages: {
                take: 1,
                where: { isPrimary: true },
              },
            },
          },
        },
      }),
    },
    charts: {
      orderStatusDistribution: formattedOrderStatusDistribution,
    },
  };
};

// HELPER FUNCTIONS

const getUserGrowthData = async () => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const userGrowth = await prisma.$queryRaw`
    SELECT 
      DATE_TRUNC('month', "createdAt") AS month,
      COUNT(*) AS count
    FROM "users"
    WHERE "createdAt" >= ${sixMonthsAgo}
      AND "isDeleted" = false
    GROUP BY DATE_TRUNC('month', "createdAt")
    ORDER BY month ASC
  `;

  return userGrowth;
};

const getRevenueByMonth = async () => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const revenueByMonth = await prisma.$queryRaw`
    SELECT 
      DATE_TRUNC('month', p."createdAt") AS month,
      SUM(p.amount) AS revenue
    FROM "payments" p
    WHERE p."createdAt" >= ${sixMonthsAgo}
      AND p."paymentStatus" = 'COMPLETED'
    GROUP BY DATE_TRUNC('month', p."createdAt")
    ORDER BY month ASC
  `;

  return revenueByMonth;
};

const getTopSellingProducts = async (limit: number = 10) => {
  const topProducts = await prisma.$queryRaw`
    SELECT 
      p.id,
      p.name,
      p.slug,
      SUM(oi.quantity) as total_sold,
      SUM(oi.quantity * oi.unitPrice) as total_revenue
    FROM "products" p
    JOIN "order_items" oi ON p.id = oi."productId"
    JOIN "orders" o ON oi."orderId" = o.id
    WHERE o.status NOT IN ('CANCELLED', 'REFUNDED')
    GROUP BY p.id, p.name, p.slug
    ORDER BY total_sold DESC
    LIMIT ${limit}
  `;

  return topProducts;
};

const getTopSellingCategories = async (limit: number = 5) => {
  const topCategories = await prisma.$queryRaw`
    SELECT 
      c.id,
      c.name,
      c.slug,
      COUNT(DISTINCT oi."productId") as unique_products,
      SUM(oi.quantity) as total_sold
    FROM "categories" c
    JOIN "product_categories" pc ON c.id = pc."categoryId"
    JOIN "products" p ON pc."productId" = p.id
    JOIN "order_items" oi ON p.id = oi."productId"
    JOIN "orders" o ON oi."orderId" = o.id
    WHERE o.status NOT IN ('CANCELLED', 'REFUNDED')
      AND p."isActive" = true
    GROUP BY c.id, c.name, c.slug
    ORDER BY total_sold DESC
    LIMIT ${limit}
  `;

  return topCategories;
};

const getOrderStatusDistribution = async () => {
  const distribution = await prisma.order.groupBy({
    by: ["status"],
    _count: { id: true },
  });

  return distribution.map(({ status, _count }) => ({
    status,
    count: Number(_count.id),
  }));
};

const getProductStatusDistribution = async () => {
  const distribution = await prisma.product.groupBy({
    by: ["status"],
    where: { isActive: true },
    _count: { id: true },
  });

  return distribution.map(({ status, _count }) => ({
    status,
    count: Number(_count.id),
  }));
};

const getTodayOrdersCount = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return await prisma.order.count({
    where: {
      createdAt: {
        gte: today,
        lt: tomorrow,
      },
    },
  });
};

const getUserTotalSpent = async (userId: string) => {
  const result = await prisma.payment.aggregate({
    _sum: { amount: true },
    where: {
      userId,
      paymentStatus: PaymentStatus.COMPLETED,
    },
  });

  return result._sum.amount || 0;
};

// Additional analytics function for date range
const getAnalyticsData = async (startDate: Date, endDate: Date) => {
  const [revenueData, orderData, userData] = await Promise.all([
    // Revenue data
    prisma.payment.aggregate({
      _sum: { amount: true },
      _count: { id: true },
      where: {
        paymentStatus: PaymentStatus.COMPLETED,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    }),

    // Order data
    prisma.order.groupBy({
      by: ["status"],
      _count: { id: true },
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    }),

    // New users
    prisma.user.count({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        isDeleted: false,
      },
    }),
  ]);

  return {
    revenue: revenueData._sum.amount || 0,
    completedPayments: revenueData._count.id,
    orderDistribution: orderData.map((item) => ({
      status: item.status,
      count: item._count.id,
    })),
    newUsers: userData,
  };
};

export const MetaService = {
  fetchDashboardMetaData,
  getAnalyticsData,
};
