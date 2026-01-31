import { users, type User, type UpsertUser } from "@shared/models/auth";
import { db } from "../../db";
import { eq } from "drizzle-orm";

interface TwitterUserData {
  twitterId: string;
  twitterUsername: string;
  twitterDisplayName?: string;
  profileImageUrl?: string;
}

// Interface for auth storage operations
export interface IAuthStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByTwitterId(twitterId: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  upsertUserByTwitter(data: TwitterUserData): Promise<User>;
}

class AuthStorage implements IAuthStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByTwitterId(twitterId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.twitterId, twitterId));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async upsertUserByTwitter(data: TwitterUserData): Promise<User> {
    const existingUser = await this.getUserByTwitterId(data.twitterId);
    
    if (existingUser) {
      const [user] = await db
        .update(users)
        .set({
          twitterUsername: data.twitterUsername,
          twitterDisplayName: data.twitterDisplayName,
          profileImageUrl: data.profileImageUrl,
          updatedAt: new Date(),
        })
        .where(eq(users.twitterId, data.twitterId))
        .returning();
      return user;
    }

    const [user] = await db
      .insert(users)
      .values({
        twitterId: data.twitterId,
        twitterUsername: data.twitterUsername,
        twitterDisplayName: data.twitterDisplayName,
        profileImageUrl: data.profileImageUrl,
        firstName: data.twitterDisplayName?.split(" ")[0],
        lastName: data.twitterDisplayName?.split(" ").slice(1).join(" "),
      })
      .returning();
    return user;
  }
}

export const authStorage = new AuthStorage();
