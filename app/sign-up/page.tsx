import { redirect } from 'next/navigation';

import { getCurrentUser, getDefaultRouteForRole } from '@/lib/auth/dal';
import { SignUpClient } from './sign-up-client';

export default async function SignUpPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect(getDefaultRouteForRole(user));
  }

  return <SignUpClient />;
}
