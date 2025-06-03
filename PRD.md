🧩 Project Requirements Document (PRD) - V2
Title: Full-Stack Authentication & User Profile System for Headless Shopify Site with NextAuth
Stack: Next.js (Turbopack, hosted on Vercel) + NextAuth.js + Shopify Storefront API
Constraints: Using Shopify Basic (no Shopify Plus), no custom backend server/database beyond Next.js API routes.

🎯 Goal
To transition the current client-side mocked authentication and profile system to a secure, persistent, server-validated authentication system using NextAuth.js. This involves leveraging Shopify Storefront API for customer account management and data retrieval, with JWT-based sessions stored in HTTP-only cookies. The outcome will be a production-ready auth flow and user dashboard.

🧠 Philosophy & Approach
We will migrate from the current UI-first, mock-data implementation to a full-stack solution in well-defined, incremental stages. Each stage will focus on a specific layer of the authentication and data flow, ensuring testability and clear progress. The primary goal is to replace client-side mocks with robust, server-managed NextAuth sessions interacting with Shopify as the SSoT for customer data.

🔢 Step-by-Step Implementation Plan
Phase I: NextAuth Core Setup & Initial Configuration
Objective: Establish the foundational NextAuth.js setup within the Next.js project.

Step 1: Install NextAuth.js Package
Objective: Add NextAuth.js as a project dependency.
Key Tasks:
Run npm install next-auth or yarn add next-auth.
Verify installation in package.json and package-lock.json.
Relevant Files: package.json, package-lock.json.
Acceptance Criteria: NextAuth.js is successfully installed and listed in dependencies.
Step 2: Create the NextAuth API Route ([...nextauth].ts)
Objective: Define the main API endpoint that NextAuth will use to handle all authentication requests.
Key Tasks:
Create a new file at src/app/api/auth/[...nextauth]/route.ts (using App Router convention).
Import NextAuth from next-auth.
Define a basic authOptions object.
Export GET and POST handlers assigning them to NextAuth(authOptions).
Relevant Files: src/app/api/auth/[...nextauth]/route.ts.
Acceptance Criteria: The API route is created and accessible (e.g., /api/auth/session should return a basic response, possibly empty if no providers are configured yet).
Step 3: Configure Environment Variables for NextAuth
Objective: Set up necessary secret and URL for NextAuth to function correctly, especially in production.
Key Tasks:
Generate a strong secret key for NEXTAUTH_SECRET. This can be done using openssl rand -base64 32 or an online generator.
Add NEXTAUTH_SECRET to .env.local.
Add NEXTAUTH_URL="http://localhost:3000" (for local development) to .env.local. This will be updated for Vercel deployment later.
Ensure these variables are documented for deployment.
Relevant Files: .env.local, Vercel environment variable settings (later).
Acceptance Criteria: NextAuth initializes without warnings about missing NEXTAUTH_SECRET.
Step 4: Implement SessionProvider for Client-Side Session Access
Objective: Wrap the application with NextAuth's SessionProvider to make session data available to client components via useSession.
Key Tasks:
Modify src/app/components/ClientLayout.tsx (or src/app/layout.tsx if creating a new top-level provider component).
Import SessionProvider from next-auth/react.
Wrap the main application content (likely around the AuthProvider or its children) with <SessionProvider>.
Relevant Files: src/app/components/ClientLayout.tsx or a new AuthProvider wrapper.
Acceptance Criteria: The application is wrapped with SessionProvider. useSession hook can be called in client components without error (though it will return unauthenticated state initially).
Phase II: Shopify Customer Account Creation (Registration)
Objective: Integrate the registration UI with NextAuth to create customer accounts in Shopify.

