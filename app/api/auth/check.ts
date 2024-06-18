import { NextApiRequest, NextApiResponse } from 'next';
import { getLoginSession } from '../../auth';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  const user = await getLoginSession(req);
  if (!user) {
    return res.status(401).json({ loggedIn: false });
  }
  return res.status(200).json({ loggedIn: true });
}
