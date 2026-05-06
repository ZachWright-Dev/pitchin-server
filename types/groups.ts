import { z } from 'zod';

export interface GroupRequest {
    group_id: string
}

export interface GroupImageResponse {
    emoji: string | null
    groupImage: string | null;
    groupImageType: string | null;
}

const ReceiptItemSchema = z.object({
    name: z.string().describe("Name of the item"),
    price: z.number().describe("Unit Price of the item"),
    quantity: z.number().describe("Quantity purchased")
});

const ReceiptSuccessSchema = z.object({
    success: z.literal(true),
    items: z.array(ReceiptItemSchema),
    subTotal: z.number(),
    tax: z.number(),
    total: z.number(),
});

const ReceiptErrorSchema = z.object({
    success: z.literal(false),
    error: z.string().describe("Reason extraction failed"),
});

export const ReceiptSchema = z.discriminatedUnion("success", [ReceiptSuccessSchema, ReceiptErrorSchema])

interface RequestReceiptItem {
    name: string
    quantity: number
    unitPrice: number
}

interface ResponseReceiptItem {
    id: string
    name: string
    quantity: number
    unitPrice: number
}

interface RequestReceipt {
    image: string | null
    items: RequestReceiptItem[]
    taxAmount: number
    tipAmount: number
}

interface ResponseReceipt {
    id: string
    subtotal: number
    taxAmount: number
    tipAmount: number
    grandTotal: number
    items: ResponseReceiptItem[]
}

export interface CreateGroupRequest {
    name: string
    emoji: string | null
    groupImage: string | null
    groupImageType: string | null
    receipt: RequestReceipt
}

export interface CreateGroupResponse {
    id: string
    name: string
    emoji: string | null
    inviteToken: string
    createdAt: string
    receipt: ResponseReceipt
}
