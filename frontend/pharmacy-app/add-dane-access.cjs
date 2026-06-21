const admin = require("firebase-admin");

// Update this path to your service account JSON file
const serviceAccount = require("/Users/anismanjhi/Downloads/rapids-platform-firebase-adminsdk-fbsvc-22c417777c.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: "rapids-platform",
});

const db = admin.firestore();
const auth = admin.auth();

// Configuration
const EMAIL = "dane@risalabs.ai";
const FIRST_NAME = "Dane";
const LAST_NAME = "Hansen";
const FACILITY_ID = "demo_facility_001"; // Same facility as other demo users
const EXISTING_PROVIDER_ID = "qe7XpHUTT7Az8xOS4X6w"; // Provider ID you mentioned

async function addDaneAccess() {
  try {
    console.log(`\n🚀 Setting up access for ${EMAIL}...\n`);

    // Step 1: Create or get Firebase Auth user
    let userId;
    try {
      const userRecord = await auth.getUserByEmail(EMAIL);
      userId = userRecord.uid;
      console.log(`✓ Found existing Firebase Auth user: ${userId}`);
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        const newUser = await auth.createUser({
          email: EMAIL,
          displayName: `${FIRST_NAME} ${LAST_NAME}`,
        });
        userId = newUser.uid;
        console.log(`✓ Created new Firebase Auth user: ${userId}`);
        
        // Send password reset email so Dane can set up magic link
        const link = await auth.generatePasswordResetLink(EMAIL);
        console.log(`✓ Password reset link generated (for initial setup)`);
        console.log(`  Send this to Dane: ${link}`);
      } else {
        throw err;
      }
    }

    // Step 2: Create provider document for Dane
    const providerRef = db.collection("providers").doc(userId);
    await providerRef.set(
      {
        DocID: userId,
        FacilityId: FACILITY_ID,
        IsAdmin: true,
        FirstName: FIRST_NAME,
        LastName: LAST_NAME,
        EmailAddresses: [EMAIL],
        Status: "active",
      },
      { merge: true }
    );
    console.log(`✓ Created/updated provider document: /providers/${userId}`);

    // Step 3: Verify facility exists
    const facilityRef = db.collection("healthcare_facility").doc(FACILITY_ID);
    const facilitySnap = await facilityRef.get();
    if (facilitySnap.exists) {
      const facilityData = facilitySnap.data();
      console.log(`✓ Facility exists: ${facilityData.Name || FACILITY_ID}`);
    } else {
      console.log(`⚠️  Warning: Facility ${FACILITY_ID} does not exist`);
    }

    // Step 4: Check if there's an existing provider to link to
    if (EXISTING_PROVIDER_ID && EXISTING_PROVIDER_ID !== userId) {
      const existingProviderRef = db.collection("providers").doc(EXISTING_PROVIDER_ID);
      const existingProviderSnap = await existingProviderRef.get();
      
      if (existingProviderSnap.exists) {
        console.log(`\nℹ️  Note: Existing provider ${EXISTING_PROVIDER_ID} found`);
        console.log(`   Dane has been added as a separate provider with ID: ${userId}`);
      }
    }

    console.log(`\n✅ Setup complete!`);
    console.log(`\n📋 Summary:`);
    console.log(`   Email: ${EMAIL}`);
    console.log(`   Provider ID: ${userId}`);
    console.log(`   Facility: ${FACILITY_ID}`);
    console.log(`   Status: Active`);
    console.log(`   Admin: Yes`);
    console.log(`\n🔐 Access:`);
    console.log(`   Dane can now sign in at the demo site using magic link`);
    console.log(`   URL: http://localhost:3001/auth (or your production URL)`);
    console.log(`\n`);

  } catch (error) {
    console.error("❌ Setup failed:", error);
    process.exit(1);
  }
}

addDaneAccess();
