import { QuantumSecurityDashboard } from '@/components/security/QuantumSecurityDashboard';
import { QuantumSecurityManagement } from '@/components/security/QuantumSecurityManagement';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function QuantumSecurity() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="management">Advanced Management</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="space-y-4">
          <QuantumSecurityDashboard />
        </TabsContent>
        
        <TabsContent value="management" className="space-y-4">
          <QuantumSecurityManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}