"use client";

import {
  CustomerAccountApiClient,
  GraphQLOperation,
  GraphQLResponse,
  SupportedLanguage,
} from "./shopify-auth";

interface RequestTracker {
  startRequest: (source: string) => void;
  endRequest: (source: string) => void;
}

export class TrackedShopifyApiClient {
  private client: CustomerAccountApiClient;
  private requestTracker: RequestTracker;

  constructor(
    client: CustomerAccountApiClient,
    requestTracker: RequestTracker
  ) {
    this.client = client;
    this.requestTracker = requestTracker;
  }

  async query<T>(operation: GraphQLOperation): Promise<GraphQLResponse<T>> {
    const requestName = `shopify-${this.extractOperationName(operation.query)}`;

    try {
      this.requestTracker.startRequest(requestName);
      console.log(`TrackedShopifyApiClient: Starting request: ${requestName}`);

      const result = await this.client.query<T>(operation);

      console.log(`TrackedShopifyApiClient: Completed request: ${requestName}`);
      return result;
    } catch (error) {
      console.log(
        `TrackedShopifyApiClient: Failed request: ${requestName}`,
        error
      );
      throw error;
    } finally {
      this.requestTracker.endRequest(requestName);
    }
  }

  // Proxy other methods from the original client
  async localizedQuery<T>(
    operation: GraphQLOperation,
    language: SupportedLanguage
  ): Promise<GraphQLResponse<T>> {
    const requestName = `shopify-${this.extractOperationName(
      operation.query
    )}-localized`;

    try {
      this.requestTracker.startRequest(requestName);
      console.log(
        `TrackedShopifyApiClient: Starting localized request: ${requestName}`
      );

      const result = await this.client.localizedQuery<T>(operation, language);

      console.log(
        `TrackedShopifyApiClient: Completed localized request: ${requestName}`
      );
      return result;
    } catch (error) {
      console.log(
        `TrackedShopifyApiClient: Failed localized request: ${requestName}`,
        error
      );
      throw error;
    } finally {
      this.requestTracker.endRequest(requestName);
    }
  }

  async getCustomerProfile(
    language?: SupportedLanguage
  ): Promise<GraphQLResponse> {
    const requestName = "shopify-get-customer-profile";

    try {
      this.requestTracker.startRequest(requestName);
      console.log(`TrackedShopifyApiClient: Starting customer profile request`);

      const result = await this.client.getCustomerProfile(language);

      console.log(
        `TrackedShopifyApiClient: Completed customer profile request`
      );
      return result;
    } catch (error) {
      console.log(
        `TrackedShopifyApiClient: Failed customer profile request`,
        error
      );
      throw error;
    } finally {
      this.requestTracker.endRequest(requestName);
    }
  }

  updateAccessToken(accessToken: string): void {
    this.client.updateAccessToken(accessToken);
  }

  updateApiVersion(apiVersion: string): void {
    this.client.updateApiVersion(apiVersion);
  }

  private extractOperationName(query: string): string {
    // Extract operation name from GraphQL query
    const match = query.match(/(?:query|mutation)\s+(\w+)/);
    if (match) {
      return match[1].toLowerCase();
    }

    // Fallback: try to extract from first word after query/mutation
    const fallbackMatch = query.match(/(?:query|mutation)\s*\{\s*(\w+)/);
    if (fallbackMatch) {
      return fallbackMatch[1].toLowerCase();
    }

    // Last resort
    return "unknown-operation";
  }
}
