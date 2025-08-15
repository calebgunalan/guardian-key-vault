import { ZeroTrustPolicyManager } from '@/components/admin/ZeroTrustPolicyManager';
import { AdminGate } from '@/components/PermissionGate';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ZeroTrust() {
  const navigate = useNavigate();

  return (
    <AdminGate>
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate("/dashboard")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Zero Trust Security</h1>
          </div>
          <p className="text-muted-foreground">
            Advanced zero trust policy management with real-time trust scoring. 
            Configure device, network, behavioral, location, and time-based security policies.
          </p>
        </div>

        <ZeroTrustPolicyManager />
      </div>
    </AdminGate>
  );
}