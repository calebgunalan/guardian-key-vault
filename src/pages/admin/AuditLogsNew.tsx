import { EnhancedAuditLogManager } from '@/components/security/EnhancedAuditLogManager';
import { AdminGate } from '@/components/PermissionGate';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AuditLogs() {
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
            <Activity className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Enhanced Audit Logs</h1>
          </div>
          <p className="text-muted-foreground">
            Comprehensive audit trail including security attacks, system events, and user activities.
            Export logs and view detailed attack statistics.
          </p>
        </div>

        <EnhancedAuditLogManager />
      </div>
    </AdminGate>
  );
}