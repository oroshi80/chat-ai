import NextAuth from "next-auth";
import Facebook from "next-auth/providers/facebook";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Spotify from "next-auth/providers/spotify";
import Twitter from "next-auth/providers/twitter";
import db from "@/app/(config)/db";
import { JWT } from "next-auth/jwt";
import { ResultSetHeader } from "mysql2";
import { RowDataPacket } from "mysql2";

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [Google({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET
    }), Facebook, Twitter, Spotify, GitHub],
    pages: {
        signIn: "/auth/signin",
        signOut: "/auth/signout"
    },
    callbacks: {
        signIn: async ({ user, account }) => {
            console.log("Attempting sign in for:", user.email, "with provider:", account?.provider);

            if (!user.email || !account?.provider) {
                console.log("Access denied due to missing email or provider");
                return false;
            }

            try {
                const [rows] = await db.execute<RowDataPacket[]>(
                    `SELECT * FROM users WHERE email = ? AND provider = ? LIMIT 1`,
                    [user.email, account.provider]
                );


                if (rows.length === 0) {
                    console.log("Inserting new user:", user.email, account.provider);

                    const [insertResult] = await db.execute<ResultSetHeader>(
                        `INSERT INTO users (sso_id, email, name, provider) VALUES (?, ?, ?, ?)`,
                        [user.id, user.email, user.name || "", account.provider]
                    );

                    const insertId = insertResult.insertId;

                    await db.execute(`INSERT INTO credits (user_id) VALUES (?)`, [insertId]);

                    return true;
                } else {
                    await db.execute(
                        `UPDATE users SET lastLogin = ?, sso_id = ? WHERE email = ? AND provider = ?`,
                        [new Date(), user.id, user.email, account.provider]
                    );

                    return true;
                }
            } catch (err) {
                console.error("Error during sign in:", err);
                return false;
            }
        },

        jwt: async ({ token, user, account }) => {
            if (user) {
                token.id = user.id;
                token.provider = account?.provider;
            }
            return token;
        },

        session: async ({ session, token }) => {
            if (token) {
                session.id = token.id;
                session.provider = token.provider as string;

                try {
                    const [rows] = await db.execute<RowDataPacket[]>(
                        `SELECT id, email, provider FROM users WHERE email = ? AND provider = ?`,
                        [session.user?.email, session.provider]
                    );

                    if (rows.length > 0) {
                        session.userID = rows[0].id;
                    } else {
                        console.log("User not found in the database:", session.user?.email);
                    }
                } catch (error) {
                    console.error("Error processing session:", error);
                    return { ...session, token: null };
                }
            }

            return session;
        },

        redirect: async ({ url, baseUrl }) => {
            return baseUrl;
        }
    }
});


declare module "next-auth" {
    interface Session {
        id?: string;
        userID?: number;
        provider?: string;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id?: string;
    }
}
