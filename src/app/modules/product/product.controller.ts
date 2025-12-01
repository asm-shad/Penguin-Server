import { Request, Response } from "express";
import { productService } from "./product.service";
import httpStatus from "http-status";
import { productFilterableFields } from "./product.constant";
import { IAuthUser } from "../../interfaces/common";
import sendResponse from "../../shared/sendResponse";
import catchAsync from "../../shared/catchAsync";
import pick from "../../shared/pick";

const createProduct = catchAsync(async (req: Request, res: Response) => {
  const result = await productService.createProduct(req);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Product created successfully!",
    data: result,
  });
});

const getAllFromDB = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, productFilterableFields);
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);

  const result = await productService.getAllFromDB(filters, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Products retrieved successfully!",
    meta: result.meta,
    data: result.data,
  });
});

const getById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await productService.getById(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Product retrieved successfully!",
    data: result,
  });
});

const getBySlug = catchAsync(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const result = await productService.getBySlug(slug);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Product retrieved successfully!",
    data: result,
  });
});

const updateProduct = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await productService.updateProduct(id, req);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Product updated successfully!",
    data: result,
  });
});

const updateProductStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await productService.updateProductStatus(id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Product status updated successfully!",
    data: result,
  });
});

const updateProductFeatured = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await productService.updateProductFeatured(id, req.body);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Product featured status updated successfully!",
      data: result,
    });
  }
);

const updateProductActive = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await productService.updateProductActive(id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Product active status updated successfully!",
    data: result,
  });
});

const updateStock = catchAsync(
  async (req: Request & { user?: IAuthUser }, res: Response) => {
    const { id } = req.params;
    const user = req.user;
    const result = await productService.updateStock(
      id,
      req.body,
      user as IAuthUser
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Stock updated successfully!",
      data: result,
    });
  }
);

const deleteProduct = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await productService.deleteProduct(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Product deleted successfully!",
    data: result,
  });
});

const getFeaturedProducts = catchAsync(async (req: Request, res: Response) => {
  const result = await productService.getFeaturedProducts();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Featured products retrieved successfully!",
    data: result,
  });
});

const getNewArrivals = catchAsync(async (req: Request, res: Response) => {
  const result = await productService.getNewArrivals();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "New arrivals retrieved successfully!",
    data: result,
  });
});

const getProductsOnSale = catchAsync(async (req: Request, res: Response) => {
  const result = await productService.getProductsOnSale();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Products on sale retrieved successfully!",
    data: result,
  });
});

export const productController = {
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
  getNewArrivals,
  getProductsOnSale,
};
