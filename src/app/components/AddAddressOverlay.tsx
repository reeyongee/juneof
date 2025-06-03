"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useAddress } from "@/context/AddressContext";
import { toast } from "sonner";

const addressSchema = z.object({
  name: z.string().min(1, "Address name is required"),
  addressLine1: z.string().min(1, "Address line 1 is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  pincode: z.string().regex(/^\d{6}$/, "Pincode must be 6 digits"),
  phone: z
    .string()
    .regex(/^\+91\s\d{10}$/, "Phone must be in format +91 XXXXXXXXXX"),
  isDefault: z.boolean(),
});

type AddressFormValues = z.infer<typeof addressSchema>;

interface AddAddressOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddAddressOverlay({
  isOpen,
  onClose,
}: AddAddressOverlayProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { addAddress } = useAddress();

  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      name: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      pincode: "",
      phone: "+91 ",
      isDefault: false,
    },
  });

  const onSubmit = async (data: AddressFormValues) => {
    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      addAddress(data);

      toast.success("address added!", {
        description: "your new address has been saved successfully.",
        duration: 3000,
      });

      form.reset();
      onClose();
    } catch {
      toast.error("failed to add address", {
        description: "please try again.",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Overlay Content */}
      <div className="relative bg-[#F8F4EC] w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto border border-gray-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-300">
          <h2 className="text-xl font-serif lowercase tracking-widest text-black">
            add new address
          </h2>
          <button
            onClick={handleClose}
            className="text-black hover:opacity-75 transition-opacity no-underline-effect"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm lowercase tracking-widest text-black">
                      address name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. home, office, etc."
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
                name="addressLine1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm lowercase tracking-widest text-black">
                      address line 1
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="house/flat number, street name"
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
                name="addressLine2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm lowercase tracking-widest text-black">
                      address line 2 (optional)
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="area, landmark"
                        className="bg-white border-gray-300 text-black placeholder:text-gray-500 focus:border-black focus:ring-black/20 h-10 text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-red-600 text-sm" />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm lowercase tracking-widest text-black">
                        city
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="city"
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
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm lowercase tracking-widest text-black">
                        state
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="state"
                          className="bg-white border-gray-300 text-black placeholder:text-gray-500 focus:border-black focus:ring-black/20 h-10 text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-600 text-sm" />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="pincode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm lowercase tracking-widest text-black">
                      pincode
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="6-digit pincode"
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
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm lowercase tracking-widest text-black">
                      phone number
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="+91 XXXXXXXXXX"
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
                name="isDefault"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="border-black data-[state=checked]:bg-black data-[state=checked]:border-black"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm lowercase tracking-widest text-black">
                        set as default address
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1 lowercase tracking-widest border-black text-black hover:bg-gray-100 h-10 text-sm transition-all duration-300 no-underline-effect"
                  disabled={isLoading}
                >
                  cancel
                </Button>
                <Button
                  type="submit"
                  variant="outline"
                  className="flex-1 lowercase tracking-widest border-black text-black hover:bg-black hover:text-white h-10 text-sm transition-all duration-300 no-underline-effect"
                  disabled={isLoading}
                >
                  {isLoading ? "saving..." : "save address"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
