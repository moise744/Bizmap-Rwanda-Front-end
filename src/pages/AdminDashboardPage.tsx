import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

const AdminDashboardPage: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Admin Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Coming soon: platform analytics and moderation tools.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboardPage;


