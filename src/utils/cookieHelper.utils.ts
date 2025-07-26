import { Response, CookieOptions } from "express";

const isProduction = process.env.NODE_ENV === "production";

const baseCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
};

export const setAuthCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string
) => {
  res.cookie("access_token", accessToken, {
    ...baseCookieOptions,
    maxAge: 60 * 60 * 1000, // 1 hour
  });

  res.cookie("refresh_token", refreshToken, {
    ...baseCookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

export const setAccessTokenCookie = (res: Response, accessToken: string) => {
  res.cookie("access_token", accessToken, {
    ...baseCookieOptions,
    maxAge: 60 * 60 * 1000, // 1 hour
  });
};

export const clearAuthCookies = (res: Response) => {
  res.clearCookie("access_token", baseCookieOptions);
  res.clearCookie("refresh_token", baseCookieOptions);
};
