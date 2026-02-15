
import { GoogleGenAI, Type } from "@google/genai";
import { Product, Transaction, AIInsight } from "../types";

export const getInventoryInsights = async (products: Product[], transactions: Transaction[]): Promise<AIInsight> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const lowStockItems = products.filter(p => p.stock <= p.minStock);
  const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);

  const prompt = `
    Analisis data inventaris berikut dan berikan satu insight singkat.
    Data:
    - Total Produk: ${products.length}
    - Barang Stok Menipis: ${lowStockItems.length} (${lowStockItems.map(i => i.name).join(', ')})
    - Total Nilai Aset: Rp ${totalValue.toLocaleString('id-ID')}
    - Jumlah Transaksi Terakhir: ${transactions.slice(-10).length}

    Berikan output dalam format JSON sesuai skema yang diminta.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            status: { type: Type.STRING, description: 'critical, warning, or good' },
            message: { type: Type.STRING },
            suggestion: { type: Type.STRING }
          },
          required: ['status', 'message', 'suggestion']
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      status: 'warning',
      message: 'Gagal memuat analisis AI.',
      suggestion: 'Pastikan koneksi internet stabil dan kunci API valid.'
    };
  }
};