Step 5: Define Shopify customerCreate Credentials Provider
Objective: Configure a NextAuth Credentials provider to handle new user registration by calling Shopify's customerCreate mutation.
Key Tasks:
In [...nextauth]/route.ts, add a CredentialsProvider to authOptions.providers.
Name this provider distinctively (e.g., id: "shopify-register").
Implement the authorize function for this provider:
It will receive name, email, and password from the registration form.
Call the customerCreate mutation from src/lib/shopify.ts.
Do not create a session here yet; registration success will lead to an automatic login step.
Relevant Files: src/app/api/auth/[...nextauth]/route.ts, src/lib/shopify.ts (for customerCreate mutation).
Acceptance Criteria: The "shopify-register" Credentials provider is configured in NextAuth.
Step 6: Implement Shopify customerAccessTokenCreate for Post-Registration Login
Objective: After successful customer creation, automatically log the user in by creating a Shopify customer access token. This can be part of the "register" provider's logic or a separate step. For simplicity, we'll try to chain it.
Key Tasks:
Modify the "shopify-register" CredentialsProvider's authorize function:
If customerCreate is successful and returns a customer object (or no user errors), proceed to call customerAccessTokenCreate using the newly registered email and provided password.
The customerAccessTokenCreate mutation is already in src/lib/shopify.ts.
If customerAccessTokenCreate is successful, return an object containing user details (e.g., email, Shopify customer ID, Shopify customer access token, and its expiry). This object will be used by NextAuth to create the session token.
Relevant Files: src/app/api/auth/[...nextauth]/route.ts.
Acceptance Criteria: Successful registration in Shopify also results in Shopify returning a customer access token.
Step 7: Handle Errors from Shopify customerCreate and customerAccessTokenCreate
Objective: Provide appropriate error feedback if Shopify registration or token creation fails.
Key Tasks:
In the authorize function of the "shopify-register" provider:
Check customerUserErrors from customerCreate response. If errors exist (e.g., email taken), throw an error or return null to NextAuth, which will be passed to the client.
Similarly, check for errors from customerAccessTokenCreate.
The error messages should be specific enough for the client to display informative feedback.
Relevant Files: src/app/api/auth/[...nextauth]/route.ts.
Acceptance Criteria: Shopify API errors during registration are caught and propagated correctly by NextAuth.
Step 8: Integrate /register Page with NextAuth signIn for Registration
Objective: Update the frontend registration form to use NextAuth's signIn function to trigger the "shopify-register" provider.
Key Tasks:
In src/app/register/page.tsx:
Import signIn from next-auth/react.
In the onSubmit handler, instead of the mock API call, invoke await signIn("shopify-register", { redirect: false, email, password, name }).
Handle the response from signIn:
If response.ok is true, registration and auto-login were successful. Redirect to /dashboard.
If response.error exists, display an appropriate error message (e.g., using toast and form.setError).
Relevant Files: src/app/register/page.tsx.
Acceptance Criteria: Users can register through the UI. Successful registration creates a Shopify customer, logs them in via NextAuth, and redirects to /dashboard. Errors are displayed.
Phase III: Shopify Customer Login (Sign-In)
Objective: Enable existing Shopify customers to log in using their credentials via NextAuth.

Step 9: Define Shopify customerAccessTokenCreate Credentials Provider for Login
Objective: Configure a separate NextAuth Credentials provider specifically for handling user login.
Key Tasks:
In [...nextauth]/route.ts, add another CredentialsProvider.
Name this provider distinctively (e.g., id: "shopify-login").
Implement its authorize function:
It will receive email and password from the login form.
Call the customerAccessTokenCreate mutation from src/lib/shopify.ts.
If successful, extract the accessToken and expiresAt (and potentially customer ID if available or fetch separately).
Return an object with user details: email, shopifyCustomerId (if available/fetched), shopifyCustomerAccessToken, shopifyTokenExpiresAt.
Relevant Files: src/app/api/auth/[...nextauth]/route.ts, src/lib/shopify.ts.
Acceptance Criteria: The "shopify-login" Credentials provider is configured and can process login attempts.
Step 10: Handle Errors from Shopify customerAccessTokenCreate during Login
Objective: Provide feedback for failed login attempts (e.g., invalid credentials).
Key Tasks:
In the authorize function of the "shopify-login" provider:
Check customerUserErrors from the customerAccessTokenCreate response.
If errors indicate invalid credentials or other issues, throw an error or return null.
Relevant Files: src/app/api/auth/[...nextauth]/route.ts.
Acceptance Criteria: Shopify API errors during login are caught and propagated.
Step 11: Integrate /signin Page with NextAuth signIn for Login
Objective: Update the frontend login form to use NextAuth's signIn function with the "shopify-login" provider.
Key Tasks:
In src/app/signin/page.tsx:
Import signIn from next-auth/react.
In the onSubmit handler, replace the dummy credential check with await signIn("shopify-login", { redirect: false, email, password }).
Handle the response:
If response.ok, login successful. The existing signIn call in AuthContext will now reflect NextAuth's state. Redirect to /dashboard.
If response.error, display an error message.
Relevant Files: src/app/signin/page.tsx.
Acceptance Criteria: Users can log in with valid Shopify credentials. Session is established via NextAuth. Errors are shown for invalid attempts.
Phase IV: JWT and Session Configuration in NextAuth
Objective: Configure NextAuth to use JWTs for session management and customize the session token and client-side session object.

