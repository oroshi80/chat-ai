"use client";

import { getProviders, signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { InteractiveGridPattern } from "@/components/magicui/interactive-grid-pattern";
import { ShimmerButton } from "@/components/magicui/shimmer-button";

type Provider = {
  id: string;
  name: string;
};

export default function SignInPage() {
  const [providers, setProviders] = useState<Record<string, Provider> | null>(
    null
  );

  useEffect(() => {
    getProviders().then((res) => setProviders(res));
  }, []);

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
        <div className="text-6xl pb-4">Chat AI Login</div>
        <div className="bg-neutral-800 p-6 rounded-xl space-y-4 w-full max-w-sm shadow-lg">
          {providers &&
            Object.values(providers).map((provider) => (
              <ShimmerButton
                key={provider.name}
                onClick={() => signIn(provider.id)}
                className="w-full flex rounded-md shadow-md hover:shadow-lg"
              >
                <div className="flex justify-between items-center w-full text-white">
                  <span>Sign in with {provider.name}</span>
                  <img
                    src={`https://authjs.dev/img/providers/${provider.id}.svg`}
                    className="w-6 h-6 bg-accent rounded-full"
                    alt={provider.name}
                  />
                </div>
              </ShimmerButton>
            ))}
        </div>
      </div>
    </div>
  );
}
