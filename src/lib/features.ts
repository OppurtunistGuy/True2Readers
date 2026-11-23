/**
 * Feature switches (build-time).
 *
 * AUTH_ENABLED: accounts (sign-in, sign-up, community feedback). OFF by default.
 * Version 1 ships without accounts or a database: when this is false the
 * account API routes answer 404 before any database access, and the Sign In
 * button and the community-feedback sections are not rendered.
 *
 * To turn accounts on later, set NEXT_PUBLIC_AUTH_ENABLED=true (it is inlined
 * at build time, so it applies to both the browser and the server) and provide
 * a database. See the parked Neon + Better Auth plan before doing that.
 */
export const AUTH_ENABLED = process.env.NEXT_PUBLIC_AUTH_ENABLED === 'true'

/** The Classic book page's generated "AI breakdown" is mock data; hidden, not deleted. */
export const SHOW_MOCK_ANALYSIS = false
