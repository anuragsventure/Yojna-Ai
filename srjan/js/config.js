/* Srjan configuration.
   Leave supabaseUrl and supabaseKey empty to run in demo mode (submissions stay on the visitor's own device).
   After you create the database (see README.md, section "Go live"), paste the two values here. */
window.AURUM_CONFIG = {
  supabaseUrl: "",
  supabaseKey: "",
  adminEmail: "",
  contactEmail: "",
  maxWorks: 12,
  /* Visitor counter. visitorSeed is added to the real count. It is 500 for the private preview only.
     Set it to 0 before you launch publicly: showing invented visitor numbers can mislead people. */
  /* Demo mode only: SHA 256 of the admin passcode. Once the database is connected, sign in by email link replaces it. */
  demoAdminHash: "0c014d6b1854062ec7ae07fbba7104eec21608ba2d93c26b234e98eaadbe6459",
  visitorSeed: 500
};
