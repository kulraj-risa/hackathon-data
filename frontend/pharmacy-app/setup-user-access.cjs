const admin = require("firebase-admin");

const serviceAccount = require("/Users/anismanjhi/Downloads/rapids-platform-firebase-adminsdk-fbsvc-22c417777c.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: "rapids-platform",
});

const db = admin.firestore();
const auth = admin.auth();

const EMAIL = "anis@risalabs.ai";
const FIRST_NAME = "Anis";
const LAST_NAME = "Manjhi";
const FACILITY_ID = "demo_facility_001";
const PLAN_ID = "demo_plan_001";

async function main() {
  try {
    // Step 1: Look up or create Firebase Auth user
    let userId;
    try {
      const userRecord = await auth.getUserByEmail(EMAIL);
      userId = userRecord.uid;
      console.log(`Found existing user: ${userId}`);
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        const newUser = await auth.createUser({
          email: EMAIL,
          displayName: `${FIRST_NAME} ${LAST_NAME}`,
        });
        userId = newUser.uid;
        console.log(`Created new user: ${userId}`);
      } else {
        throw err;
      }
    }

    // Step 2: Create healthcare facility
    const facilityRef = db.collection("healthcare_facility").doc(FACILITY_ID);
    const facilitySnap = await facilityRef.get();
    if (!facilitySnap.exists) {
      await facilityRef.set({
        DocId: FACILITY_ID,
        Name: "Demo Facility",
        NPI: "0000000000",
        PhoneNumber: "",
        Address: {
          Street: "123 Demo St",
          City: "New York",
          State: "NY",
          Zip: "10001",
        },
        ImageURL: "",
        organization_id: FACILITY_ID,
        is_external_organization: false,
      });
      console.log(`Created healthcare facility: ${FACILITY_ID}`);
    } else {
      console.log(`Healthcare facility already exists: ${FACILITY_ID}`);
    }

    // Step 3: Create provider document with userId as doc ID
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
    console.log(`Created/updated provider: ${userId}`);

    // Step 4: Create facility plan with features
    const planRef = facilityRef.collection("plan").doc(PLAN_ID);
    await planRef.set(
      {
        feature: [
          "orders",
          "authReview",
          "coverageCheck",
          "medicalNeccessityChecklist",
          "paSubmission",
          "paStatus",
          "pharmaPa",
        ],
        type: "enterprise",
        planId: PLAN_ID,
        internal_organizations: [],
      },
      { merge: true }
    );
    console.log(`Created/updated facility plan: ${PLAN_ID}`);

    // Step 5: Create BO options
    const boOptionsRef = facilityRef.collection("options").doc("bo_options");
    await boOptionsRef.set(
      {
        data: [
          { label: "Approved", value: "approved", priority: 1 },
          { label: "Denied", value: "denied", priority: 2 },
          { label: "Pending", value: "pending", priority: 3 },
          { label: "In Review", value: "in_review", priority: 4 },
        ],
      },
      { merge: true }
    );
    console.log("Created/updated BO options");

    // Step 6: Create auth status options
    const authOptionsRef = facilityRef
      .collection("options")
      .doc("auth_options");
    await authOptionsRef.set(
      {
        data: [
          {
            id: "approved",
            text: "Approved",
            textColor: "#16a34a",
            bgColor: "#f0fdf4",
            priority: 1,
          },
          {
            id: "denied",
            text: "Denied",
            textColor: "#dc2626",
            bgColor: "#fef2f2",
            priority: 2,
          },
          {
            id: "pending",
            text: "Pending",
            textColor: "#ca8a04",
            bgColor: "#fefce8",
            priority: 3,
          },
          {
            id: "in_review",
            text: "In Review",
            textColor: "#2563eb",
            bgColor: "#eff6ff",
            priority: 4,
          },
        ],
      },
      { merge: true }
    );
    console.log("Created/updated auth status options");

    // Step 7: Create auth_config/form_options/v1 collection (needed by formOptionsSlice)
    const formOptionsRef = db
      .collection("auth_config")
      .doc("form_options")
      .collection("v1")
      .doc("default");
    const formOptionsSnap = await formOptionsRef.get();
    if (!formOptionsSnap.exists) {
      await formOptionsRef.set({
        insurance_types: ["Commercial", "Medicare", "Medicaid", "Other"],
        drug_categories: ["Oncology", "Specialty", "General"],
        status_options: ["Pending", "Approved", "Denied", "In Review"],
        created_at: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log("Created auth_config/form_options/v1/default");
    } else {
      console.log("auth_config/form_options/v1/default already exists");
    }

    // Step 8: Create auth_config/cmm_form_config/v1 collection (needed by cmmFormConfigSlice)
    const cmmFormConfigRef = db
      .collection("auth_config")
      .doc("cmm_form_config")
      .collection("v1")
      .doc("default");
    const cmmFormConfigSnap = await cmmFormConfigRef.get();
    if (!cmmFormConfigSnap.exists) {
      await cmmFormConfigRef.set({
        form_fields: [],
        validation_rules: {},
        created_at: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log("Created auth_config/cmm_form_config/v1/default");
    } else {
      console.log("auth_config/cmm_form_config/v1/default already exists");
    }

    console.log("\n--- Setup complete! ---");
    console.log(`User: ${EMAIL} (uid: ${userId})`);
    console.log(`Facility: ${FACILITY_ID}`);
    console.log(`Plan: ${PLAN_ID}`);
    console.log(
      "\nYou can now sign in at localhost:3001/auth with anis@risalabs.ai"
    );
  } catch (error) {
    console.error("Setup failed:", error);
    process.exit(1);
  }
}

main();
