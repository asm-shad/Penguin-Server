import { Request, Response } from "express";
import { categoryService } from "./category.service";
import httpStatus from "http-status";
import { categoryFilterableFields } from "./category.constant";
import sendResponse from "../../shared/sendResponse";
import catchAsync from "../../shared/catchAsync";
import pick from "../../shared/pick";

const createCategory = catchAsync(async (req: Request, res: Response) => {
  const result = await categoryService.createCategory(req);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Category created successfully!",
    data: result,
  });
});

const getAllFromDB = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, categoryFilterableFields);
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);

  const result = await categoryService.getAllFromDB(filters, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Categories retrieved successfully!",
    meta: result.meta,
    data: result.data,
  });
});

const getById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await categoryService.getById(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Category retrieved successfully!",
    data: result,
  });
});

const getBySlug = catchAsync(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const result = await categoryService.getBySlug(slug);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Category retrieved successfully!",
    data: result,
  });
});

const updateCategory = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await categoryService.updateCategory(id, req);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Category updated successfully!",
    data: result,
  });
});

const updateCategoryFeatured = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await categoryService.updateCategoryFeatured(id, req.body);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Category featured status updated successfully!",
      data: result,
    });
  }
);

const deleteCategory = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await categoryService.deleteCategory(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Category deleted successfully!",
    data: result,
  });
});

const getCategoryTree = catchAsync(async (req: Request, res: Response) => {
  const result = await categoryService.getCategoryTree();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Category tree retrieved successfully!",
    data: result,
  });
});

const getFeaturedCategories = catchAsync(
  async (req: Request, res: Response) => {
    const result = await categoryService.getFeaturedCategories();

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Featured categories retrieved successfully!",
      data: result,
    });
  }
);

const getNavigationCategories = catchAsync(
  async (req: Request, res: Response) => {
    const result = await categoryService.getNavigationCategories();

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Navigation categories retrieved successfully!",
      data: result,
    });
  }
);

export const categoryController = {
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
