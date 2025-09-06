import UserGroupManagement from '@/components/security/UserGroupManagement';
import { AdminGate } from '@/components/PermissionGate';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function UserGroups() {
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
            <h1 className="text-3xl font-bold">User Groups</h1>
          </div>
          <p className="text-muted-foreground">
            Create and manage user groups for simplified permission assignment and role management.
            Groups allow you to efficiently manage permissions for multiple users at once.
          </p>
        </div>

        <UserGroupManagement />
      </div>
    </AdminGate>
  );
}