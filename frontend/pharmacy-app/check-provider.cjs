const admin = require("firebase-admin");

// Update this path to your service account JSON file
const serviceAccount = require("/Users/anismanjhi/Downloads/rapids-platform-firebase-adminsdk-fbsvc-22c417777c.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: "rapids-platform",
});

const db = admin.firestore();

const PROVIDER_ID = "qe7XpHUTT7Az8xOS4X6w";

async function checkProvider() {
  try {
    console.log(`\n🔍 Checking provider: ${PROVIDER_ID}\n`);

    // Get the provider document
    const providerRef = db.collection("providers").doc(PROVIDER_ID);
    const providerSnap = await providerRef.get();

    if (!providerSnap.exists) {
      console.log("❌ Provider document does not exist");
      return;
    }

    const providerData = providerSnap.data();
    
    console.log("✅ Provider document found:\n");
    console.log("📄 Document ID:", PROVIDER_ID);
    console.log("📋 Provider Data:");
    console.log(JSON.stringify(providerData, null, 2));

    console.log("\n📊 Summary:");
    console.log(`   Email(s): ${providerData.EmailAddresses?.join(", ") || "N/A"}`);
    console.log(`   Name: ${providerData.FirstName || ""} ${providerData.LastName || ""}`);
    console.log(`   Facility ID: ${providerData.FacilityId || "N/A"}`);
    console.log(`   Is Admin: ${providerData.IsAdmin || false}`);
    console.log(`   Status: ${providerData.Status || "N/A"}`);
    console.log(`   Doc ID: ${providerData.DocID || "N/A"}`);

    // Check if this provider has access to any facilities
    if (providerData.FacilityId) {
      console.log("\n🏥 Checking associated facility...");
      const facilityRef = db.collection("healthcare_facility").doc(providerData.FacilityId);
      const facilitySnap = await facilityRef.get();
      
      if (facilitySnap.exists) {
        const facilityData = facilitySnap.data();
        console.log(`   ✓ Facility: ${facilityData.Name || providerData.FacilityId}`);
        console.log(`   ✓ NPI: ${facilityData.NPI || "N/A"}`);
      } else {
        console.log(`   ⚠️  Facility ${providerData.FacilityId} does not exist`);
      }
    }

    console.log("\n");

  } catch (error) {
    console.error("❌ Error checking provider:", error);
    process.exit(1);
  }
}

checkProvider();
