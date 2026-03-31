// SignInPage.jsx
import { SignIn } from "@clerk/clerk-react";
import { useSearchParams } from "react-router-dom";

export default function SignInPage() {
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <div className="w-full max-w-md mx-auto">
        <SignIn
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          redirectUrl={redirectUrl}
          afterSignInUrl={redirectUrl}
          appearance={{
            elements: {
              rootBox: "mx-auto w-full flex justify-center",
              card: "shadow-xl rounded-2xl border border-gray-200 p-6 bg-white",
              formButtonPrimary:
                "bg-blue-600 hover:bg-blue-700 text-sm normal-case font-medium py-3 px-6 rounded-lg transition duration-200 w-full",
              headerTitle: "text-xl font-semibold text-gray-900 text-center",
              headerSubtitle: "text-sm text-gray-600 text-center",
              socialButtonsBlockButton:
                "bg-white hover:bg-gray-50 text-gray-700 rounded-lg border border-gray-300 w-full py-3 px-4 transition duration-200",
              socialButtonsProviderIcon: "mr-3",
              footer: "hidden", // hides Clerk's default footer for a cleaner UI
              formFieldInput: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              formFieldLabel: "block text-sm font-medium text-gray-700 mb-1",
              formFieldRow: "mb-4",
              dividerLine: "bg-gray-300",
              dividerText: "text-gray-500 bg-white px-4",
            },
          }}
        />
      </div>
    </div>
  );
}
