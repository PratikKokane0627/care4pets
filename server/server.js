import "dotenv/config";

import app from "./app.js";
import connectDB from "./config/db.js";
import validateEnv from "./config/validateEnv.js";

const PORT = process.env.PORT || 5000;

validateEnv();
await connectDB();

app.listen(PORT, () => {
  console.log(`Care4Pets server running on port ${PORT}`);
});
