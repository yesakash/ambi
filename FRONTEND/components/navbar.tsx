import Link from "next/link"
import { Button } from "@/components/ui/button"
import { SignInButton, SignUpButton, UserButton, SignedIn, SignedOut } from "@clerk/nextjs"

export function Navbar() {
  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo section */}
          <div className="flex items-center">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-orange-500 rounded-full"></div>
              <span className="text-xl font-semibold text-gray-900">ML Trainer</span>
            </div>
          </div>

          {/* Navigation links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              href="/" 
              className="text-gray-900 hover:text-orange-500 transition-colors duration-200 font-medium"
            >
              Home
            </Link>
            <Link 
              href="/pricing" 
              className="text-gray-900 hover:text-orange-500 transition-colors duration-200 font-medium"
            >
              Pricing
            </Link>
            <Link 
              href="https://github.com/MayankRaj435/Ambition_BugWiserz" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-900 hover:text-orange-500 transition-colors duration-200 font-medium"
            >
              GitHub
            </Link>
          </div>

          {/* Authentication buttons */}
          <div className="flex items-center space-x-4">
            <SignedOut>
              <SignInButton mode="modal">
                <Button variant="ghost" className="text-gray-900 hover:text-orange-500">
                  Sign In
                </Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-full font-medium transition-colors duration-200">
                  Get Started
                </Button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <UserButton 
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8"
                  }
                }}
              />
            </SignedIn>
          </div>
        </div>
      </div>
    </nav>
  )
}
