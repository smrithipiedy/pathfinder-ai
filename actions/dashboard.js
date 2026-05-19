"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

function getModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

  const genAI = new GoogleGenerativeAI(apiKey);

  return genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
  });
}

/* ---------------- SAFE AI INSIGHTS ---------------- */

export const generateAIInsights = async (industry) => {
  try {
    const prompt = `
Analyze ${industry} industry.
Return ONLY valid JSON.

Format:
{
  "salaryRanges": [
    {
      "role": "string",
      "min": number,
      "max": number,
      "median": number,
      "location": "string"
    }
  ],
  "growthRate": number,
  "demandLevel": "Low" | "Medium" | "High",
  "topSkills": ["string"],
  "marketOutlook": "Positive" | "Neutral" | "Negative",
  "keyTrends": ["string"],
  "recommendedSkills": ["string"]
}
`;

    const result = await getModel().generateContent(prompt);
    const text = result.response.text();

    const cleaned = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let parsed;

    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      throw new Error("Invalid JSON from Gemini");
    }

    // ✅ VALIDATION (IMPORTANT)
    if (!parsed?.salaryRanges) throw new Error("Invalid AI structure");

    return parsed;
  } catch (error) {
    console.error("Gemini API Error:", error);

    // SAFE FALLBACK
    return {
      salaryRanges: [
        {
          role: "Software Engineer",
          min: 500000,
          max: 1500000,
          median: 1000000,
          location: "India",
        },
      ],
      growthRate: 15,
      demandLevel: "High",
      topSkills: ["JavaScript", "React", "Node.js"],
      marketOutlook: "Positive",
      keyTrends: ["AI", "Cloud", "Automation"],
      recommendedSkills: ["Next.js", "Prisma", "System Design"],
    };
  }
};

/* ---------------- GET INSIGHTS ---------------- */

export async function getIndustryInsights() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    include: { industryInsight: true },
  });

  if (!user) throw new Error("User not found");

  try {
    if (!user.industryInsight) {
      const insights = await generateAIInsights(user.industry);

      const industryInsight = await db.industryInsight.create({
        data: {
          industry: user.industry,
          ...insights,
          nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      return industryInsight;
    }

    return user.industryInsight;
  } catch (error) {
    console.error("DB Error:", error);
    throw new Error("Failed to fetch/create insights");
  }
}