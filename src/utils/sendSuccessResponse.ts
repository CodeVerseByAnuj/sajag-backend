import { Response } from "express";

export const sendSuccessResponse = (
  res: Response,
  data: any,
  message = "Request successful",
  statusCode = 200
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};
