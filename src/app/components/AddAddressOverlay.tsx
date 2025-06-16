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
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { CustomerAddressInput } from "@/lib/shopify-customer-address-api";

const addressSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  addressLine1: z.string().min(1, "Address line 1 is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  zoneCode: z.string().min(1, "State/Province code is required (e.g., MH, CA)"),
  territoryCode: z.string().min(2, "Country code is required (e.g., IN, US)"),
  zip: z.string().regex(/^\d{5,6}$/, "Pincode/Zip must be 5 or 6 digits"),
  phone: z
    .string()
    .regex(
      /^\+\d{1,3}\d{7,15}$/,
      "Phone must be in E.164 format (e.g., +919876543210)"
    ),
  company: z.string().optional(),
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
  const { addShopifyAddress } = useAddress();
  const { customerData } = useAuth();

  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      firstName: customerData?.customer.firstName || "",
      lastName: customerData?.customer.lastName || "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      zoneCode: "",
      territoryCode: "IN", // Default to India
      zip: "",
      phone: "+91", // Start with India country code
      company: "",
      isDefault: false,
    },
  });

  const onSubmit = async (data: AddressFormValues) => {
    setIsLoading(true);

    try {
      const shopifyAddressInput: CustomerAddressInput = {
        firstName: data.firstName,
        lastName: data.lastName,
        address1: data.addressLine1,
        address2: data.addressLine2 || null,
        city: data.city,
        zoneCode: data.zoneCode,
        territoryCode: data.territoryCode,
        zip: data.zip,
        phone: data.phone,
        company: data.company || null,
      };

      const newAddress = await addShopifyAddress(
        shopifyAddressInput,
        data.isDefault
      );
      if (newAddress) {
        toast.success("address added to shopify!", {
          description: "your new address has been saved successfully.",
          duration: 3000,
        });
        form.reset();
        onClose();
      } else {
        toast.error("failed to add address to shopify.", {
          description: "please try again.",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("Error adding address:", error);
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
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm lowercase tracking-widest text-black">
                        first name
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="first name"
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
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm lowercase tracking-widest text-black">
                        last name
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="last name"
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
                  name="zoneCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm lowercase tracking-widest text-black">
                        state code
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., MH, CA"
                          className="bg-white border-gray-300 text-black placeholder:text-gray-500 focus:border-black focus:ring-black/20 h-10 text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-600 text-sm" />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="territoryCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm lowercase tracking-widest text-black">
                        country code
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., IN, US"
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
                  name="zip"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm lowercase tracking-widest text-black">
                        pincode/zip
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="5-6 digits"
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
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm lowercase tracking-widest text-black">
                      phone number
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="+919876543210"
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
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm lowercase tracking-widest text-black">
                      company (optional)
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="company name"
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
