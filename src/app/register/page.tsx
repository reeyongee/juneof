"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { signIn } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(
        /[^A-Za-z0-9]/,
        "Password must contain at least one special character"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const password = form.watch("password");

  // Password requirements checklist
  const passwordRequirements = [
    {
      label: "at least 8 characters",
      met: password.length >= 8,
    },
    {
      label: "one uppercase letter",
      met: /[A-Z]/.test(password),
    },
    {
      label: "one lowercase letter",
      met: /[a-z]/.test(password),
    },
    {
      label: "one number",
      met: /[0-9]/.test(password),
    },
    {
      label: "one special character",
      met: /[^A-Za-z0-9]/.test(password),
    },
  ];

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);

    try {
      // Debug: Log the environment variables (remove in production)
      console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
      console.log("Has Anon Key:", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

      const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/register-email-user`;
      console.log("Attempting to call:", url);

      // Make a POST request to the Supabase Edge Function
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
        }),
      });

      console.log("Response status:", response.status);
      console.log(
        "Response headers:",
        Object.fromEntries(response.headers.entries())
      );

      // Check if response is actually JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await response.text();
        console.error("Non-JSON response received:", textResponse);
        throw new Error(
          `Server returned non-JSON response: ${response.status} ${response.statusText}`
        );
      }

      const result = await response.json();
      console.log("Response data:", result);

      if (!response.ok) {
        throw new Error(
          result.error ||
            `Registration failed: ${response.status} ${response.statusText}`
        );
      }

      // Show success toast
      toast.success("Welcome to juneof!", {
        description: "Your account has been created successfully.",
        duration: 3000,
      });

      // Automatically sign the user in
      const signInResult = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (signInResult?.error) {
        // If auto sign-in fails, redirect to sign-in page with success message
        toast.info("Please sign in", {
          description:
            "Account created successfully. Please sign in to continue.",
          duration: 3000,
        });
        setTimeout(() => {
          router.push("/signin");
        }, 1000);
      } else {
        // If auto sign-in succeeds, redirect to dashboard
        toast.success("Signed in successfully!", {
          description: "Welcome to your dashboard.",
          duration: 2000,
        });
        setTimeout(() => {
          router.push("/dashboard");
        }, 1000);
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Registration failed", {
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred. Please try again.",
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-[#F8F4EC] px-4">
      <div className="w-full max-w-4xl">
        <Card className="bg-[#F8F4EC] border-none shadow-none">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl lowercase tracking-widest text-black mb-1">
              register
            </CardTitle>
            <CardDescription className="text-black/70 lowercase tracking-wider text-sm">
              create your account to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <div className="grid grid-cols-2 gap-8">
                {/* Left Side - Email Registration Form */}
                <div className="space-y-4 pr-4">
                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(onSubmit)}
                      className="space-y-3"
                    >
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm lowercase tracking-widest text-black">
                              full name
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="text"
                                placeholder="enter your full name"
                                className="bg-white border-gray-300 text-black placeholder:text-gray-500 focus:border-black focus:ring-black/20 h-10 text-sm"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-red-600 text-sm" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm lowercase tracking-widest text-black">
                              email
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="example@example.com"
                                className="bg-white border-gray-300 text-black placeholder:text-gray-500 focus:border-black focus:ring-black/20 h-10 text-sm"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-red-600 text-sm" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm lowercase tracking-widest text-black">
                              password
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="create a strong password"
                                className="bg-white border-gray-300 text-black placeholder:text-gray-500 focus:border-black focus:ring-black/20 h-10 text-sm"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-red-600 text-sm" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm lowercase tracking-widest text-black">
                              confirm password
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="confirm your password"
                                className="bg-white border-gray-300 text-black placeholder:text-gray-500 focus:border-black focus:ring-black/20 h-10 text-sm"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-red-600 text-sm" />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        variant="outline"
                        className="w-full lowercase tracking-widest border-black text-black hover:bg-black hover:text-white h-10 text-sm transition-all duration-300"
                        disabled={isLoading}
                      >
                        {isLoading ? "creating account..." : "create account"}
                      </Button>
                    </form>
                  </Form>

                  {/* Password Requirements Checklist */}
                  {password && (
                    <div className="bg-white border border-gray-300 p-4 space-y-2">
                      <p className="text-sm lowercase tracking-wider text-black/70 mb-3">
                        password requirements:
                      </p>
                      {passwordRequirements.map((requirement, index) => (
                        <div key={index} className="flex items-center gap-2">
                          {requirement.met ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <X className="h-4 w-4 text-red-500" />
                          )}
                          <span
                            className={`text-sm lowercase tracking-wider ${
                              requirement.met
                                ? "text-green-600"
                                : "text-black/70"
                            }`}
                          >
                            {requirement.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Side - Sign In & Social Options */}
                <div className="space-y-6 pl-4">
                  {/* Sign In Link */}
                  <div className="text-center">
                    <div className="relative mb-4">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-black/20" />
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="bg-[#F8F4EC] px-3 text-black/70 lowercase tracking-wider">
                          existing user?
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-black/70 mb-3 lowercase tracking-wider text-sm">
                        already have an account?
                      </p>
                      <Link href="/signin">
                        <Button
                          variant="outline"
                          className="w-full lowercase tracking-widest border-black text-black hover:bg-black hover:text-white h-10 text-sm transition-all duration-300"
                          data-underline-button-effect
                        >
                          sign in here
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Social Sign-Up Buttons */}
                  <div className="space-y-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full lowercase tracking-widest border-black text-black hover:bg-black hover:text-white h-10 text-sm transition-all duration-300 relative"
                      onClick={() => {
                        toast.info("Google Sign-Up", {
                          description: "Google sign-up is coming soon!",
                          duration: 3000,
                        });
                      }}
                    >
                      <div className="flex items-center justify-center gap-2 w-full">
                        <svg
                          className="w-4 h-4 flex-shrink-0 -translate-y-px"
                          viewBox="0 0 24 24"
                        >
                          <path
                            fill="currentColor"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="currentColor"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="currentColor"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          />
                          <path
                            fill="currentColor"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          />
                        </svg>
                        <span className="leading-none">
                          continue with google
                        </span>
                      </div>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full lowercase tracking-widest border-black text-black hover:bg-black hover:text-white h-10 text-sm transition-all duration-300 relative"
                      onClick={() => {
                        toast.info("Apple Sign-Up", {
                          description: "Apple sign-up is coming soon!",
                          duration: 3000,
                        });
                      }}
                    >
                      <div className="flex items-center justify-center gap-2 w-full">
                        <svg
                          className="w-4 h-4 flex-shrink-0 -translate-y-px"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                        </svg>
                        <span className="leading-none">
                          continue with apple
                        </span>
                      </div>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Centered Vertical Divider */}
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-black/20 transform -translate-x-1/2"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
