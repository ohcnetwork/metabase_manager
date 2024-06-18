import { serialize, parse } from 'cookie';
import { NextApiResponse } from 'next';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from './prisma';

const TOKEN_NAME = 'token';

export async function setLoginSession(res: NextApiResponse, user: any) {
  const token = uuidv4();

  await prisma.session.create({
    data: {
      token,
      userId: user.id,
      expiresAt: new Date(Date.now() + 60 * 60 * 24 * 7 * 1000), // 1 week
    },
  });

  const cookie = serialize(TOKEN_NAME, token, {
    maxAge: 60 * 60 * 24 * 7, // 1 week
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'lax',
  });

  res.setHeader('Set-Cookie', cookie);
}

export async function getLoginSession(req: any) {
  const cookies = parse(req.headers.cookie || '');
  const token = cookies[TOKEN_NAME];

  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  return session.user;
}
