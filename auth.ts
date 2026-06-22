import NextAuth from 'next-auth';
import MicrosoftEntraID from 'next-auth/providers/microsoft-entra-id';

const tenantId = process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID!;

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    MicrosoftEntraID({
      clientId:     process.env.AUTH_MICROSOFT_ENTRA_ID_ID!,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET!,
      issuer: `https://login.microsoftonline.com/${tenantId}/v2.0`,
      authorization: {
        url: `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`,
        params: { scope: 'openid profile email User.Read People.Read' },
      },
      token: `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      userinfo: 'https://graph.microsoft.com/oidc/userinfo',
      jwks_endpoint: `https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`,
    }),
  ],
  pages: { signIn: '/login' },
  callbacks: {
    async jwt({ token, account }) {
      if (account?.access_token) token.accessToken = account.access_token;
      return token;
    },
    async session({ session, token }) {
      (session as any).accessToken = (token as any).accessToken;
      return session;
    },
  },
});
