import { useState } from "react";
import { useTimeBasedPermissions } from "@/hooks/useTimeBasedPermissions";
import { usePermissions } from "@/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Clock, Plus, Edit, Trash2, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const DAYS_OF_WEEK = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 7, label: 'Sunday' },
];

export function TimeBasedPermissions() {
  const { timeBasedPermissions, loading, createTimeBasedPermission, updateTimeBasedPermission, deleteTimeBasedPermission } = useTimeBasedPermissions();
  const { permissions } = usePermissions();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Form state
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedPermissionId, setSelectedPermissionId] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]); // Weekdays by default
  const [timezone, setTimezone] = useState('UTC');

  const handleCreateTimeBasedPermission = async () => {
    if (!selectedUserId || !selectedPermissionId) {
      toast.error('Please select a user and permission');
      return;
    }

    if (selectedDays.length === 0) {
      toast.error('Please select at least one day');
      return;
    }

    setActionLoading(true);
    try {
      await createTimeBasedPermission({
        user_id: selectedUserId,
        permission_id: selectedPermissionId,
        start_time: startTime,
        end_time: endTime,
        days_of_week: selectedDays,
        timezone,
      });
      
      toast.success('Time-based permission created successfully');
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error('Failed to create time-based permission');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTogglePermission = async (permissionId: string, currentActive: boolean) => {
    setActionLoading(true);
    try {
      await updateTimeBasedPermission(permissionId, { is_active: !currentActive });
      toast.success(`Permission ${!currentActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      toast.error('Failed to update permission');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePermission = async (permissionId: string, permissionName: string) => {
    if (!confirm(`Are you sure you want to delete the time-based permission for "${permissionName}"?`)) {
      return;
    }

    setActionLoading(true);
    try {
      await deleteTimeBasedPermission(permissionId);
      toast.success('Time-based permission deleted successfully');
    } catch (error) {
      toast.error('Failed to delete time-based permission');
    } finally {
      setActionLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedUserId('');
    setSelectedPermissionId('');
    setStartTime('09:00');
    setEndTime('17:00');
    setSelectedDays([1, 2, 3, 4, 5]);
    setTimezone('UTC');
  };

  const formatTimeRange = (start: string, end: string) => {
    return `${start} - ${end}`;
  };

  const formatDaysOfWeek = (days: number[]) => {
    const dayLabels = days.map(day => DAYS_OF_WEEK.find(d => d.value === day)?.label || '');
    return dayLabels.join(', ');
  };

  if (loading) {
    return <div>Loading time-based permissions...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Time-Based Permissions
        </CardTitle>
        <CardDescription>
          Configure permissions that are only active during specific hours and days.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            You have {timeBasedPermissions.length} time-based permission{timeBasedPermissions.length !== 1 ? 's' : ''}
          </p>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Time-Based Permission
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Time-Based Permission</DialogTitle>
                <DialogDescription>
                  Set up a permission that's only active during specific times and days.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="user-id">User ID</Label>
                  <Input
                    id="user-id"
                    placeholder="Enter user ID"
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="permission">Permission</Label>
                  <Select value={selectedPermissionId} onValueChange={setSelectedPermissionId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a permission" />
                    </SelectTrigger>
                    <SelectContent>
                      {permissions.map((permission) => (
                        <SelectItem key={permission.id} value={permission.id}>
                          {permission.name} ({permission.action} on {permission.resource})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-time">Start Time</Label>
                    <Input
                      id="start-time"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-time">End Time</Label>
                    <Input
                      id="end-time"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Days of Week</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {DAYS_OF_WEEK.map((day) => (
                      <div key={day.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`day-${day.value}`}
                          checked={selectedDays.includes(day.value)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedDays([...selectedDays, day.value]);
                            } else {
                              setSelectedDays(selectedDays.filter(d => d !== day.value));
                            }
                          }}
                        />
                        <Label htmlFor={`day-${day.value}`} className="text-sm">
                          {day.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Input
                    id="timezone"
                    placeholder="UTC"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleCreateTimeBasedPermission} disabled={actionLoading}>
                    {actionLoading ? 'Creating...' : 'Create Permission'}
                  </Button>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-3">
          {timeBasedPermissions.map((permission) => (
            <div key={permission.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <div>
                    <p className="font-medium">
                      {permission.permissions?.name || 'Unknown Permission'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {permission.permissions?.action} on {permission.permissions?.resource}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={permission.is_active ? "secondary" : "outline"}>
                    {permission.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTogglePermission(permission.id, permission.is_active)}
                    disabled={actionLoading}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeletePermission(permission.id, permission.permissions?.name || 'permission')}
                    disabled={actionLoading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">Active Hours</p>
                  <p className="text-muted-foreground">
                    {formatTimeRange(permission.start_time, permission.end_time)}
                  </p>
                </div>

                <div>
                  <p className="font-medium">Days</p>
                  <p className="text-muted-foreground">
                    {formatDaysOfWeek(permission.days_of_week)}
                  </p>
                </div>

                <div>
                  <p className="font-medium">Timezone</p>
                  <p className="text-muted-foreground">{permission.timezone}</p>
                </div>

                <div>
                  <p className="font-medium">Created</p>
                  <p className="text-muted-foreground">
                    {formatDistanceToNow(new Date(permission.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {timeBasedPermissions.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            No time-based permissions found. Create your first time-based permission to get started.
          </div>
        )}
      </CardContent>
    </Card>
  );
}