import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Users, Lock, Key } from "lucide-react";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (user) {
    navigate("/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <div className="flex items-center justify-center mb-6">
            <Shield className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-5xl font-bold mb-6">Identity & Access Management</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Secure, scalable, and comprehensive IAM solution for managing user identities, 
            roles, and permissions across your organization.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/auth")}>
              Get Started
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate("/auth")}>
              Sign In
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <Card>
            <CardHeader>
              <Users className="h-12 w-12 text-primary mb-4" />
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Comprehensive user lifecycle management with profile controls and secure authentication
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• User registration and authentication</li>
                <li>• Profile management</li>
                <li>• Account lifecycle controls</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Role-Based Access</CardTitle>
              <CardDescription>
                Flexible role and permission system with granular access controls
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• Multi-level role hierarchy</li>
                <li>• Permission-based access control</li>
                <li>• Admin dashboard for management</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Lock className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Security First</CardTitle>
              <CardDescription>
                Enterprise-grade security with row-level security and audit trails
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• Row-level security policies</li>
                <li>• Secure authentication flows</li>
                <li>• Audit logging and monitoring</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