Step 12: Configure NextAuth Session Strategy to JWT
Objective: Explicitly set NextAuth to use JSON Web Tokens for session management.
Key Tasks:
In authOptions within [...nextauth]/route.ts, set session: { strategy: "jwt" }.
Define JWT signing and encryption keys/secrets (NextAuth uses NEXTAUTH_SECRET for this by default).
Relevant Files: src/app/api/auth/[...nextauth]/route.ts.
Acceptance Criteria: NextAuth uses JWTs for sessions, storing them in cookies.
Step 13: Implement the jwt Callback
Objective: Customize the JWT payload to include essential Shopify-related information.
Key Tasks:
In authOptions.callbacks, define the jwt({ token, user, account }) callback.
On initial sign-in (user and account objects are present):
If account.provider is "shopify-login" or "shopify-register", take the shopifyCustomerAccessToken, shopifyTokenExpiresAt, and shopifyCustomerId (if available from the user object returned by authorize) and add them to the token object.
On subsequent calls (only token is present):
Return the existing token. (NextAuth handles JWT expiration checks based on its own exp).
(Advanced: Consider Shopify token expiration and refresh if Shopify tokens are short-lived and a refresh mechanism exists via Storefront API, though typically customer access tokens are long-lived or tied to session cookie). For now, assume Shopify token lasts as long as JWT.
Relevant Files: src/app/api/auth/[...nextauth]/route.ts.
Acceptance Criteria: The JWT contains shopifyCustomerAccessToken and other necessary Shopify data.
Step 14: Implement the session Callback
Objective: Expose the Shopify customer access token and other relevant data from the JWT to the client-side session object obtained via useSession.
Key Tasks:
In authOptions.callbacks, define the session({ session, token }) callback.
Copy shopifyCustomerAccessToken, shopifyCustomerId, and user email from the token (populated by the jwt callback) to the session.user object.
Ensure the session.user object has a defined type/interface for better TypeScript support.
Relevant Files: src/app/api/auth/[...nextauth]/route.ts.
Acceptance Criteria: useSession() hook returns a session object containing the shopifyCustomerAccessToken and customer ID.
Phase V: Client-Side Auth State & UI Integration
Objective: Refactor existing client-side authentication context and UI components to use NextAuth's session state.

