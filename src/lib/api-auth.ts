import { cookies } from 'next/headers';
import { verifyJWT } from './auth';
import prisma from './prisma';

export async function getUserFromRequest() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return null;

    const payload = await verifyJWT(token);
    if (!payload || !payload.id) return null;

    const user = await prisma.user.findUnique({
      where: { id: payload.id as string },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return user;
  } catch (error) {
    console.error('Error in getUserFromRequest:', error);
    return null;
  }
}
