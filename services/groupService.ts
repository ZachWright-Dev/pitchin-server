import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import type { GroupImageResponse } from "../types/groups";
const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
});

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