Step 15: Refactor AuthContext to Utilize useSession
Objective: Replace the mock authentication logic in AuthContext with NextAuth's useSession hook.
Key Tasks:
In src/context/AuthContext.tsx:
Remove useState for isSignedIn and userEmail.
Use const { data: session, status } = useSession();.
isSignedIn becomes status === "authenticated".
userEmail becomes session?.user?.email.
The signIn function in the context should now call NextAuth's signIn() (e.g., for social providers if added later, or to trigger custom flows). For credential-based login, pages will call signIn() directly.
The signOut function in the context should call NextAuth's signOut().
Key Considerations: The primary purpose of AuthContext might shift to being a convenience wrapper around useSession or could be deprecated if useSession is used directly in components. For now, adapt it.
Relevant Files: src/context/AuthContext.tsx.
Acceptance Criteria: AuthContext correctly reflects the authentication state managed by NextAuth.
Step 16: Update UI Components to Reflect NextAuth State
Objective: Ensure components like Navbar correctly display user state (e.g., "Sign In" vs. user profile/dashboard link, user name) based on the NextAuth session.
Key Tasks:
Review src/app/components/Navbar.tsx and any other components relying on useAuth().
Ensure they correctly consume the updated AuthContext or switch to using useSession() directly.
Verify conditional rendering for authenticated/unauthenticated states.
Relevant Files: src/app/components/Navbar.tsx, src/app/components/CartOverlay.tsx.
Acceptance Criteria: UI elements accurately reflect the user's authentication status.
Phase VI: Implementing Logout
Objective: Provide a secure way for users to sign out, terminating their session.

Step 17: Implement Client-Side Logout Trigger
Objective: Add a logout button/link in the UI that calls NextAuth's signOut function.
Key Tasks:
In Navbar.tsx (profile dropdown) or /dashboard page, add a "Sign Out" button.
On click, call signOut() from next-auth/react.
Configure signOut({ callbackUrl: "/signin" }) to redirect the user to the sign-in page after logout.
Relevant Files: src/app/components/Navbar.tsx, src/app/dashboard/page.tsx.
Acceptance Criteria: Clicking "Sign Out" successfully clears the NextAuth session and redirects the user.
Step 18: Server-Side Session Invalidation (Cookie Removal)
Objective: Ensure NextAuth correctly handles the removal of session cookies upon logout.
Key Tasks:
This is largely handled by NextAuth's signOut() function.
Verify that session cookies (e.g., next-auth.session-token or \_\_Secure-next-auth.session-token) are cleared from the browser after logout.
Key Considerations: Shopify customer access tokens are typically bearer tokens and don't have a direct server-side invalidation mechanism via Storefront API. Session termination relies on clearing the JWT cookie containing this token.
Relevant Files: Browser developer tools (for cookie inspection).
Acceptance Criteria: Session cookies are removed on logout. Subsequent requests to protected routes require re-authentication.
Phase VII: Route Protection and Server-Side Redirection Logic
Objective: Secure protected routes and manage redirection for authenticated/unauthenticated users.

Step 19: Protect /dashboard Page (Server-Side)
Objective: Ensure only authenticated users can access the /dashboard (profile) page.
Key Tasks:
Since /dashboard/page.tsx is a Client Component ("use client"), route protection ideally happens in a parent Server Component, middleware, or a dedicated route handler that wraps it.
Option 1 (Middleware): Create src/middleware.ts. Use getToken from next-auth/jwt or getServerSession (if using helper for edge) to check auth state. If unauthenticated, redirect to /signin.
Option 2 (Higher-Order Component / Layout Server Component): If using a Server Component layout for /dashboard, perform the check there using getServerSession(authOptions).
For this PRD, we'll assume a check within the page's getServerSideProps equivalent if it were a Pages Router, or a similar pattern for App Router (e.g., a Server Component wrapper or middleware). The current /dashboard/page.tsx uses useEffect for redirection, which is client-side and not secure. This needs to be server-side.
Revised Task for App Router: If /dashboard/page.tsx remains a client component, protection must occur at a higher level. A simple way is to make the page.tsx itself a server component that fetches the session and conditionally renders the client component or redirects.
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path
import { redirect } from "next/navigation";
import DashboardClientPage from "./DashboardClientPage"; // Assume current content moved here

