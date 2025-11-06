import { Response, CookieOptions } from "express";
import { object } from "zod";

const isProduction = process.env.NODE_ENV === "production";

const baseCookieOptions: CookieOptions = {
  httpOnly: true,                  // ✅ prevent access from JS (for security)
  secure: true,                    // ✅ cookie only sent over HTTPS
  sameSite: "none",                // ✅ allow cross-subdomain cookie sharing
  domain: ".sajagjewellers.in",    // ✅ make it valid for both frontend + backend
};


console.log(isProduction ? "Running in production mode" : "Running in development mode");

export const setAuthCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string
) => {
  const accessMaxAge = 60 * 60 * 1000; // 1 hour
  const refreshMaxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
  console.log("Setting access_token cookie with maxAge:", accessMaxAge);
  console.log("Setting refresh_token cookie with maxAge:", refreshMaxAge);
  res.cookie("access_token", accessToken, {
    ...baseCookieOptions,
    maxAge: accessMaxAge,
  });

  res.cookie("refresh_token", refreshToken, {
    ...baseCookieOptions,
    maxAge: refreshMaxAge,
  });
};

export const setAccessTokenCookie = (res: Response, accessToken: string) => {
  const accessMaxAge = 60 * 60 * 1000; // 1 hour
  console.log("Setting access_token cookie with maxAge:", accessMaxAge);
  res.cookie("access_token", accessToken, {
    ...baseCookieOptions,
    maxAge: accessMaxAge,
  });
};

export const clearAuthCookies = (res: Response) => {
  res.clearCookie("access_token", baseCookieOptions);
  res.clearCookie("refresh_token", baseCookieOptions);
};
