'use client';

import { Descope } from '@descope/nextjs-sdk';

export default function SignInPage() {
  return (
    <Descope
      flowId="sign-up-or-in" // configure this flow in Descope console
      onSuccess={(e) => console.log('User logged in:', e.detail.user)}
      onError={(e) => console.error('Login error:', e.detail)}
    />
  );
}