export default async function DashboardPage() {
const session = await getServerSession(authOptions);
if (!session) {
redirect("/signin");
}
return <DashboardClientPage session={session} />; // Pass session if needed
}
Use code with caution.
Typescript // src/app/dashboard/page.tsx (as Server Component)
Then move existing /dashboard/page.tsx content to DashboardClientPage.tsx.
Relevant Files: src/app/dashboard/page.tsx (to be refactored), potentially src/middleware.ts.
Acceptance Criteria: Unauthenticated users attempting to access /dashboard are redirected to /signin.
Step 20: Implement Redirection for /signin and /register Pages
Objective: Prevent authenticated users from accessing the sign-in and registration pages.
Key Tasks:
Similar to Step 19, for src/app/signin/page.tsx and src/app/register/page.tsx, make them Server Components that check for an active session.
If getServerSession(authOptions) returns an active session, redirect the user to /dashboard.
Otherwise, render the sign-in/register client component.
Relevant Files: src/app/signin/page.tsx, src/app/register/page.tsx (to be refactored).
Acceptance Criteria: Authenticated users are redirected from /signin and /register to /dashboard.
Phase VIII: Fetching and Displaying Shopify Customer Data on Profile Page
Objective: Populate the user dashboard/profile page with actual customer data fetched from Shopify.

Step 21: Create Shopify Query for Customer Details
Objective: Define a GraphQL query to fetch customer information using their access token.
Key Tasks:
In src/lib/shopify.ts, add a new query string, e.g., GET_CUSTOMER_INFO_QUERY.
This query should accept customerAccessToken as a variable.
It should request fields like firstName, lastName, email, phone, defaultAddress { id, address1, city, etc. }.
Define corresponding TypeScript interfaces for the query response.
// Example GET_CUSTOMER_INFO_QUERY
query GetCustomerInfo($customerAccessToken: String!) {
customer(customerAccessToken: $customerAccessToken) {
id
firstName
lastName
email
phone
defaultAddress {
id
address1
address2
city
province
country
zip
phone
}
// Potentially addresses(first: 10) { edges { node { ... } } }
// but Storefront API for addresses is limited without Customer Account API
}
}
Use code with caution.
Graphql
Relevant Files: src/lib/shopify.ts.
Acceptance Criteria: GET_CUSTOMER_INFO_QUERY is defined and typed.
Step 22: Fetch and Display Customer Information on /dashboard
Objective: Use the Shopify customer access token from the NextAuth session to fetch and display user details.
Key Tasks:
In the server component part of /dashboard (or in an API route called by the client component if preferred, though direct server component fetch is better for RSC):
Retrieve session.user.shopifyCustomerAccessToken.
Call storefrontApiRequest with GET_CUSTOMER_INFO_QUERY and the token.
Pass the fetched customer data to the DashboardClientPage component.
Update DashboardClientPage.tsx to display the real first name, last name, email, and phone.
Handle loading states (e.g., shimmer/skeleton UI) and error states (e.g., "Could not load profile").
Relevant Files: src/app/dashboard/page.tsx (server part), src/app/dashboard/DashboardClientPage.tsx, src/lib/shopify.ts.
Acceptance Criteria: The dashboard displays the authenticated user's actual profile information fetched from Shopify.
Phase IX: Fetching and Displaying Shopify Order History
Objective: Show a list of the customer's recent orders on their dashboard.

Step 23: Create Shopify Query for Customer Orders
Objective: Define a GraphQL query to fetch a customer's order history.
Key Tasks:
In src/lib/shopify.ts, add GET_CUSTOMER_ORDERS_QUERY.
This query uses customerAccessToken.
It should fetch orders(first: N, sortKey: PROCESSED_AT, reverse: true) and include id, orderNumber, processedAt, totalPriceV2 { amount, currencyCode }, fulfillmentStatus, and potentially lineItems(first: M) for a summary.
Define TypeScript interfaces for the order data.
Relevant Files: src/lib/shopify.ts.
Acceptance Criteria: GET_CUSTOMER_ORDERS_QUERY is defined and typed.
Step 24: Fetch and Display Order History on /dashboard
Objective: Display a list of recent orders for the authenticated user.
Key Tasks:
In the server component part of /dashboard, fetch order data using the shopifyCustomerAccessToken and GET_CUSTOMER_ORDERS_QUERY.
Pass the order data to DashboardClientPage.tsx.
Update DashboardClientPage.tsx in the "Orders" section to render the list of orders, displaying key details.
Handle cases where there are no orders.
Relevant Files: src/app/dashboard/page.tsx (server part), src/app/dashboard/DashboardClientPage.tsx, src/lib/shopify.ts.
Acceptance Criteria: User's recent orders are displayed on the dashboard. "No orders yet" message shows if applicable.
Phase X: Address Management – Syncing Default Address with Shopify
Objective: Allow users to manage their addresses, focusing on syncing the default address with Shopify, given Shopify Basic limitations. Other addresses will remain client-side managed for now.

