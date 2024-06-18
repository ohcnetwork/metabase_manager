import { NextApiRequest, NextApiResponse, NextPageContext } from 'next';
import { getLoginSession } from './auth';

export async function requireAuthentication(
  req: NextApiRequest | NextPageContext['req'],
  res: NextApiResponse | NextPageContext['res'],
  next: () => void
) {
  const user = await getLoginSession(req);

  if (!user) {
    if (res) {
      res.statusCode = 302;
      res.setHeader('Location', '/login');
      res.end();
    }
    return;
  }

  req.user = user;
  next();
}
