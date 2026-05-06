import { connectToDatabase } from "./server/db-mysql.js";
import AdminProfile from "./server/models-mysql/AdminProfile.js";

await connectToDatabase();
const doc = await AdminProfile.findOne({ where: { profileId: "admin" } });
console.log("Document found:", JSON.stringify(doc?.get({ plain: true }) ?? null, null, 2));
process.exit(0);
