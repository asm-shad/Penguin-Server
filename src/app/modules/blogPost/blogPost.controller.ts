import { Request, Response } from "express";
import httpStatus from "http-status";
import { blogPostFilterableFields } from "./blogPost.constant";
import { IAuthUser } from "../../interfaces/common";
import sendResponse from "../../shared/sendResponse";
import catchAsync from "../../shared/catchAsync";
import pick from "../../shared/pick";
import { blogPostService } from "./blogPost.service";

const createBlogPost = catchAsync(
  async (req: Request & { user?: IAuthUser }, res: Response) => {
    const user = req.user;
    const result = await blogPostService.createBlogPost(req, user);

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Blog post created successfully!",
      data: result,
    });
  }
);

const getAllBlogPosts = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, blogPostFilterableFields);
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);

  // Check if this is public access (no auth)
  const isPublic = !req.headers.authorization;
  const result = await blogPostService.getAllBlogPosts(
    filters,
    options,
    isPublic
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blog posts retrieved successfully!",
    meta: result.meta,
    data: result.data,
  });
});

const getBlogPostById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Check if this is public access (no auth)
  const isPublic = !req.headers.authorization;
  const result = await blogPostService.getBlogPostById(id, isPublic);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blog post retrieved successfully!",
    data: result,
  });
});

const getBlogPostBySlug = catchAsync(async (req: Request, res: Response) => {
  const { slug } = req.params;

  // Check if this is public access (no auth)
  const isPublic = !req.headers.authorization;
  const result = await blogPostService.getBlogPostBySlug(slug, isPublic);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blog post retrieved successfully!",
    data: result,
  });
});

const updateBlogPost = catchAsync(
  async (req: Request & { user?: IAuthUser }, res: Response) => {
    const { id } = req.params;
    const user = req.user;
    const result = await blogPostService.updateBlogPost(id, req, user);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Blog post updated successfully!",
      data: result,
    });
  }
);

const deleteBlogPost = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await blogPostService.deleteBlogPost(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blog post deleted successfully!",
    data: result,
  });
});

const getLatestBlogPosts = catchAsync(async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 5;
  const result = await blogPostService.getLatestBlogPosts(limit);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Latest blog posts retrieved successfully!",
    data: result,
  });
});

const getMyBlogPosts = catchAsync(
  async (req: Request & { user?: IAuthUser }, res: Response) => {
    const user = req.user;
    const filters = pick(req.query, blogPostFilterableFields);
    const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);

    const result = await blogPostService.getMyBlogPosts(
      user as IAuthUser,
      filters,
      options
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "My blog posts retrieved successfully!",
      meta: result.meta,
      data: result.data,
    });
  }
);

export const blogPostController = {
  createBlogPost,
  getAllBlogPosts,
  getBlogPostById,
  getBlogPostBySlug,
  updateBlogPost,
  deleteBlogPost,
  getLatestBlogPosts,
  getMyBlogPosts,
};
