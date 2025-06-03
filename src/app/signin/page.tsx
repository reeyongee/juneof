"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
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
import { DUMMY_CREDENTIALS } from "@/lib/auth-constants";

const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type SignInFormValues = z.infer<typeof signInSchema>;

export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { signIn } = useAuth();

  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: SignInFormValues) => {
    setIsLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Check against dummy credentials
    if (
      data.email === DUMMY_CREDENTIALS.email &&
      data.password === DUMMY_CREDENTIALS.password
    ) {
      console.log("Sign in successful!", data);

      // Sign in the user
      signIn(data.email);

      // Show success toast
      toast.success("Welcome back!", {
        description: "You have successfully signed in.",
        duration: 3000,
      });

      // Redirect to home page after a short delay
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } else {
      form.setError("root", {
        message:
          "oops that didn't work. we didn't find you in our database. maybe try again? or click on the register button below.",
      });
    }

    setIsLoading(false);
  };

  return (
    <div className="h-screen flex items-center justify-center bg-[#F8F4EC] px-4">
      <div className="w-full max-w-md">
        <Card className="bg-[#F8F4EC] border-none shadow-none">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl lowercase tracking-widest text-black mb-1">
              sign in
            </CardTitle>
            <CardDescription className="text-black/70 lowercase tracking-wider text-sm">
              enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Social Sign-In Buttons */}
            <div className="space-y-3 mb-6">
              <Button
                type="button"
                variant="outline"
                className="w-full lowercase tracking-widest border-black text-black hover:bg-black hover:text-white h-10 text-sm transition-all duration-300 relative"
                onClick={() => {
                  // TODO: Implement Google sign-in
                  toast.info("Google Sign-In", {
                    description: "Google sign-in is coming soon!",
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
                  <span className="leading-none">continue with google</span>
                </div>
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full lowercase tracking-widest border-black text-black hover:bg-black hover:text-white h-10 text-sm transition-all duration-300 relative"
                onClick={() => {
                  // TODO: Implement Apple sign-in
                  toast.info("Apple Sign-In", {
                    description: "Apple sign-in is coming soon!",
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
                  <span className="leading-none">continue with apple</span>
                </div>
              </Button>
            </div>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-black/20" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-[#F8F4EC] px-3 text-black/70 lowercase tracking-wider">
                  or continue with email
                </span>
              </div>
            </div>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
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
                          placeholder="enter your password"
                          className="bg-white border-gray-300 text-black placeholder:text-gray-500 focus:border-black focus:ring-black/20 h-10 text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-600 text-sm" />
                    </FormItem>
                  )}
                />

                {form.formState.errors.root && (
                  <div className="text-red-600 text-sm text-center lowercase tracking-wider">
                    {form.formState.errors.root.message}
                  </div>
                )}

                <Button
                  type="submit"
                  variant="outline"
                  className="w-full lowercase tracking-widest border-black text-black hover:bg-black hover:text-white h-10 text-sm transition-all duration-300"
                  disabled={isLoading}
                >
                  {isLoading ? "signing in..." : "sign in"}
                </Button>
              </form>
            </Form>

            {/* Register Link */}
            <div className="mt-6 text-center">
              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-black/20" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-[#F8F4EC] px-3 text-black/70 lowercase tracking-wider">
                    or
                  </span>
                </div>
              </div>
              <div>
                <p className="text-black/70 mb-3 lowercase tracking-wider text-sm">
                  not an existing user?
                </p>
                <Link href="/register">
                  <Button
                    variant="outline"
                    className="w-full lowercase tracking-widest border-black text-black hover:bg-black hover:text-white h-10 text-sm transition-all duration-300"
                    data-underline-button-effect
                  >
                    register here
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
