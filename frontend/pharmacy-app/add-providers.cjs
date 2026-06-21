const admin = require("firebase-admin");

const serviceAccount = require("/Users/kulraj/Downloads/rapids-platform-firebase-adminsdk-fbsvc-7e5446e184.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: "rapids-platform",
});

const db = admin.firestore();
const auth = admin.auth();

const FACILITY_ID = "demo_facility_001";

const NEW_PROVIDERS = [
  { email: "kulraj@risalabs.ai", firstName: "Kulraj", lastName: "Singh" },
  { email: "akshith@risalabs.ai", firstName: "Akshith", lastName: "Reddy" },
  { email: "dane@risalabs.ai", firstName: "Dane", lastName: "Hansen" },
  { email: "gaurav@risalabs.ai", firstName: "Gaurav", lastName: "Sharma" },
  { email: "aditi.anand@risalabs.ai", firstName: "Aditi", lastName: "Anand" },
];

async function addProvider({ email, firstName, lastName }) {
  // Step 1: Look up or create Firebase Auth user
  let userId;
  try {
    const userRecord = await auth.getUserByEmail(email);
    userId = userRecord.uid;
    console.log(`Found existing user for ${email}: ${userId}`);
  } catch (err) {
    if (err.code === "auth/user-not-found") {
      const newUser = await auth.createUser({
        email,
        displayName: `${firstName} ${lastName}`,
      });
      userId = newUser.uid;
      console.log(`Created new user for ${email}: ${userId}`);
    } else {
      throw err;
    }
  }

  // Step 2: Create provider document
  const providerRef = db.collection("providers").doc(userId);
  await providerRef.set(
    {
      DocID: userId,
      FacilityId: FACILITY_ID,
      IsAdmin: true,
      FirstName: firstName,
      LastName: lastName,
      EmailAddresses: [email],
      Status: "active",
    },
    { merge: true }
  );
  console.log(`Created/updated provider for ${email}: ${userId}`);
}

async function main() {
  try {
    for (const provider of NEW_PROVIDERS) {
      await addProvider(provider);
    }
    console.log("\n--- Done! All providers added. ---");
    console.log("They can now sign in via magic link at the demo site.");
    console.log("\nAdded users:");
    NEW_PROVIDERS.forEach(p => console.log(`  - ${p.email}`));
  } catch (error) {
    console.error("Failed:", error);
    process.exit(1);
  }
}

main();
