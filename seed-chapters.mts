import { drizzle } from "drizzle-orm/mysql2";
import { chapters } from "./drizzle/schema";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, ".env") });

const CH = [
  { num: 1, sanskrit: "अर्जुनविषादयोगः", hindi: "अर्जुन विषाद योग", banjara: "अध्यायू एकु - पांडवों को देखकर", count: 47 },
  { num: 2, sanskrit: "सान्ख्ययोगः", hindi: "सान्ख्य योग", banjara: "अध्यायू दूगावो - सांख्य", count: 72 },
  { num: 3, sanskrit: "कर्मयोगः", hindi: "कर्म योग", banjara: "अध्यायू तिगावो - कर्म", count: 43 },
  { num: 4, sanskrit: "ज्ञानकर्मसंन्यासयोगः", hindi: "ज्ञान कर्म सन्यास योग", banjara: "अध्यायू चारेगावो - ज्ञान कर्म", count: 42 },
  { num: 5, sanskrit: "कर्मसंन्यासयोगः", hindi: "कर्म सन्यास योग", banjara: "अध्यायू पाँचेगावो - कर्म सन्यास", count: 29 },
  { num: 6, sanskrit: "ध्यानयोगः", hindi: "ध्यान योग", banjara: "अध्यायू छावो - ध्यान", count: 47 },
  { num: 7, sanskrit: "ज्ञानविज्ञानयोगः", hindi: "ज्ञान विज्ञान योग", banjara: "अध्यायू सातेगावो - ज्ञान विज्ञान", count: 30 },
  { num: 8, sanskrit: "अक्षरब्रह्मयोगः", hindi: "अक्षर ब्रह्म योग", banjara: "अध्यायू आठेगावो - अक्षर ब्रह्म", count: 28 },
  { num: 9, sanskrit: "राजविद्याराजगुह्ययोगः", hindi: "राज विद्या राज गुह्य योग", banjara: "अध्यायू नवेगावो - राज विद्या", count: 34 },
  { num: 10, sanskrit: "विभूतियोगः", hindi: "विभूति योग", banjara: "अध्यायू दसेगावो - विभूति", count: 42 },
  { num: 11, sanskrit: "विश्वरूपदर्शनयोगः", hindi: "विश्वरूप दर्शन योग", banjara: "अध्यायू ग्यारेगावो - विश्वरूप", count: 55 },
  { num: 12, sanskrit: "भक्तियोगः", hindi: "भक्ति योग", banjara: "अध्यायू बारेगावो - भक्ति", count: 20 },
  { num: 13, sanskrit: "क्षेत्रक्षेत्रज्ञविभागयोगः", hindi: "क्षेत्र क्षेत्रज्ञ विभाग योग", banjara: "अध्यायू तेरेगावो - क्षेत्र क्षेत्रज्ञ", count: 34 },
  { num: 14, sanskrit: "गुणत्रयविभागयोगः", hindi: "गुणत्रय विभाग योग", banjara: "अध्यायू चौदेगावो - गुणत्रय", count: 27 },
  { num: 15, sanskrit: "पुरुषोत्तमयोगः", hindi: "पुरुषोत्तम योग", banjara: "अध्यायू पंदरेगावो - पुरुषोत्तम", count: 20 },
  { num: 16, sanskrit: "दैवासुरसम्पद्विभागयोगः", hindi: "दैवासुर सम्पद विभाग योग", banjara: "अध्यायू सोलेगावो - दैवासुर", count: 24 },
  { num: 17, sanskrit: "श्रद्धात्रयविभागयोगः", hindi: "श्रद्धात्रय विभाग योग", banjara: "अध्यायू सतरेगावो - श्रद्धात्रय", count: 28 },
  { num: 18, sanskrit: "मोक्षसंन्यासयोगः", hindi: "मोक्ष सन्यास योग", banjara: "अध्यायू अठारेगावो - मोक्ष सन्यास", count: 78 },
];

const db = drizzle(process.env.DATABASE_URL!);
const existing = await db.select().from(chapters);
if (existing.length > 0) {
  console.log(`Already ${existing.length} chapters seeded. Skipping.`);
  process.exit(0);
}
await db.insert(chapters).values(
  CH.map((c) => ({
    chapterNumber: c.num,
    titleSanskrit: c.sanskrit,
    titleBanjara: c.banjara,
    titleHindi: c.hindi,
    totalShlokas: c.count,
    status: "draft" as const,
  }))
);
console.log("Seeded 18 chapters.");
process.exit(0);
