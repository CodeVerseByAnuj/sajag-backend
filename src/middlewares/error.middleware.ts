import { Request, Response, NextFunction } from "express";

export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.error("Error:", error);

  if (error.name === "ValidationError") {
    return res.status(400).json({
      error: "Validation failed",
      details: error.message,
    });
  }

  if (error.code === "P2002") {
    return res.status(400).json({
      error: "Email already exists",
    });
  }

  if (error.type === "entity.too.large") {
    return res.status(413).json({
      error: "File too large",
    });
  }

  res.status(500).json({
    error: "Internal server error",
  });
};
