"use client"

import { PricingCard } from "@/components/pricing-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"

const comparisonData = [
  { feature: "File Uploads", free: 5, premium: "Unlimited" },
  { feature: "Processing Speed", free: "Standard", premium: "3x Faster" },
  { feature: "Model Training", free: "Basic", premium: "Advanced" },
  { feature: "Export Options", free: "CSV Only", premium: "All Formats" },
  { feature: "Support", free: "Community", premium: "Priority" },
]

const performanceData = [
  { model: "Random Forest", free: 85, premium: 92 },
  { model: "SVM", free: 78, premium: 89 },
  { model: "Neural Network", free: 82, premium: 94 },
  { model: "XGBoost", free: 88, premium: 96 },
]

export default function PricingPage() {
  const handleFreeTrial = () => {
    // Handle free trial signup
    console.log("Starting free trial...")
  }

  const handlePremiumUpgrade = () => {
    // Handle premium upgrade
    console.log("Upgrading to premium...")
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Start with our free trial and upgrade when you're ready for unlimited power
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="flex flex-col lg:flex-row gap-8 justify-center items-start mb-16">
          <PricingCard
            title="Free Trial"
            price="$0"
            period="/month"
            description="Perfect for getting started with ML"
            features={[
              "5 file uploads per month",
              "Standard processing speed",
              "Basic model training",
              "CSV export only",
              "Community support",
              "Access to all ML models"
            ]}
            buttonText="Start Free Trial"
            buttonVariant="outline"
            onButtonClick={handleFreeTrial}
          />
          
          <PricingCard
            title="Premium"
            price="$9.99"
            period="/month"
            description="For serious ML practitioners"
            features={[
              "Unlimited file uploads",
              "3x faster processing",
              "Advanced model training",
              "Export to all formats",
              "Priority support",
              "Advanced analytics",
              "Model comparison tools",
              "API access"
            ]}
            limitations={[]}
            isPopular={true}
            buttonText="Upgrade to Premium"
            onButtonClick={handlePremiumUpgrade}
          />
        </div>

        {/* Comparison Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Feature Comparison
          </h2>
          <Card>
            <CardHeader>
              <CardTitle>Plan Comparison</CardTitle>
              <CardDescription>
                See how our plans stack up against each other
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">Feature</th>
                      <th className="text-center py-3 px-4 font-semibold">Free Trial</th>
                      <th className="text-center py-3 px-4 font-semibold text-orange-600">Premium</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonData.map((item, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{item.feature}</td>
                        <td className="py-3 px-4 text-center text-gray-600">{item.free}</td>
                        <td className="py-3 px-4 text-center text-orange-600 font-semibold">{item.premium}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Comparison Chart */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Performance Comparison
          </h2>
          <Card>
            <CardHeader>
              <CardTitle>Model Accuracy Comparison</CardTitle>
              <CardDescription>
                Premium users get significantly better model performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="model" />
                    <YAxis domain={[70, 100]} />
                    <Tooltip />
                    <Bar dataKey="free" fill="#6B7280" name="Free Trial" />
                    <Bar dataKey="premium" fill="#F97316" name="Premium" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Frequently Asked Questions
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I cancel anytime?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Yes! You can cancel your subscription at any time. You'll continue to have access until the end of your billing period.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What payment methods do you accept?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  We accept all major credit cards, PayPal, and bank transfers for annual subscriptions.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Is there a free trial?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Yes! Our free trial gives you access to all features with some limitations. No credit card required.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Do you offer refunds?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  We offer a 30-day money-back guarantee. If you're not satisfied, we'll refund your payment.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
