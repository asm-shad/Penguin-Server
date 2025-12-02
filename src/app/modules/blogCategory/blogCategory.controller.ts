import { Request, Response } from "express";
import httpStatus from "http-status";
import { blogCategoryFilterableFields } from "./blogCategory.constant";
import sendResponse from "../../shared/sendResponse";
import catchAsync from "../../shared/catchAsync";
import pick from "../../shared/pick";
import { blogCategoryService } from "./blogCategory.service";

const createBlogCategory = catchAsync(async (req: Request, res: Response) => {
  const result = await blogCategoryService.createBlogCategory(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Blog category created successfully!",
    data: result,
  });
});

const getAllBlogCategories = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, blogCategoryFilterableFields);
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);

  const result = await blogCategoryService.getAllBlogCategories(
    filters,
    options
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blog categories retrieved successfully!",
    meta: result.meta,
    data: result.data,
  });
});

const getBlogCategoryById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await blogCategoryService.getBlogCategoryById(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blog category retrieved successfully!",
    data: result,
  });
});

const getBlogCategoryBySlug = catchAsync(
  async (req: Request, res: Response) => {
    const { slug } = req.params;
    const result = await blogCategoryService.getBlogCategoryBySlug(slug);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Blog category retrieved successfully!",
      data: result,
    });
  }
);

const updateBlogCategory = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await blogCategoryService.updateBlogCategory(id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blog category updated successfully!",
    data: result,
  });
});

const deleteBlogCategory = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await blogCategoryService.deleteBlogCategory(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blog category deleted successfully!",
    data: result,
  });
});

export const blogCategoryController = {
  createBlogCategory,
  getAllBlogCategories,
  getBlogCategoryById,
  getBlogCategoryBySlug,
  updateBlogCategory,
  deleteBlogCategory,
};
