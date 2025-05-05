import { Building } from "lucide-react";
import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="border-t bg-muted/40">
      <div className="container py-8 md:py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="flex flex-col gap-2">
            <Link href="/">
              <a className="flex items-center gap-2">
                <Building className="h-6 w-6 text-primary" />
                <span className="font-bold text-xl">EstateHub</span>
              </a>
            </Link>
            <p className="text-sm text-muted-foreground mt-2">
              Your trusted partner for finding your dream property. Whether buying, selling, or renting, we've got you covered.
            </p>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold mb-4">Properties</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/properties?type=house">
                  <a className="text-muted-foreground hover:text-primary transition-colors">
                    Houses
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/properties?type=apartment">
                  <a className="text-muted-foreground hover:text-primary transition-colors">
                    Apartments
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/properties?type=condo">
                  <a className="text-muted-foreground hover:text-primary transition-colors">
                    Condos
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/properties?type=commercial">
                  <a className="text-muted-foreground hover:text-primary transition-colors">
                    Commercial
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/properties?type=land">
                  <a className="text-muted-foreground hover:text-primary transition-colors">
                    Land
                  </a>
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about">
                  <a className="text-muted-foreground hover:text-primary transition-colors">
                    About Us
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/agents">
                  <a className="text-muted-foreground hover:text-primary transition-colors">
                    Our Agents
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/careers">
                  <a className="text-muted-foreground hover:text-primary transition-colors">
                    Careers
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/contact">
                  <a className="text-muted-foreground hover:text-primary transition-colors">
                    Contact Us
                  </a>
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacy">
                  <a className="text-muted-foreground hover:text-primary transition-colors">
                    Privacy Policy
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/terms">
                  <a className="text-muted-foreground hover:text-primary transition-colors">
                    Terms of Service
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/cookie-policy">
                  <a className="text-muted-foreground hover:text-primary transition-colors">
                    Cookie Policy
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/accessibility">
                  <a className="text-muted-foreground hover:text-primary transition-colors">
                    Accessibility
                  </a>
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} EstateHub. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-muted-foreground hover:text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-facebook"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
              <span className="sr-only">Facebook</span>
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-twitter"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" /></svg>
              <span className="sr-only">Twitter</span>
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-instagram"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
              <span className="sr-only">Instagram</span>
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-linkedin"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
              <span className="sr-only">LinkedIn</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
