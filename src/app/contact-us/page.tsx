"use client"; // Required for useEffect and useRef

import { useEffect, useRef, useState, FormEvent } from "react";
import { BlurScrollEffect_Effect4 } from "@/lib/animations"; // Adjust path if needed
import gsap from "gsap"; // ScrollTrigger is globally registered
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ContactUsPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const backgroundRef = useRef<HTMLDivElement>(null); // For parallax background
  const mainElementRef = useRef<HTMLElement>(null); // For main scroll trigger

  useEffect(() => {
    // Existing BlurScrollEffect logic for contentRef
    if (contentRef.current) {
      new BlurScrollEffect_Effect4(contentRef.current);
    }
  }, []);

  useEffect(() => {
    // New Parallax Effect for backgroundRef
    if (backgroundRef.current && mainElementRef.current) {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: mainElementRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      tl.to(backgroundRef.current, {
        yPercent: -15,
        ease: "none",
      });

      return () => {
        tl.kill(); // Kill the timeline and its ScrollTrigger
      };
    }
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ firstName, lastName, email, message }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("message sent!", {
          description: "we'll get back to you as soon as possible.",
        });
        setFirstName("");
        setLastName("");
        setEmail("");
        setMessage("");
      } else {
        toast.error("failed to send message.", {
          description: result.error || "please try again.",
        });
      }
    } catch (error) {
      console.error("Error submitting contact form:", error);
      toast.error("an unexpected error occurred.", {
        description: "please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative" style={{ backgroundColor: "#fdf3e1" }}>
      {/* Clipping container for the parallax image */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          ref={backgroundRef}
          className="absolute inset-0 z-0 h-[130%] opacity-0"
        ></div>
      </div>

      <main
        ref={mainElementRef}
        className="relative flex min-h-screen text-black pt-24"
      >
        {/* Left Column (Sticky Title) */}
        <div className="relative sticky top-0 z-10 flex h-screen w-[40%] flex-shrink-0 flex-col justify-center p-8 border-r border-gray-300">
          <h1 className="text-xl font-medium tracking-widest lowercase text-black mix-blend-difference">
            contact us
          </h1>
        </div>

        {/* Right Column (Scrollable Content) */}
        <div className="relative z-10 flex-grow p-8 bg-[rgba(0,0,0,0.02)] backdrop-blur-md">
          <div
            ref={contentRef}
            className="text-3xl lowercase tracking-wider text-black space-y-4 mix-blend-difference"
          >
            {/* Original Content */}
            <p>
              questions? write to us at reach@juneof.com or text us on our
              socials:{" "}
              <a
                href="https://www.instagram.com/juneof__"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:opacity-75 no-underline-effect"
              >
                instagram
              </a>
            </p>

            {/* Contact Form */}
            <div className="pt-8">
              <form
                onSubmit={handleSubmit}
                className="space-y-6 max-w-xl text-sm text-black"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label
                      htmlFor="firstName"
                      className="block mb-1 tracking-widest"
                    >
                      first name
                    </Label>
                    <Input
                      type="text"
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      className="w-full bg-transparent border-gray-400 placeholder:text-gray-500 focus:border-black lowercase"
                      placeholder="your first name"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="lastName"
                      className="block mb-1 tracking-widest"
                    >
                      last name
                    </Label>
                    <Input
                      type="text"
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      className="w-full bg-transparent border-gray-400 placeholder:text-gray-500 focus:border-black lowercase"
                      placeholder="your last name"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email" className="block mb-1 tracking-widest">
                    email address
                  </Label>
                  <Input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-transparent border-gray-400 placeholder:text-gray-500 focus:border-black lowercase"
                    placeholder="your email address"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="message"
                    className="block mb-1 tracking-widest"
                  >
                    message
                  </Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    rows={5}
                    className="w-full bg-transparent border-gray-400 placeholder:text-gray-500 focus:border-black lowercase resize-none"
                    placeholder="type your message here..."
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full md:w-auto bg-black text-white hover:bg-gray-800 py-3 px-6 text-base lowercase tracking-wider transition-colors disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    "reach out"
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
