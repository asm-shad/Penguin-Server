import express from "express";
import { userRoutes } from "../modules/user/user.routes";
import { AuthRoutes } from "../modules/auth/auth.routes";
import { categoryRoutes } from "../modules/category/category.routes";
import { brandRoutes } from "../modules/brand/brand.route";
import { productRoutes } from "../modules/product/product.route";
import { blogCategoryRoutes } from "../modules/blogCategory/blogCategory.routes";
import { blogPostRoutes } from "../modules/blogPost/blogPost.routes";
import { paymentRoutes } from "../modules/payment/payment.route";
import { orderRoutes } from "../modules/order/order.route";
import { couponRoutes } from "../modules/coupon/coupon.routes";

const router = express.Router();

const moduleRoutes = [
  {
    path: "/user",
    route: userRoutes,
  },
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/category",
    route: categoryRoutes,
  },
  {
    path: "/brand",
    route: brandRoutes,
  },
  {
    path: "/product",
    route: productRoutes,
  },
  {
    path: "/blog-category",
    route: blogCategoryRoutes,
  },
  {
    path: "/blog-post",
    route: blogPostRoutes,
  },
  {
    path: "/payments",
    route: paymentRoutes,
  },
  {
    path: "/orders",
    route: orderRoutes,
  },
  {
    path: "/coupon",
    route: couponRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
