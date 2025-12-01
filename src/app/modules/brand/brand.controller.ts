import { Request, Response } from "express";
import { brandService } from "./brand.service";
import httpStatus from "http-status";
import { brandFilterableFields } from "./brand.constant";
import sendResponse from "../../shared/sendResponse";
import catchAsync from "../../shared/catchAsync";
import pick from "../../shared/pick";

const createBrand = catchAsync(async (req: Request, res: Response) => {
  const result = await brandService.createBrand(req);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Brand created successfully!",
    data: result,
  });
});

const getAllFromDB = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, brandFilterableFields);
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);

  const result = await brandService.getAllFromDB(filters, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Brands retrieved successfully!",
    meta: result.meta,
    data: result.data,
  });
});

const getById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await brandService.getById(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Brand retrieved successfully!",
    data: result,
  });
});

const getBySlug = catchAsync(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const result = await brandService.getBySlug(slug);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Brand retrieved successfully!",
    data: result,
  });
});

const updateBrand = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await brandService.updateBrand(id, req);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Brand updated successfully!",
    data: result,
  });
});

const deleteBrand = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await brandService.deleteBrand(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Brand deleted successfully!",
    data: result,
  });
});

const getPopularBrands = catchAsync(async (req: Request, res: Response) => {
  const result = await brandService.getPopularBrands();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Popular brands retrieved successfully!",
    data: result,
  });
});

const getAllBrandsForDropdown = catchAsync(
  async (req: Request, res: Response) => {
    const result = await brandService.getAllBrandsForDropdown();

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Brands for dropdown retrieved successfully!",
      data: result,
    });
  }
);

export const brandController = {
  createBrand,
  getAllFromDB,
  getById,
  getBySlug,
  updateBrand,
  deleteBrand,
  getPopularBrands,
  getAllBrandsForDropdown,
};
