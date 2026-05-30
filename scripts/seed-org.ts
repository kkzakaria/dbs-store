// Seeds the owner account + organization by driving the running server's
// better-auth HTTP endpoints.
//
// getAuth() needs the Cloudflare Worker/D1 runtime context, so we can't build a
// standalone auth instance here — we call the real endpoints instead. This means
// the dev server (`bun run dev`) or preview (`bun run preview`) must be running.
//
// Idempotent: re-running signs in if the owner already exists and skips the org
// if its slug is taken.
//
const BASE_URL = process.env.SEED_BASE_URL ?? "http://localhost:33000";
// Origin must be a trusted origin (better-auth checks it against baseURL on
// mutating endpoints like organization/create). Defaults to BASE_URL so local
// and prod seeding both work without extra configuration.
const ORIGIN = process.env.SEED_ORIGIN ?? BASE_URL;

const OWNER_EMAIL = "admin@dbs-store.ci";
const OWNER_PASSWORD = "changeme123!";
const OWNER_NAME = "Admin DBS";
const ORG_NAME = "DBS Store";
const ORG_SLUG = "dbs-store";

const CLIENT_EMAIL = "client@dbs-store.ci";
const CLIENT_PASSWORD = "changeme123!";
const CLIENT_NAME = "Client Test";

function sessionCookie(res: Response): string {
  const list = res.headers.getSetCookie?.() ?? [];
  return list.map((c) => c.split(";")[0]).join("; ");
}

async function post(path: string, body: unknown, cookie?: string) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Origin: ORIGIN,
  };
  if (cookie) headers.cookie = cookie;
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { res, data } as { res: Response; data: Record<string, unknown> };
}

async function seed() {
  console.log(`Seeding via ${BASE_URL} ...`);

  // 1. Create the owner account (or sign in if it already exists).
  let cookie = "";
  const signUp = await post("/api/auth/sign-up/email", {
    name: OWNER_NAME,
    email: OWNER_EMAIL,
    password: OWNER_PASSWORD,
  });

  if (signUp.res.ok) {
    cookie = sessionCookie(signUp.res);
    console.log(`✓ Owner account created: ${OWNER_EMAIL}`);
  } else {
    const msg = `${signUp.data.code ?? ""} ${signUp.data.message ?? ""}`.toLowerCase();
    if (signUp.res.status === 422 || msg.includes("exist")) {
      console.log("• Owner already exists — signing in");
      const signIn = await post("/api/auth/sign-in/email", {
        email: OWNER_EMAIL,
        password: OWNER_PASSWORD,
      });
      if (!signIn.res.ok) {
        console.error(`Sign-in failed (${signIn.res.status}):`, JSON.stringify(signIn.data));
        process.exit(1);
      }
      cookie = sessionCookie(signIn.res);
    } else {
      console.error(`Sign-up failed (${signUp.res.status}):`, JSON.stringify(signUp.data));
      process.exit(1);
    }
  }

  if (!cookie) {
    console.error("No session cookie returned — cannot create organization.");
    process.exit(1);
  }

  // 2. Create the organization (owner membership is added automatically).
  const org = await post(
    "/api/auth/organization/create",
    { name: ORG_NAME, slug: ORG_SLUG },
    cookie
  );

  if (org.res.ok) {
    console.log(`✓ Organization created: ${ORG_NAME} (${ORG_SLUG})`);
  } else {
    const msg = `${org.data.code ?? ""} ${org.data.message ?? ""}`.toLowerCase();
    if (msg.includes("exist") || msg.includes("slug") || msg.includes("taken")) {
      console.log(`• Organization "${ORG_SLUG}" already exists — skipping`);
    } else {
      console.error(`Org create failed (${org.res.status}):`, JSON.stringify(org.data));
      process.exit(1);
    }
  }

  // 3. Create the test client account (no org membership needed).
  const clientSignUp = await post("/api/auth/sign-up/email", {
    name: CLIENT_NAME,
    email: CLIENT_EMAIL,
    password: CLIENT_PASSWORD,
  });

  if (clientSignUp.res.ok) {
    console.log(`✓ Client account created: ${CLIENT_EMAIL}`);
  } else {
    const msg = `${clientSignUp.data.code ?? ""} ${clientSignUp.data.message ?? ""}`.toLowerCase();
    if (clientSignUp.res.status === 422 || msg.includes("exist")) {
      console.log("• Client already exists — skipping");
    } else {
      console.error(`Client sign-up failed (${clientSignUp.res.status}):`, JSON.stringify(clientSignUp.data));
      process.exit(1);
    }
  }

  console.log(`\nSeed complete!`);
  console.log(`  Admin  — ${OWNER_EMAIL} / ${OWNER_PASSWORD}`);
  console.log(`  Client — ${CLIENT_EMAIL} / ${CLIENT_PASSWORD}`);
  console.log("\nOTP codes are logged to the dev server console ([emailOTP DEV]).");
  console.log("Change the passwords after first login!");
}

seed().catch((error) => {
  if (error instanceof TypeError && /fetch failed|ECONNREFUSED/i.test(String(error.cause ?? error))) {
    console.error(`\nCould not reach ${BASE_URL}. Is the dev server running? (bun run dev)`);
  } else {
    console.error("Seed failed:", error);
  }
  process.exit(1);
});
