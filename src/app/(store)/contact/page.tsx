// app/(store)/contact/page.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Phone,
  Clock,
  Mail,
  MessageCircle,
  Truck,
  Shield,
  Users,
  CreditCard,
  Star,
  Wrench,
  Home,
  Headphones,
  Zap,
  Battery,
  Lightbulb,
  Package,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ContactForm from "@/components/contact-form";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-20">
        <div className="absolute inset-0 bg-[url('/patterns/circuit-board.svg')] opacity-10" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Let's Light Up Your Life
            </h1>
            <p className="text-xl md:text-2xl opacity-90 mb-8 max-w-3xl mx-auto">
              Kenya's Premier electricals & Lighting Solutions Provider
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                <Shield className="w-4 h-4" />
                <span className="text-sm">Trusted by 500+ Kenyan Homes</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Same-Day Delivery in Nairobi</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                <Star className="w-4 h-4" />
                <span className="text-sm">
                  Professional Installation Services
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto sm:px-4 px-2 py-16 max-w-6xl">
        {/* Contact Grid */}
        <div className="grid lg:grid-cols-2 gap-12 mb-20">
          {/* Contact Form */}
          <Card className="shadow-xl border-0 dark:border dark:border-gray-800">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-3xl font-bold">
                Get Expert Advice
              </CardTitle>
              <CardDescription className="text-lg">
                Tell us about your lighting or electricals needs
              </CardDescription>
            </CardHeader>
            <ContactForm />
          </Card>

          {/* Contact Information */}
          <div className="space-y-8">
            {/* Quick Response Card */}
            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-0">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-400 rounded-full flex items-center justify-center">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">
                      Fast Emergency Response
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-3">
                      Need urgent electrical repairs or emergency lighting? We
                      respond within 2 hours in Nairobi.
                    </p>
                    <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      Emergency Hotline: +254 727 833 691
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Methods */}
            <div className="grid sm:grid-cols-2 gap-6">
              <Card className="hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full flex items-center justify-center">
                      <Phone className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Sales & Support</h3>
                      <p className="text-sm text-muted-foreground">
                        Product inquiries & orders
                      </p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                    +254 727 833 691
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Mon-Sat, 7am-7pm EAT
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-400 rounded-full flex items-center justify-center">
                      <Wrench className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Installation</h3>
                      <p className="text-sm text-muted-foreground">
                        Professional setup services
                      </p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">
                    +254 727 833 691
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Book installation appointments
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Email Contact */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-400 rounded-full flex items-center justify-center">
                    <Mail className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Email Support</h3>
                    <p className="text-sm text-muted-foreground">
                      Technical inquiries & quotations
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-medium text-blue-600 dark:text-blue-400">
                    sales@blessedtwoelectricals.com
                  </p>
                  <p className="text-sm text-muted-foreground">
                    For product inquiries & orders
                  </p>
                  <p className="text-lg font-medium text-green-600 dark:text-green-400">
                    support@blessedtwoelectricals.com
                  </p>
                  <p className="text-sm text-muted-foreground">
                    For technical support & installations
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Business Hours */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  Business Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium">Monday - Saturday</span>
                    <span className="font-bold">7:00 AM - 7:00 PM</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium">Sunday</span>
                    <span className="font-bold">10:00 AM - 4:00 PM</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <span className="font-medium">Emergency Service</span>
                    <span className="font-bold text-red-600">24/7</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Physical Store */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  Visit Our Showroom
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Thika Road Mall</p>
                      <p className="text-sm text-muted-foreground">
                        Ground Floor, Shop G12
                        <br />
                        Thika Road, Nairobi
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Showroom Hours</p>
                      <p className="text-sm text-muted-foreground">
                        Mon-Sat: 8am - 6pm
                        <br />
                        Sun: 10am - 4pm
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full" asChild>
                    <Link
                      href="https://maps.google.com/?q=Thika+Road+Mall+Nairobi"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      Get Directions
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Our Specialties */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              What We Specialize In
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Comprehensive electricals and lighting solutions for every need
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Lightbulb,
                title: "Smart Lighting",
                description: "LED lights, smart bulbs, home automation systems",
                color: "from-yellow-500 to-amber-500",
              },
              {
                icon: Zap,
                title: "Solar Solutions",
                description: "Solar panels, batteries, complete solar systems",
                color: "from-orange-500 to-red-500",
              },
              {
                icon: Battery,
                title: "Power Backup",
                description: "UPS systems, inverters, generators, stabilizers",
                color: "from-green-500 to-emerald-500",
              },
              {
                icon: Shield,
                title: "Security Systems",
                description: "CCTV cameras, alarms, smart security solutions",
                color: "from-blue-500 to-cyan-500",
              },
              {
                icon: Home,
                title: "Home Appliances",
                description: "Energy-efficient appliances, kitchen electricals",
                color: "from-purple-500 to-pink-500",
              },
              {
                icon: Wrench,
                title: "Installation",
                description: "Professional setup & wiring services",
                color: "from-gray-600 to-gray-800",
              },
              {
                icon: Headphones,
                title: "Audio Systems",
                description: "Home theater, speakers, sound systems",
                color: "from-indigo-500 to-blue-500",
              },
              {
                icon: Package,
                title: "Wholesale",
                description: "Bulk orders for businesses & contractors",
                color: "from-teal-500 to-green-500",
              },
            ].map((specialty, index) => (
              <Card
                key={index}
                className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border"
              >
                <CardContent className="p-6">
                  <div
                    className={`w-12 h-12 rounded-lg bg-gradient-to-r ${specialty.color} flex items-center justify-center mb-4`}
                  >
                    <specialty.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{specialty.title}</h3>
                  <p className="text-muted-foreground">
                    {specialty.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Why Choose Blessed Two */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Choose Blessed Two electricals?
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              We bring light and power to homes and businesses across Kenya
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: CreditCard,
                title: "Flexible Payment",
                description: "Buy Now Pay Later, M-Pesa, Installment plans",
                color: "from-green-500 to-emerald-500",
              },
              {
                icon: Truck,
                title: "Free Delivery",
                description:
                  "Free shipping within Nairobi for orders over KES 5,000",
                color: "from-blue-500 to-cyan-500",
              },
              {
                icon: Wrench,
                title: "Expert Installation",
                description: "Certified technicians for professional setup",
                color: "from-purple-500 to-pink-500",
              },
              {
                icon: Shield,
                title: "Warranty Included",
                description: "1-3 year warranty on all products",
                color: "from-amber-500 to-yellow-500",
              },
              {
                icon: Users,
                title: "Bulk Discounts",
                description: "Special wholesale pricing for businesses",
                color: "from-red-500 to-orange-500",
              },
              {
                icon: Headphones,
                title: "24/7 Support",
                description: "Technical support even after installation",
                color: "from-indigo-500 to-blue-500",
              },
            ].map((feature, index) => (
              <Card
                key={index}
                className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border"
              >
                <CardContent className="p-6">
                  <div
                    className={`w-12 h-12 rounded-lg bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4`}
                  >
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Common questions from our valued customers
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                question: "Do you offer installation services?",
                answer:
                  "Yes! We provide professional installation for all our products. Our certified technicians handle everything from wiring to final setup. Installation costs vary based on complexity.",
              },
              {
                question: "What payment methods do you accept?",
                answer:
                  "We accept M-Pesa (Lipa Na M-Pesa, Buy Goods), credit/debit cards, bank transfers, and offer Buy Now Pay Later options. For bulk orders, we provide flexible payment plans.",
              },
              {
                question: "How long does delivery take?",
                answer:
                  "Nairobi: Same-day delivery for orders before 2pm. Other counties: 2-3 business days. Free delivery within Nairobi for orders over KES 5,000.",
              },
              {
                question: "Do you provide warranty?",
                answer:
                  "Yes! All products come with manufacturer's warranty (1-3 years depending on product). We also offer extended warranty options for additional protection.",
              },
              {
                question: "Can I get a bulk discount?",
                answer:
                  "Absolutely! We offer special wholesale pricing for businesses, contractors, and bulk purchases. Contact our sales team for customized quotations.",
              },
              {
                question: "Do you handle solar system installation?",
                answer:
                  "Yes! We provide complete solar solutions including consultation, design, supply, and professional installation of solar systems for homes and businesses.",
              },
              {
                question: "What if I need urgent electrical repairs?",
                answer:
                  "We offer 24/7 emergency electrical services. Call our emergency hotline at +254 727 833 691 for immediate assistance.",
              },
              {
                question: "Do you accept returns?",
                answer:
                  "Yes, we have a 14-day return policy for defective products. Products must be in original packaging with all accessories. Installation charges are non-refundable.",
              },
            ].map((faq, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold mb-3 flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 dark:text-blue-400 font-bold">
                        Q
                      </span>
                    </div>
                    {faq.question}
                  </h3>
                  <p className="text-muted-foreground pl-9">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Service Areas */}
        <Card className="mb-20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl md:text-3xl mb-2">
              Areas We Serve
            </CardTitle>
            <CardDescription>
              We deliver and install across these major areas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[
                { area: "Nairobi CBD", status: "Same-day" },
                { area: "Westlands", status: "Same-day" },
                { area: "Karen", status: "Same-day" },
                { area: "Runda", status: "Same-day" },
                { area: "Kiambu", status: "Next-day" },
                { area: "Thika", status: "Next-day" },
                { area: "Mombasa", status: "2-3 days" },
                { area: "Kisumu", status: "2-3 days" },
                { area: "Nakuru", status: "2-3 days" },
                { area: "Eldoret", status: "2-3 days" },
                { area: "Naivasha", status: "2-3 days" },
                { area: "Machakos", status: "2-3 days" },
              ].map((location, index) => (
                <div
                  key={index}
                  className="p-3 border rounded-lg hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
                >
                  <p className="font-medium">{location.area}</p>
                  <p
                    className={`text-sm ${
                      location.status === "Same-day"
                        ? "text-green-600"
                        : "text-blue-600"
                    }`}
                  >
                    {location.status} delivery
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Final CTA */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-8 md:p-12">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
          <div className="relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Ready to Light Up Your Space?
              </h2>
              <p className="text-xl opacity-90 mb-8">
                Join thousands of satisfied customers who trust Blessed Two for
                quality electricals
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="bg-white text-blue-700 hover:bg-white/90 font-bold px-8 py-6 text-lg"
                >
                  <Phone className="w-5 h-5 mr-2" />
                  Call Now: +254 727 833 691
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="link"
                  className="border-2 border-white hover:bg-white/10 font-bold px-8 py-6 text-lg"
                >
                  <Link
                    href="https://wa.me/254727833691?text=Hi%20Blessed%20Two%20electricals,%20I'm%20interested%20in%20your%20products%20and%20would%20like%20to%20get%20a%20quotation."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center"
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    WhatsApp for Quote
                  </Link>
                </Button>
              </div>
              <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm opacity-90">
                <div className="flex items-center justify-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span>Warranty Included</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Truck className="w-4 h-4" />
                  <span>Free Delivery*</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Wrench className="w-4 h-4" />
                  <span>Professional Install</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  <span>Flexible Payment</span>
                </div>
              </div>
              <p className="mt-6 text-sm opacity-80">
                *Free delivery within Nairobi for orders over KES 5,000
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
