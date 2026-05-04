import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { Decimal } from "../generated/prisma/internal/prismaNamespace";
import type { DashboardResponse, GroupBalance, PersonBalance } from "../types/dashboard";

const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
});

export async function getDashboardData(userId: string): Promise<DashboardResponse> {
    // Get all groups the user belongs to
    const groupMemberships = await prisma.groupMember.findMany({
        where: {userId},
        select: {
            group: {
                select: { id: true, name: true, emoji: true},
            },
        },
    });

    // Calculate the balance for each group
    const groups: GroupBalance[] = [];
    for (const group of groupMemberships) {
        const balance = await getGroupBalanceForUser(group.group.id, userId);
        groups.push({
            id: group.group.id,
            name: group.group.name,
            balance: Math.round(balance * 100)/ 100,
        });
    }

    // Summary: Split group balances into positive and negative values
    let owed = 0;
    let owe = 0;
    let num_groups_owed = 0;

    for (const group of groups) {
        if (group.balance > 0) {
            owed += group.balance;
            num_groups_owed++;
        } else if (group.balance < 0) {
            owe += Math.abs(group.balance);
        }
    }

    const overall = Math.round((owed - owe) * 100) / 100;

    // Find all users who share a group with this user
    const coMembers = await prisma.groupMember.findMany({
        where: {
            groupId: { in: groupMemberships.map((m) => m.group.id)},
            userId: {not: userId},
        },
        select: {
            userId: true,
            groupId: true,
            user: { select: { id: true, name: true} },
        },
    });

    const coMemberMap = new Map<string, {name: string; groupIds: string[]}>();
    for (const member of coMembers) {
        const existing = coMemberMap.get(member.userId);
        if (existing) {
            existing.groupIds.push(member.groupId);
        } else {
            coMemberMap.set(member.userId, {
                name: member.user.name ?? "Unknown",
                groupIds: [member.groupId]
            });
        }
    }

    const people: PersonBalance[] = [];
 
    for (const [otherId, { name, groupIds }] of coMemberMap) {
    let netBalance = 0;
 
    for (const groupId of groupIds) {
        const receipt = await prisma.receipt.findUnique({
            where: { groupId },
            select: { id: true, subtotal: true, grandTotal: true },
        });
 
        if (!receipt || to_number(receipt.subtotal) === 0) continue;
    
        const markupRatio = to_number(receipt.grandTotal) / to_number(receipt.subtotal);
        const grandTotal = to_number(receipt.grandTotal);
    
        // What each person paid toward the bill
        const userPaid = await prisma.billPayment.aggregate({
            _sum: { amount: true },
            where: { receiptId: receipt.id, payerId: userId },
        });
        const otherPaid = await prisma.billPayment.aggregate({
            _sum: { amount: true },
            where: { receiptId: receipt.id, payerId: otherId },
        });
        const userPaidAmt = userPaid._sum.amount ? to_number(userPaid._sum.amount) : 0;
        const otherPaidAmt = otherPaid._sum.amount ? to_number(otherPaid._sum.amount) : 0;
    
        // Calculate each person's fair share from their item claims
        const otherShare = await calcFairShare(otherId, receipt.id, markupRatio);
        const userShare = await calcFairShare(userId, receipt.id, markupRatio);
    
        // How much does the other person owe userId (and vice versa),
        // proportional to each person's share of the payments
        const userPayFraction = grandTotal > 0 ? userPaidAmt / grandTotal : 0;
        const otherPayFraction = grandTotal > 0 ? otherPaidAmt / grandTotal : 0;
    
        const otherOwesUser = otherShare * userPayFraction;
        const userOwesOther = userShare * otherPayFraction;
    
        // Settlements between these two in this group
        const settledToUser = await prisma.settlementPayment.aggregate({
            _sum: { amount: true },
            where: { groupId, fromUserId: otherId, toUserId: userId },
        });
        const settledFromUser = await prisma.settlementPayment.aggregate({
            _sum: { amount: true },
            where: { groupId, fromUserId: userId, toUserId: otherId },
        });
        const settledIn = settledToUser._sum.amount ? to_number(settledToUser._sum.amount) : 0;
        const settledOut = settledFromUser._sum.amount ? to_number(settledFromUser._sum.amount) : 0;
    
        netBalance += otherOwesUser - userOwesOther + settledIn - settledOut;
    }
 
    const rounded = Math.round(netBalance * 100) / 100;
    if (rounded !== 0) {
        people.push({ id: otherId, name, balance: rounded });
    }
  }
 
  return {
    summary: {
      overall_balance: Math.round(overall * 100) / 100,
      amount_owed: Math.round(owed * 100) / 100,
      amount_owe: Math.round(owe * 100) / 100,
      num_groups_owed,
    },
    people,
    groups,
  };

}

