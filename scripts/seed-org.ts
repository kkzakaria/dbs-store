import { auth } from "../lib/auth";

const OWNER_EMAIL = "admin@dbs-store.ci";
const OWNER_PASSWORD = "changeme123!";
const OWNER_NAME = "Admin DBS";
const ORG_NAME = "DBS Store";
const ORG_SLUG = "dbs-store";

async function seed() {
  console.log("Creating owner account...");

  const signUpResponse = await auth.api.signUpEmail({
    body: {
      name: OWNER_NAME,
      email: OWNER_EMAIL,
      password: OWNER_PASSWORD,
    },
    asResponse: true,
  });

  if (!signUpResponse.ok) {
    console.error("Failed to create owner account:", signUpResponse.status);
    process.exit(1);
  }

  const signUpData = await signUpResponse.json();
  console.log(`Owner created: ${signUpData.user.email}`);

  // Extract session cookies from the signup response
  const setCookieHeader = signUpResponse.headers.get("set-cookie") ?? "";
  // Parse cookie values to forward them
  const cookies = setCookieHeader
    .split(",")
    .map((c: string) => c.trim().split(";")[0])
    .filter(Boolean)
    .join("; ");

  console.log("Creating organization...");
  await auth.api.createOrganization({
    body: {
      name: ORG_NAME,
      slug: ORG_SLUG,
    },
    headers: new Headers({
      cookie: cookies,
    }),
  });

  console.log(`Organization created: ${ORG_NAME} (${ORG_SLUG})`);
  console.log("\nSeed complete!");
  console.log(
    `\nLogin with:\n  Email: ${OWNER_EMAIL}\n  Password: ${OWNER_PASSWORD}`
  );
  console.log("\nChange the password after first login!");
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
