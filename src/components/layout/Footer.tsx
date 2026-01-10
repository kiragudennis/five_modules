import { ExternalLink, Info } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t bg-background px-2">
      <div className="container mx-auto py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Shop Example</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Your one-stop online store for quality products.
            </p>
            {/* <Link
              href="https://www.upwork.com/services/product/development-it-a-shopify-alternative-one-time-fee-no-subscriptions-1973336399139333730?ref=project_share"
              className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              passHref
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="flex items-center">
                Built by JDTheeFirst &nbsp; <ExternalLink className="h-4 w-4" />
              </span>
            </Link> */}
            <Link
              href="https://wa.me/254113062599?text=Hello Enginner!"
              className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              passHref
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="flex items-center">
                Talk to an architect &nbsp; <ExternalLink className="h-4 w-4" />
              </span>
            </Link>
            <span className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
              <Info className="h-3 w-3" />
              Attribution included at the client’s discretion
            </span>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Shop</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/products"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  All Products
                </Link>
              </li>
              <li>
                <Link
                  href="/categories"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Categories
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=uniforms"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Uniforms
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=gear"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Gear & Accessories
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Information</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/about"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  href="/shipping"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Shipping Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/returns"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Returns & Refunds
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <address className="not-italic text-sm text-muted-foreground">
              <p>Thika Highway Rd</p>
              <p>Mombasa, Kenya</p>
              <p className="mt-2">Email: </p>
              <p>Phone: </p>
            </address>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Shop Example. All rights reserved.
          </p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <Link
              href="/terms"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Terms of Service
            </Link>
            <Link
              href="/privacy"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
