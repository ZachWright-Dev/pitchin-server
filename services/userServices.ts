import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import type { UserImageResponse } from "../types/user";

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
