import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { ReceiptSchema,
    type GroupImageResponse,
    type CreateGroupRequest,
    type CreateGroupResponse
} from "../types/groups";
import { GoogleGenAI } from "@google/genai";

if (!process.env.GEMINI_API_KEY) {
    console.error("Please include the gemini api key!");
    process.exit(1);
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const prompt: string = `You are a receipt-parsing engine. Return ONLY valid JSON matching the provided schema.

EXTRACTION RULES:
1. Extract every line item exactly as printed — preserve the original item name, quantity, and price.
2. If the same item appears on separate lines, keep them as separate entries. Never merge or aggregate lines.
3. Quantities default to 1 unless explicitly stated (e.g. "2 x", "QTY: 3").
4. Prices: use the final charged price per line. If a discount is applied to a specific item, reflect the discounted price and note the original in the item name (e.g. "Soda (was $2.99)").
5. Tax: extract each tax line separately (sales tax, VAT, etc.) with its label and amount.
6. Tips/service charges: extract as their own line if present.
7. Totals: extract subtotal, tax total, tip, and grand total as printed on the receipt.
8. "The 'success' field must be a boolean (true/false), not a string."

VALIDATION:
- Verify: sum of all item prices ≈ subtotal (within $0.02 tolerance for rounding).
- Verify: subtotal + tax + tip ≈ grand total (within $0.02 tolerance).
- If either check fails, still return the extracted data but set "verification_passed" to false and explain the discrepancy in "verification_notes".

HANDLING POOR-QUALITY IMAGES:
- If a value is partially legible, make your best guess and prefix the item name with "[unclear]".
- If the receipt is unreadable or not a receipt at all, return {"success": false, "error": "<specific reason>"}.

Do NOT invent items. Only extract what is visible on the receipt.`;

const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
});

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

export async function createGroupAsync(request: CreateGroupRequest, userId: string): Promise<CreateGroupResponse> {
    const { name, emoji, groupImage, groupImageType, receipt } = request;
    const { image, items, taxAmount, tipAmount } = receipt;

    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const grandTotal = subtotal + taxAmount + tipAmount;
    const groupImageBuffer = groupImage ? Buffer.from(groupImage, "base64") : null;

    console.log("group create 1")
    const group = await prisma.group.create({
        data: {
            name,
            emoji,
            groupImage: groupImageBuffer,
            groupImageType,
            inviteToken: randomUUID(),
            createdById: userId,
            members: {
                create: { userId },
            },
            receipt: {
                create: {
                    imageUrl: image,
                    subtotal,
                    taxAmount,
                    tipAmount,
                    grandTotal,
                    items: {
                        create: items.map((item) => ({
                            name: item.name,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice,
                        })),
                    },
                },
            },
        },
        include: {
            receipt: {
                include: { items: true },
            },
        },
    });

    const responseReceipt = {
        id: group.receipt!.id,
        subtotal: group.receipt!.subtotal.toNumber(),
        taxAmount: group.receipt!.taxAmount.toNumber(),
        tipAmount: group.receipt!.tipAmount.toNumber(),
        grandTotal: group.receipt!.grandTotal.toNumber(),
        items: group.receipt!.items.map((item) => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice.toNumber(),
        })),
    };
    console.log("group create 3")
    const response: CreateGroupResponse = {
        id: group.id,
        name: group.name,
        emoji: group.emoji,
        inviteToken: group.inviteToken!,
        createdAt: group.createdAt.toISOString(),
        receipt: responseReceipt,
    };

    console.log("return from service")
    return response;
}

export async function getGroupImageData(groupId: string): Promise<GroupImageResponse>  {
    const group = await prisma.group.findUnique({
        where: { id: groupId}, 
        select: {
            emoji: true,
            groupImage: true,
            groupImageType: true,
        }
    });

    if (!group) {
        throw new Error(`Group: ${groupId} not found`);
    }

    const groupImageData: GroupImageResponse = {
        emoji: group.emoji,
        groupImage: group.groupImage ? Buffer.from(group.groupImage).toString("base64"): null,
        groupImageType: group.groupImageType,
    };

    return groupImageData;
}

export async function getParsedReceiptData(base64Image: string, mimeType: string) {
    const jsonSchema = ReceiptSchema.toJSONSchema();
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        config: { responseJsonSchema: jsonSchema, responseMimeType: "application/json"},
        contents: [
            {
                inlineData: {
                    mimeType,
                    data: base64Image
                }
            },
            {
                text: prompt
            }
        ]
    });

    if (!response.text) {
        return { success: false, error: "Gemini Response Failed" }
    }

    try {
        const parsed = ReceiptSchema.parse(JSON.parse(response.text))
        return parsed;
    } catch (err) {
        console.error(err);
        throw new Error("Error Parsing the Gemini Reponse");
    }
}
