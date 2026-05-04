import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import type { UserImageResponse } from "../types/user";
import type { GroupOverviewResponse, Group } from "../types/user";
import { getGroupBalanceForUser } from "./dashboardService";

const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
});

export async function getUserImageData(userId: string): Promise<UserImageResponse> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            image: true,
            avatar: true,
            avatarType: true,
        }
    });

    if (!user) {
        throw new Error(`User: ${userId} not found`);
    }

    const userImageData: UserImageResponse = {
        oauth_image: user.image,
        image: user.avatar ? Buffer.from(user.avatar).toString("base64") : null,
        imageType: user.avatarType,
    }

    return userImageData;
}

export async function getGroupOverviewData(userId: string): Promise<GroupOverviewResponse> {
    const groupMemberships = await prisma.groupMember.findMany({
        where: { userId },
        select: {
            group: {
                select: {
                    id: true,
                    name: true,
                    members: {
                        select: {
                            user: { select: { id: true, name: true } }
                        }
                    }
                }
            }
        }
    });

    const groups: Group[] = [];
    for (const membership of groupMemberships) {
        const { id, name, members } = membership.group;
        const balance = await getGroupBalanceForUser(id, userId);
        groups.push({
            id,
            name,
            balance: Math.round(balance * 100) / 100,
            members: members.map(m => ({
                id: m.user.id,
                name: m.user.name ?? "Unknown",
            }))
        });
    }

    return { groups };
}
