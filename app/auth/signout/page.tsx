"use client";

import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { InteractiveGridPattern } from "@/components/magicui/interactive-grid-pattern";
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { LucideLogOut } from "lucide-react";

export default function SignOutPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-900 text-white p-6">
      <InteractiveGridPattern
        className={cn(
          "[mask-image:radial-gradient(400px_circle_at_center,white,transparent)]"
        )}
        width={20}
        height={20}
        squares={[80, 80]}
        squaresClassName="hover:fill-purple-500"
      />
      <div className="z-10">
        <div className="text-5xl pb-4">Chat AI Sign Out</div>
        <div className="bg-neutral-800 p-6 rounded-xl space-y-4 w-full max-w-sm shadow-lg">
          <ShimmerButton
            onClick={() => signOut()}
            className="w-full flex rounded-md shadow-md hover:shadow-lg"
          >
            <div className="flex justify-between items-center w-full text-white">
              <span>Sign Out</span>
              <LucideLogOut size={20} />
            </div>
          </ShimmerButton>
        </div>
      </div>
    </div>
  );
}