export async function getGroupBalanceForUser(groupId:string, userId: string): Promise<number> {
    // 1. What did the user pay toward the bill for this group
    const payments = await prisma.billPayment.aggregate({
        _sum: { amount: true },
        where: {
            receipt: {groupId},
            payerId: userId,
        },
    });
    
    const paid = payments._sum.amount ? to_number(payments._sum.amount) : 0;

    // 2. What is the user's share of the items they claimed?
    const receipt = await prisma.receipt.findUnique({
        where: { groupId },
        select: { subtotal: true, grandTotal: true },
    });

    let share = 0;

    if (!receipt) {
        throw new Error("No Receipt Found");
    }

    const markUpRatio = to_number(receipt.grandTotal) / to_number(receipt.subtotal);

    // Get every item the user claimed in this groups reciept
    const claims = await prisma.itemClaim.findMany({
        where: {
            userId,
            item: {receipt: { groupId }},
        },
        select: {
            shareWeight: true,
            item: {
                select: {
                    id: true,
                    unitPrice: true,
                    quantity: true,
                }
            }
        }
    });

    for (const claim of claims) {
        const totalWeight = await prisma.itemClaim.aggregate({
            _sum: {shareWeight: true},
            where: {itemId: claim.item.id},
        });

        const weight = to_number(claim.shareWeight);
        const total = to_number(totalWeight._sum.shareWeight!);
        const itemCost = to_number(claim.item.unitPrice) * claim.item.quantity;

        share += (itemCost * weight) / total * markUpRatio;
    }

    // 3. Settlements received (other people paying the user back)
    const received = await prisma.settlementPayment.aggregate({
        _sum: { amount: true},
        where: { groupId, toUserId: userId},
    });

    const settlementIn = received._sum.amount ? to_number(received._sum.amount) : 0;

    // 4. Settlements sent (user paying others back)
    const sent = await prisma.settlementPayment.aggregate({
        _sum: { amount: true},
        where: { groupId, fromUserId: userId},
    });
    const settlementsOut = sent._sum.amount ? to_number(sent._sum.amount) : 0;

    return paid - share + settlementIn - settlementsOut;
}

async function calcFairShare(
    userId: string,
    receiptId: string,
    markupRatio: number
): Promise<number> {
    const claims = await prisma.itemClaim.findMany({
        where: {
            userId,
            item: { receiptId },
        },
        select: {
            shareWeight: true,
            item: { select: { id: true, unitPrice: true, quantity: true } },
        },
    });

    let share = 0;

    for (const claim of claims) {
        const totalWeight = await prisma.itemClaim.aggregate({
            _sum: { shareWeight: true },
            where: { itemId: claim.item.id },
        });

        const itemCost = to_number(claim.item.unitPrice) * claim.item.quantity;
        share += (itemCost * to_number(claim.shareWeight)) / to_number(totalWeight._sum.shareWeight!) * markupRatio;
    }

    return share;
}

function to_number(d: Decimal): number {
    return parseFloat(d.toString());
}
