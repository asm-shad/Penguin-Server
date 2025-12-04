import { NextFunction, Request, Response } from "express";
import { ZodTypeAny } from "zod";

const validateRequest =
  (schema: ZodTypeAny) => (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req.body); // IMPORTANT FIX

      req.body = parsed;
      next();
    } catch (error) {
      next(error);
    }
  };

export default validateRequest;
