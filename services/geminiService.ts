import { GoogleGenAI } from "@google/genai";
import { Loan } from "../types";

const apiKey = process.env.API_KEY || '';
// Initialize conditionally to avoid crashing if key is missing during dev (though required by prompt)
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const analyzePortfolio = async (loans: Loan[]): Promise<string> => {
  if (!ai) return "กรุณาตั้งค่า API Key เพื่อใช้งานฟีเจอร์ AI";

  const activeLoans = loans.filter(l => l.status === 'ACTIVE' || l.status === 'OVERDUE');
  
  // Prepare a summary for the AI (avoid sending PII if possible, but for this local app names are okay)
  const dataSummary = activeLoans.map(l => ({
    name: l.borrowerName,
    amount: l.amount,
    type: l.borrowerType,
    status: l.status,
    term: l.term,
    repaid: l.transactions.filter(t => t.type === 'REPAYMENT').reduce((sum, t) => sum + t.amount, 0)
  }));

  const prompt = `
    คุณคือผู้ช่วยทางการเงินอัจฉริยะสำหรับแอพ "TONCAPGUN" (แอพปล่อยเงินกู้)
    ช่วยวิเคราะห์พอร์ตโฟลิโอต่อไปนี้เป็นภาษาไทย ให้คำแนะนำสั้นๆ กระชับ สำหรับเจ้าหนี้
    
    ข้อมูลดิบ:
    ${JSON.stringify(dataSummary)}

    สิ่งที่ต้องการ:
    1. ภาพรวมความเสี่ยง (ลูกหนี้กลุ่มไหนน่าห่วง)
    2. คำแนะนำในการบริหารกระแสเงินสด
    3. ข้อความให้กำลังใจสั้นๆ

    ตอบเป็นภาษาไทย ในรูปแบบ Markdown
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "ไม่สามารถวิเคราะห์ข้อมูลได้ในขณะนี้";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI";
  }
};