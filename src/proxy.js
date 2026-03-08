import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
  '/app(.*)',
  '/dashboard(.*)',
  '/settings(.*)',
  '/api/separate(.*)',
  '/api/jobs(.*)',
  '/api/settings(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  // Allow /api/v1 through — it uses its own API key auth
  if (req.nextUrl.pathname.startsWith('/api/v1')) return;
  // Allow LemonSqueezy + Clerk webhooks through
  if (req.nextUrl.pathname.startsWith('/api/webhooks')) return;
  if (req.nextUrl.pathname.startsWith('/api/lemonsqueezy/webhook')) return;

  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
