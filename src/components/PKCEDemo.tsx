"use client";

import { useState } from "react";
import {
  generateCodeVerifier,
  generateCodeChallenge,
} from "@/lib/shopify-auth";

export default function PKCEDemo() {
  const [codeVerifier, setCodeVerifier] = useState<string>("");
  const [codeChallenge, setCodeChallenge] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePKCE = async () => {
    setIsGenerating(true);
    try {
      // Generate code verifier
      const verifier = await generateCodeVerifier();
      setCodeVerifier(verifier);

      // Generate code challenge from verifier
      const challenge = await generateCodeChallenge(verifier);
      setCodeChallenge(challenge);
    } catch (error) {
      console.error("Error generating PKCE:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const clearValues = () => {
    setCodeVerifier("");
    setCodeChallenge("");
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-center">
        PKCE Code Challenge & Verifier Demo
      </h2>

      <div className="mb-6">
        <p className="text-sm text-gray-600 mb-4">
          This demonstrates Shopify's recommended implementation for generating
          PKCE (Proof Key for Code Exchange) parameters used in OAuth 2.0 for
          public clients.
        </p>

        <div className="bg-blue-50 p-4 rounded-lg mb-4">
          <h3 className="font-semibold text-blue-800 mb-2">How PKCE Works:</h3>
          <ol className="text-sm text-blue-700 list-decimal list-inside space-y-1">
            <li>
              Generate a random <strong>code verifier</strong> (43-128
              characters)
            </li>
            <li>
              Create a <strong>code challenge</strong> by SHA256 hashing the
              verifier
            </li>
            <li>
              Send the challenge (not verifier) in the authorization request
            </li>
            <li>Send the verifier in the token exchange request</li>
            <li>
              Server verifies that SHA256(verifier) equals the original
              challenge
            </li>
          </ol>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex space-x-4">
          <button
            onClick={generatePKCE}
            disabled={isGenerating}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? "Generating..." : "Generate PKCE Parameters"}
          </button>

          <button
            onClick={clearValues}
            disabled={isGenerating || (!codeVerifier && !codeChallenge)}
            className="flex-1 bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Clear
          </button>
        </div>

        {codeVerifier && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2">
                🔑 Code Verifier
              </h3>
              <p className="text-xs text-green-600 mb-2">
                Random string stored securely on client, sent during token
                exchange
              </p>
              <div className="bg-white p-3 rounded border font-mono text-sm break-all">
                {codeVerifier}
              </div>
              <div className="mt-2 text-xs text-green-600">
                Length: {codeVerifier.length} characters
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-semibold text-purple-800 mb-2">
                🛡️ Code Challenge
              </h3>
              <p className="text-xs text-purple-600 mb-2">
                SHA256 hash of verifier, sent in authorization request
              </p>
              <div className="bg-white p-3 rounded border font-mono text-sm break-all">
                {codeChallenge}
              </div>
              <div className="mt-2 text-xs text-purple-600">
                Length: {codeChallenge.length} characters | Method: S256
              </div>
            </div>
          </div>
        )}

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-2">
            Implementation Details
          </h3>
          <div className="text-sm text-gray-600 space-y-2">
            <div>
              <strong>Code Verifier Generation:</strong>
              <pre className="mt-1 bg-white p-2 rounded text-xs overflow-x-auto">
                {`const array = new Uint8Array(32);
crypto.getRandomValues(array);
const rando = String.fromCharCode.apply(null, Array.from(array));
return base64UrlEncode(rando);`}
              </pre>
            </div>

            <div>
              <strong>Code Challenge Generation:</strong>
              <pre className="mt-1 bg-white p-2 rounded text-xs overflow-x-auto">
                {`const digestOp = await crypto.subtle.digest(
  { name: "SHA-256" },
  new TextEncoder().encode(codeVerifier)
);
const hash = convertBufferToString(digestOp);
return base64UrlEncode(hash);`}
              </pre>
            </div>

            <div>
              <strong>Base64URL Encoding:</strong>
              <pre className="mt-1 bg-white p-2 rounded text-xs overflow-x-auto">
                {`const base64 = btoa(str);
return base64.replace(/\\+/g, "-").replace(/\\//g, "_").replace(/=/g, "");`}
              </pre>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">
            ⚠️ Security Notes
          </h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>
              • The code verifier must be stored securely and never exposed in
              URLs
            </li>
            <li>
              • Only the code challenge is sent in the authorization request
            </li>
            <li>
              • The verifier is only sent during the secure token exchange
            </li>
            <li>• This prevents authorization code interception attacks</li>
            <li>
              • Each authorization request should use a new verifier/challenge
              pair
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
