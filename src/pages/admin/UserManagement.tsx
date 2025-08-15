import { UserManagementPanel } from '@/components/admin/UserManagementPanel';
import { AdminGate } from '@/components/PermissionGate';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function UserManagement() {
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
            <Users className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">User Management</h1>
          </div>
          <p className="text-muted-foreground">
            Comprehensive user administration panel. Add, edit, and delete users with role-based access control.
            All user operations are logged for audit compliance.
          </p>
        </div>

        <UserManagementPanel />
      </div>
    </AdminGate>
  );
}