// UserProfilePage.jsx
import { UserProfile } from "@clerk/clerk-react";

export default function UserProfilePage() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <div className="w-full max-w-2xl">
        <UserProfile
          path="/user-profile"
          routing="path"
          appearance={{
            elements: {
              rootBox: "mx-auto w-full flex justify-center",
              card: "shadow-xl rounded-2xl border border-gray-200 p-4",
              headerTitle: "text-xl font-semibold text-gray-900",
              headerSubtitle: "text-sm text-gray-600",
              navbar: "hidden", // hides left sidebar, keeps it minimal
              profileSectionTitleText: "text-lg font-medium text-gray-800",
              formFieldLabel: "text-sm font-medium text-gray-700",
              formFieldInput:
                "rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500",
              formButtonPrimary:
                "bg-blue-600 hover:bg-blue-700 text-sm normal-case font-medium py-2 px-4 rounded-lg transition duration-200",
            },
          }}
        />
      </div>
    </div>
  );
}
