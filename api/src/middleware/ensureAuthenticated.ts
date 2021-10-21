import { NextFunction, Request, Response } from "express";
import { verify } from "jsonwebtoken";

export function ensureAuthenticated(
  request: Request,
  response: Response,
  next: NextFunction
) {
  const authToken = request.headers.authorization;

  if (!authToken) {
    return response.status(401).json({ errorCode: "token.invalid" });
  }
  const [, token] = authToken.split(" ");

  try {
    const { sub } = verify(token, String(process.env.JWT_SECRET));

    request.user_id = String(sub);

    return next();
  } catch (err) {
    return response.status(401).json({ errorCode: "token.expired" });
  }
}
