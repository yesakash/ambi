import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, X } from "lucide-react"

interface PricingCardProps {
  title: string
  price: string
  period: string
  description: string
  features: string[]
  limitations?: string[]
  isPopular?: boolean
  buttonText: string
  buttonVariant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
  onButtonClick: () => void
}

export function PricingCard({
  title,
  price,
  period,
  description,
  features,
  limitations = [],
  isPopular = false,
  buttonText,
  buttonVariant = "default",
  onButtonClick
}: PricingCardProps) {
  return (
    <Card className={`relative w-full max-w-sm ${isPopular ? 'border-orange-500 shadow-lg scale-105' : 'border-gray-200'}`}>
      {isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-orange-500 text-white px-4 py-1">Most Popular</Badge>
        </div>
      )}
      
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl font-bold">{title}</CardTitle>
        <div className="mt-4">
          <span className="text-4xl font-bold text-gray-900">{price}</span>
          <span className="text-gray-500 ml-1">{period}</span>
        </div>
        <CardDescription className="mt-2 text-gray-600">{description}</CardDescription>
      </CardHeader>
      
      <CardContent className="pt-0">
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-700">{feature}</span>
            </li>
          ))}
          {limitations.map((limitation, index) => (
            <li key={index} className="flex items-start">
              <X className="h-5 w-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-500 line-through">{limitation}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      
      <CardFooter className="pt-6">
        <Button 
          className={`w-full ${isPopular ? 'bg-orange-500 hover:bg-orange-600' : ''}`}
          variant={buttonVariant}
          onClick={onButtonClick}
        >
          {buttonText}
        </Button>
      </CardFooter>
    </Card>
  )
}
