"use client"; // Required for useEffect and useRef

import { useEffect, useRef, useState, FormEvent } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, Phone, Instagram } from "lucide-react";
import { toast } from "sonner";

// Register GSAP plugins
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function ContactUsPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const backgroundRef = useRef<HTMLDivElement>(null);
  const mainElementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Set page title
    document.title = "contact us - june of";
  }, []);

  useEffect(() => {
    // Parallax Effect for backgroundRef
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
        tl.kill();
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
    <div className="relative min-h-screen">
      {/* Parallax Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          ref={backgroundRef}
          className="absolute inset-0 h-[130%] bg-cover bg-center opacity-30"
          style={{
            backgroundImage: "url('/landing-images/about.jpg')",
          }}
        />
      </div>

      <main ref={mainElementRef} className="relative min-h-screen">
        <div className="container mx-auto px-4 sm:px-8 py-20">
          {/* Header Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-light mb-6 lowercase tracking-widest text-black">
              get in touch
            </h1>
            <p className="text-lg md:text-xl text-gray-700 max-w-2xl mx-auto lowercase tracking-wider">
              we&apos;d love to hear from you. send us a message and we&apos;ll
              respond as soon as possible.
            </p>
          </div>

          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
              {/* Contact Information */}
              <div className="flex flex-col justify-center h-full">
                <div>
                  <h2 className="text-2xl md:text-3xl font-light mb-8 lowercase tracking-widest text-black">
                    reach out
                  </h2>

                  <div className="space-y-6">
                    <div className="flex items-center space-x-4">
                      <div className="bg-black p-3 rounded-full">
                        <Mail className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 lowercase tracking-widest">
                          email
                        </p>
                        <p className="text-lg text-black lowercase">
                          reach@juneof.com
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="bg-black p-3 rounded-full">
                        <Phone className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 lowercase tracking-widest">
                          phone
                        </p>
                        <p className="text-lg text-black lowercase">
                          +1 (555) 123-4567
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="bg-black p-3 rounded-full">
                        <Instagram className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 lowercase tracking-widest">
                          instagram
                        </p>
                        <a
                          href="https://www.instagram.com/juneof__"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-lg text-black lowercase hover:text-gray-600 transition-colors"
                        >
                          @juneof__
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <div className="bg-white/80 backdrop-blur-sm p-8 rounded-lg shadow-lg">
                <h2 className="text-2xl md:text-3xl font-light mb-8 lowercase tracking-widest text-black">
                  send message
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label
                        htmlFor="firstName"
                        className="block mb-2 text-sm lowercase tracking-widest text-gray-700"
                      >
                        first name
                      </Label>
                      <Input
                        type="text"
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        className="w-full bg-transparent border-gray-300 focus:border-black transition-colors lowercase"
                        placeholder="your first name"
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="lastName"
                        className="block mb-2 text-sm lowercase tracking-widest text-gray-700"
                      >
                        last name
                      </Label>
                      <Input
                        type="text"
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        className="w-full bg-transparent border-gray-300 focus:border-black transition-colors lowercase"
                        placeholder="your last name"
                      />
                    </div>
                  </div>

                  <div>
                    <Label
                      htmlFor="email"
                      className="block mb-2 text-sm lowercase tracking-widest text-gray-700"
                    >
                      email address
                    </Label>
                    <Input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full bg-transparent border-gray-300 focus:border-black transition-colors lowercase"
                      placeholder="your email address"
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="message"
                      className="block mb-2 text-sm lowercase tracking-widest text-gray-700"
                    >
                      message
                    </Label>
                    <Textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                      rows={6}
                      className="w-full bg-transparent border-gray-300 focus:border-black transition-colors resize-none lowercase"
                      placeholder="type your message here..."
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-black text-white hover:bg-gray-800 py-3 px-6 text-base lowercase tracking-wider transition-colors disabled:opacity-70"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        sending...
                      </>
                    ) : (
                      "send message"
                    )}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
