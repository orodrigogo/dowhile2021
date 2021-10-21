import axios from "axios";
import { sign } from "jsonwebtoken";
import { prismaClient } from "../prisma";

/**
 * X Receber access_token
 *  Verificar se access token valido no github
 * X Retornar as infos do user logado
 *
 * X  Verificar se usuario existe no DB
 * X  - SIM => Retorna as infos
 * X  - NAO => Salva as infos
 *
 */

interface IUserResponse {
  id: number;
  login: string;
  avatar_url: string;
  name: string;
}

interface IAccessTokenResponse {
  access_token: string;
}

class AuthenticateUserService {
  async execute(code: string) {
    const url = `https://github.com/login/oauth/access_token`;

    const { data: accessTokenResponse } =
      await axios.post<IAccessTokenResponse>(url, null, {
        params: {
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
        },
        headers: {
          Accept: "application/json",
        },
      });

    const response = await axios.get<IUserResponse>(
      "https://api.github.com/user",
      {
        headers: {
          authorization: `Bearer ${accessTokenResponse.access_token}`,
        },
      }
    );

    const { login, id, avatar_url, name } = response.data;
    let user = await prismaClient.user.findFirst({
      where: {
        github_id: id,
      },
    });

    if (!user) {
      user = await prismaClient.user.create({
        data: {
          github_id: id,
          avatar_url,
          name,
          login,
        },
      });
    }

    const token = sign(
      {
        user: {
          name: user.name,
          avatar_url: user.avatar_url,
          id: user.id,
        },
      },
      process.env.JWT_SECRET,
      {
        subject: user.id,
        expiresIn: "1d",
      }
    );

    return { token, user };
  }
}

export { AuthenticateUserService };
