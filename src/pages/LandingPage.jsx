import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  Shield, 
  Zap, 
  BarChart3, 
  Globe, 
  Lock,
  Github,
  Mail,
  ArrowRight,
  CheckCircle,
  Terminal,
  Database,
  Clock
} from 'lucide-react'

const LandingPage = () => {
  const features = [
    {
      icon: <Search className="h-8 w-8" />,
      title: "Multi-Service Search",
      description: "Search across 50+ pastebin services simultaneously with intelligent rate limiting and ethical scraping practices."
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: "Real-time Analytics",
      description: "Monitor search progress, analyze results, and track performance with comprehensive dashboards and visualizations."
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Secure & Ethical",
      description: "Respects robots.txt, implements adaptive rate limiting, and follows ethical scraping practices to protect services."
    },
    {
      icon: <Terminal className="h-8 w-8" />,
      title: "Live Terminal View",
      description: "Watch your scraping sessions in real-time with a terminal-style interface showing detailed progress logs."
    },
    {
      icon: <Database className="h-8 w-8" />,
      title: "Advanced Filtering",
      description: "Filter by file types, search terms, regex patterns, and custom criteria to find exactly what you need."
    },
    {
      icon: <Clock className="h-8 w-8" />,
      title: "Search History",
      description: "Track all your searches, export results, and analyze historical data with powerful search history tools."
    }
  ]

  const benefits = [
    "Monitor for leaked credentials and sensitive data",
    "Conduct threat intelligence research",
    "Track mentions of your organization",
    "Analyze code sharing patterns",
    "Export results in multiple formats",
    "Set up automated monitoring alerts"
  ]

  const supportedServices = [
    "Pastebin.com", "GitHub Gist", "paste.ee", "dpaste.org", 
    "nekobin.com", "rentry.co", "hastebin.com", "GitLab Snippets",
    "paste.ubuntu.com", "justpaste.it", "controlc.com", "ideone.com"
  ]

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                <Search className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">Pastie Scrapie</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link to="/register">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="container mx-auto max-w-6xl relative">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">
              <Zap className="h-3 w-3 mr-1" />
              Now Supporting 50+ Pastebin Services
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
              Monitor Pastebins
              <br />
              <span className="text-primary">at Scale</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
              Search across dozens of pastebin services simultaneously. Find leaked credentials, 
              monitor threats, and analyze data with our powerful, ethical scraping platform 
              designed for security professionals.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button size="lg" className="text-lg px-8 py-6">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                  <Github className="mr-2 h-5 w-5" />
                  Sign in with GitHub
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Hero Image/Demo */}
          <div className="relative max-w-4xl mx-auto">
            <div className="bg-card border border-border rounded-lg p-6 shadow-2xl">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-muted-foreground ml-4">Terminal - Scraping Session</span>
              </div>
              <div className="bg-background rounded p-4 font-mono text-sm">
                <div className="text-green-400">[INFO] Starting search across 12 pastebin services...</div>
                <div className="text-blue-400">[INFO] Pastebin.com: Found 23 matches for "api_key"</div>
                <div className="text-blue-400">[INFO] GitHub Gist: Found 15 matches for "password"</div>
                <div className="text-yellow-400">[WARN] Rate limiting applied to paste.ee</div>
                <div className="text-green-400">[SUCCESS] Search completed: 156 total results found</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Powerful Features for Security Professionals
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to monitor, analyze, and secure your digital footprint 
              across the pastebin ecosystem.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-border hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="text-primary mb-2">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Why Security Teams Choose Our Platform
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                From threat intelligence to credential monitoring, our platform provides 
                the tools you need to stay ahead of security threats.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-base">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <Card className="p-6">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>Live Dashboard</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Active Searches</span>
                    <Badge variant="secondary">3 Running</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Results Found</span>
                    <span className="font-semibold">1,247</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Success Rate</span>
                    <span className="font-semibold text-green-500">98.5%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full w-3/4"></div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Supported Services */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              50+ Supported Pastebin Services
            </h2>
            <p className="text-lg text-muted-foreground">
              We support all major pastebin services with intelligent rate limiting and ethical scraping.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {supportedServices.map((service, index) => (
              <div key={index} className="bg-card border border-border rounded-lg p-4 text-center hover:shadow-md transition-shadow">
                <Globe className="h-6 w-6 mx-auto mb-2 text-primary" />
                <span className="text-sm font-medium">{service}</span>
              </div>
            ))}
            <div className="bg-card border border-border rounded-lg p-4 text-center border-dashed">
              <span className="text-sm text-muted-foreground">+38 more services</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Start Monitoring?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join security professionals who trust our platform to monitor pastebins at scale.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" className="text-lg px-8 py-6">
                <Mail className="mr-2 h-5 w-5" />
                Start with Email
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                <Github className="mr-2 h-5 w-5" />
                Continue with GitHub
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="h-6 w-6 bg-primary rounded flex items-center justify-center">
                  <Search className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-bold">PasteBin Scraper</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Ethical pastebin monitoring for security professionals.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/features" className="hover:text-foreground">Features</Link></li>
                <li><Link to="/pricing" className="hover:text-foreground">Pricing</Link></li>
                <li><Link to="/docs" className="hover:text-foreground">Documentation</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/about" className="hover:text-foreground">About</Link></li>
                <li><Link to="/contact" className="hover:text-foreground">Contact</Link></li>
                <li><Link to="/privacy" className="hover:text-foreground">Privacy</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/help" className="hover:text-foreground">Help Center</Link></li>
                <li><Link to="/status" className="hover:text-foreground">Status</Link></li>
                <li><Link to="/api" className="hover:text-foreground">API</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2025 PasteBin Scraper. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage

