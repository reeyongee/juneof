// Profile completion utility functions for Shopify Customer Account API

export interface CustomerProfile {
  id: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  emailAddress?: { emailAddress: string };
  phoneNumber?: {
    phoneNumber: string;
  };
  defaultAddress?: {
    address1?: string;
    address2?: string;
    city?: string;
    province?: string;
    country?: string;
    zip?: string;
  };
  addresses?: Array<{
    id: string;
    address1?: string;
    address2?: string;
    city?: string;
    province?: string;
    country?: string;
    zip?: string;
    phoneNumber?: string;
  }>;
}

export interface ProfileCompletionStatus {
  isComplete: boolean;
  missingFields: {
    firstName: boolean;
    lastName: boolean;
    phoneNumber: boolean;
    completeAddress: boolean;
  };
  completionPercentage: number;
}

export interface AddressValidation {
  isValid: boolean;
  isCompleteAddress: boolean;
  missingFields: string[];
}

/**
 * Validates if an address is complete (not just country)
 */
export function validateAddress(
  address:
    | CustomerProfile["defaultAddress"]
    | NonNullable<CustomerProfile["addresses"]>[number]
): AddressValidation {
  if (!address) {
    return {
      isValid: false,
      isCompleteAddress: false,
      missingFields: ["address1", "city", "province", "zip"],
    };
  }

  const missingFields: string[] = [];

  if (!address.address1?.trim()) missingFields.push("address1");
  if (!address.city?.trim()) missingFields.push("city");
  if (!address.province?.trim()) missingFields.push("province");
  if (!address.zip?.trim()) missingFields.push("zip");

  // Consider an address complete if it has more than just country
  const isCompleteAddress = missingFields.length === 0;

  // An address is valid if it has at least address1 and city
  const isValid = address.address1?.trim() && address.city?.trim();

  return {
    isValid: Boolean(isValid),
    isCompleteAddress,
    missingFields,
  };
}

/**
 * Checks if customer has at least one complete address
 */
export function hasCompleteAddress(customer: CustomerProfile): boolean {
  // Check default address first
  if (customer.defaultAddress) {
    const defaultAddressValidation = validateAddress(customer.defaultAddress);
    if (defaultAddressValidation.isCompleteAddress) {
      return true;
    }
  }

  // Check all addresses
  if (customer.addresses && customer.addresses.length > 0) {
    return customer.addresses.some((address) => {
      const validation = validateAddress(address);
      return validation.isCompleteAddress;
    });
  }

  return false;
}

/**
 * Analyzes customer profile and returns completion status
 */
export function analyzeProfileCompletion(
  customer: CustomerProfile | null
): ProfileCompletionStatus {
  if (!customer) {
    return {
      isComplete: false,
      missingFields: {
        firstName: true,
        lastName: true,
        phoneNumber: true,
        completeAddress: true,
      },
      completionPercentage: 0,
    };
  }

  const missingFields = {
    firstName: !customer.firstName?.trim(),
    lastName: !customer.lastName?.trim(),
    phoneNumber: !customer.phoneNumber?.phoneNumber?.trim(),
    completeAddress: !hasCompleteAddress(customer),
  };

  const totalFields = 4;
  const completedFields = Object.values(missingFields).filter(
    (missing) => !missing
  ).length;
  const completionPercentage = Math.round(
    (completedFields / totalFields) * 100
  );

  const isComplete = completedFields === totalFields;

  return {
    isComplete,
    missingFields,
    completionPercentage,
  };
}

/**
 * Gets the next step in profile completion flow
 */
export function getNextCompletionStep(
  status: ProfileCompletionStatus
): "name" | "phone" | "address" | "complete" {
  if (status.missingFields.firstName || status.missingFields.lastName) {
    return "name";
  }

  if (status.missingFields.phoneNumber) {
    return "phone";
  }

  if (status.missingFields.completeAddress) {
    return "address";
  }

  return "complete";
}

/**
 * Validates phone number format (E.164 standard)
 */
export function validatePhoneNumber(phone: string): {
  isValid: boolean;
  message?: string;
} {
  if (!phone.trim()) {
    return { isValid: false, message: "Phone number is required" };
  }

  // Remove all non-digit characters except the leading +
  const cleanPhone = phone.replace(/[^\d+]/g, "");

  // Check if it starts with + (E.164 format requirement)
  if (!cleanPhone.startsWith("+")) {
    return {
      isValid: false,
      message: "Phone number must include country code (e.g., +91)",
    };
  }

  // For Indian numbers (+91), validate the format
  if (cleanPhone.startsWith("+91")) {
    // Indian mobile numbers: +91 followed by 10 digits
    const indianNumber = cleanPhone.substring(3); // Remove +91

    if (indianNumber.length !== 10) {
      return {
        isValid: false,
        message: "Indian mobile number must be 10 digits",
      };
    }

    // Indian mobile numbers start with 6, 7, 8, or 9
    if (!/^[6-9]/.test(indianNumber)) {
      return {
        isValid: false,
        message: "Indian mobile number must start with 6, 7, 8, or 9",
      };
    }

    return { isValid: true };
  }

  // General E.164 validation for other countries
  // E.164 format: + followed by up to 15 digits
  const phoneDigits = cleanPhone.substring(1); // Remove the +

  if (phoneDigits.length < 7 || phoneDigits.length > 15) {
    return {
      isValid: false,
      message: "Phone number must be between 7 and 15 digits",
    };
  }

  // Check if all characters after + are digits
  if (!/^\d+$/.test(phoneDigits)) {
    return {
      isValid: false,
      message: "Phone number can only contain digits after country code",
    };
  }

  return { isValid: true };
}

/**
 * Validates name fields
 */
export function validateName(
  name: string,
  fieldName: string
): { isValid: boolean; message?: string } {
  if (!name.trim()) {
    return { isValid: false, message: `${fieldName} is required` };
  }

  if (name.trim().length < 2) {
    return {
      isValid: false,
      message: `${fieldName} must be at least 2 characters`,
    };
  }

  return { isValid: true };
}

/**
 * Validates address form data
 */
export function validateAddressForm(address: {
  address1: string;
  address2?: string;
  city: string;
  province: string;
  zip: string;
  country: string;
}): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!address.address1?.trim()) {
    errors.address1 = "Address line 1 is required";
  }

  if (!address.city?.trim()) {
    errors.city = "City is required";
  }

  if (!address.province?.trim()) {
    errors.province = "State/Province is required";
  }

  if (!address.zip?.trim()) {
    errors.zip = "Postal/ZIP code is required";
  }

  if (!address.country?.trim()) {
    errors.country = "Country is required";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