Step 25: Review Shopify customerUpdate Mutation for Default Address
Objective: Understand how to update a customer's default shipping address in Shopify using the Storefront API.
Key Tasks:
Examine the customerUpdate mutation in Shopify Storefront API documentation.
Identify the input structure for updating defaultAddress (it usually takes an MailingAddressInput!).
Ensure src/lib/shopify.ts has this mutation defined or add it.
// Example CUSTOMER_UPDATE_DEFAULT_ADDRESS_MUTATION
mutation customerUpdateDefaultAddress($customerAccessToken: String!, $address: MailingAddressInput!) {
customerUpdate(customerAccessToken: $customerAccessToken, customer: {defaultAddress: $address}) {
customer {
id
defaultAddress {
id
// ... other address fields
}
}
customerUserErrors {
field
message
code
}
}
}
Use code with caution.
Graphql
Relevant Files: Shopify Storefront API docs, src/lib/shopify.ts.
Acceptance Criteria: Clear understanding of how to update the default address in Shopify.
Step 26: Integrate "Set as Default" with Shopify customerUpdate
Objective: When a user sets an address as default in the UI, update this in Shopify.
Key Tasks:
In src/context/AddressContext.tsx, modify the setAsDefault function:
It should now be an async function.
After updating local state, retrieve the shopifyCustomerAccessToken (this context might need access to the auth session or the token needs to be passed in).
Prepare the MailingAddressInput object from the selected address.
Call the customerUpdate mutation via storefrontApiRequest.
Handle API success and errors (e.g., using toast).
Key Consideration: How AddressContext gets the shopifyCustomerAccessToken. It might need to use useSession itself or have the token passed from components.
Relevant Files: src/context/AddressContext.tsx, src/app/dashboard/DashboardClientPage.tsx.
Acceptance Criteria: Setting an address as default in the UI updates the default address in Shopify.
Step 27: Sync Shopify Default Address on Profile Load
Objective: Ensure the UI (AddressContext) reflects Shopify's default address when the dashboard loads.
Key Tasks:
When fetching customer info in Step 22 (GET_CUSTOMER_INFO_QUERY), ensure defaultAddress is fetched from Shopify.
In DashboardClientPage.tsx, after receiving customer data (including Shopify's defaultAddress), reconcile this with the addresses in AddressContext.
If Shopify's defaultAddress (identified by its Shopify ID if available, or by matching fields) differs from what AddressContext considers default, update AddressContext state to reflect Shopify's truth for the default.
Relevant Files: src/app/dashboard/DashboardClientPage.tsx, src/context/AddressContext.tsx.
Acceptance Criteria: The "default" flag in the UI accurately reflects the default address set in Shopify.
Step 28: Refine AddAddressOverlay and AddressSelectionOverlay for Default Address Sync
Objective: Ensure adding a new default address or selecting an address considers Shopify sync.
Key Tasks:
When a new address is added via AddAddressOverlay and marked as "default":
The addAddress function in AddressContext should trigger the customerUpdate mutation if the newly added address is set to default.
AddressSelectionOverlay continues to use AddressContext. The selection itself doesn't directly call Shopify unless it's about changing the default.
Key Consideration: The current AddAddressOverlay is fully client-side. Adding a new address won't give it a Shopify address ID immediately. The customerUpdate for default address would create/update it in Shopify. This flow needs to be smooth. A new address set as default will effectively become the Shopify default address.
Relevant Files: src/app/components/AddAddressOverlay.tsx, src/context/AddressContext.tsx.
Acceptance Criteria: Adding/selecting a default address updates Shopify.
Phase XI: UI/UX Enhancements, Error Handling, and Final Polish
Objective: Improve user experience with loading states, detailed error messages, and consistent UI feedback.

Step 29: Implement Comprehensive Loading States
Objective: Provide visual feedback during asynchronous operations.
Key Tasks:
Use the isLoading state in /signin, /register, and /dashboard pages.
Disable submit buttons and show loading text (e.g., "Signing in...", "Creating account...", "Loading profile...") during API calls.
Consider skeleton loaders for profile data and order history sections.
Relevant Files: src/app/signin/page.tsx, src/app/register/page.tsx, src/app/dashboard/DashboardClientPage.tsx.
Acceptance Criteria: UI provides clear feedback during loading/pending states.
Step 30: Refine Form Validation and Error Display
Objective: Ensure all forms have robust client-side validation and user-friendly error messages.
Key Tasks:
Review Zod schemas in /signin, /register, and AddAddressOverlay for completeness.
Ensure FormMessage components correctly display errors from react-hook-form.
Style error messages for clarity and accessibility.
Relevant Files: src/app/signin/page.tsx, src/app/register/page.tsx, src/app/components/AddAddressOverlay.tsx.
Acceptance Criteria: Forms provide clear, inline validation errors.
Step 31: Consistent Toast Notifications
Objective: Use sonner toasts for all important user feedback (success, error, info).
Key Tasks:
Implement toasts for:
Successful login/registration.
Failed login/registration (Shopify API errors, NextAuth errors).
Profile data fetch errors.
Order history fetch errors.
Address operation success/errors (add, set default, delete).
Ensure toast messages are informative and user-friendly.
Relevant Files: All pages/components performing async operations.
Acceptance Criteria: Consistent and helpful toast notifications are used throughout the auth and profile flows.
Phase XII: Security, Comprehensive Testing, and Deployment Preparation
Objective: Harden security, perform thorough testing, and prepare for Vercel deployment.

Step 32: Review NextAuth Cookie Security Settings
Objective: Ensure session cookies are configured securely.
Key Tasks:
In authOptions, review and configure cookie options:
cookies.sessionToken.options.httpOnly = true
cookies.sessionToken.options.secure = process.env.NODE_ENV === "production"
cookies.sessionToken.options.sameSite = "lax"
Understand the implications of these settings.
Relevant Files: src/app/api/auth/[...nextauth]/route.ts.
Acceptance Criteria: Session cookies use appropriate security flags.
Step 33: End-to-End Testing of All Authentication and Profile Flows
Objective: Verify all implemented features work correctly together.
Key Tasks:
Test user registration (new Shopify customer).
Test login with existing Shopify customer credentials.
Test logout and session termination.
Verify session persistence across browser refreshes/restarts.
Test route protection for /dashboard and redirection for /signin, /register.
Verify correct display of profile information and order history.
Test "Set as Default" address functionality and its sync with Shopify.
Test error handling for all API interactions and form submissions.
Test on multiple browsers and device sizes (responsive check).
Relevant Files: Entire application.
Acceptance Criteria: All auth and profile features function as expected under various scenarios.
Step 34: Prepare Vercel Deployment Environment Variables
Objective: Configure all necessary environment variables for a successful Vercel deployment.
Key Tasks:
Ensure NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN and NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN are set in Vercel project settings.
Set NEXTAUTH_SECRET in Vercel (must match local).
Set NEXTAUTH_URL to the Vercel deployment's canonical URL (e.g., https://your-project.vercel.app).
Relevant Files: Vercel project settings.
Acceptance Criteria: All required environment variables are correctly configured in the Vercel deployment environment.
Step 35: Final Code Review, Cleanup, and Documentation
Objective: Ensure code quality, remove dead code/mocks, and document complex parts.
Key Tasks:
Review all new and modified code for clarity, efficiency, and security.
Remove any remaining mock data or client-side auth logic that has been replaced.
Add comments to complex sections of code, especially in NextAuth configuration and Shopify API interactions.
Update README.md if necessary with new setup instructions or notes.
Relevant Files: Entire codebase.
Acceptance Criteria: Codebase is clean, well-documented, and ready for production.
📄 Final Feature Summary (Post-Implementation)
Feature Status Key Technologies
Basic Pages (Login, Register, Dashboard) Implemented Next.js
User Registration via Shopify To Be Done NextAuth, Shopify customerCreate
User Login via Shopify To Be Done NextAuth, Shopify customerAccessTokenCreate
JWT-based Session Management To Be Done NextAuth (JWT Strategy)
HTTP-only Secure Cookie for Session To Be Done NextAuth
Route Protection (Server-Side) To Be Done NextAuth, Next.js Middleware/RSC
Redirection for Authenticated/Unauthenticated Users To Be Done NextAuth, Next.js Middleware/RSC
Display Real Customer Profile Info from Shopify To Be Done NextAuth, Shopify customer query
Display Customer Order History from Shopify To Be Done NextAuth, Shopify customer query
Default Address Sync with Shopify To Be Done NextAuth, Shopify customerUpdate
Client-Side Multiple Address Management (UI only) Implemented React Context
UI Styling, Form Validation, Toasts, Loading States Partially Done Tailwind CSS, Zod, Sonner, GSAP
🛠️ Updated Technical Stack Summary
Layer Tool / Service Notes
Frontend Framework Next.js (App Router, Turbopack)
Authentication NextAuth.js Handles session, JWTs, provider logic
Customer API Shopify Storefront GraphQL API For customer creation, login, data retrieval
Session Storage JWT in HTTP-only secure cookies Managed by NextAuth
UI Styling Tailwind CSS, shadcn/ui components Existing styling foundation
Form Management React Hook Form + Zod For validation
UI Feedback Sonner (Toasts) For notifications
Animations GSAP For UI transitions/effects
Hosting Vercel
No Extra Backend No Custom DB or Separate Server Required Leverages Next.js API routes (for NextAuth) and Shopify's backend.
🧪 Updated Testing Recommendations
Expand on existing tests with a focus on NextAuth and Shopify integration:

Test Case Expected Behavior
Registration
Register new valid user Shopify customer created, NextAuth session established, redirected to /dashboard.
Register with existing email Error message from Shopify (via NextAuth) displayed on /register page. No new customer, no session.
Register with invalid password format Client-side Zod validation error displayed.
Login
Login with valid Shopify credentials NextAuth session established, redirected to /dashboard.
Login with invalid Shopify credentials Error message from Shopify (via NextAuth) displayed on /signin page. No session.
Login with non-existent email Error message displayed.
Session Management
Access /dashboard while logged out Redirected to /signin.
Access /signin or /register while logged in Redirected to /dashboard.
Refresh page while on /dashboard (logged in) Session persists, user remains on /dashboard and authenticated.
Close and reopen browser (session active) Session persists (if cookie is not session-only and hasn't expired).
Logout
Click "Sign Out" NextAuth session cleared, session cookies removed, redirected to /signin.
Access /dashboard after logout Redirected to /signin.
Profile Data (/dashboard)
View profile after login Correct customer name, email, phone (from Shopify) displayed.
View order history Correct recent orders (from Shopify) displayed, or "No orders" message.
Set an address as default UI updates, toast success, default address updated in Shopify (verify via API or subsequent profile load).
Add new address and set as default Address added to client list, Shopify default address updated.
Error Handling
Shopify API temporarily unavailable during login/register Graceful error message displayed to user (e.g., "Service temporarily unavailable").
Network interruption during profile data load Loading state persists or an error message is shown.
🏁 Final Outcome
A fully functional, secure, and user-friendly authentication and profile management system for the headless Shopify store, built entirely within the Next.js/Vercel ecosystem using NextAuth.js and the Shopify Storefront API. This system will replace the current client-side mocks, providing a persistent and robust experience for users.
