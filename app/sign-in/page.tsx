import { redirect } from 'next/navigation';

import { getCurrentUser, getDefaultRouteForRole } from '@/lib/auth/dal';
import { SignInClient } from './sign-in-client';

export default async function SignInPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect(getDefaultRouteForRole(user));
  }

  return <SignInClient />;
}
