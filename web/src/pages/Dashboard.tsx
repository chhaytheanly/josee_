import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Home, Users, DollarSign, AlertCircle } from 'lucide-react';

export default function Dashboard() {
  const { data: roomsData, isLoading } = useQuery({
    queryKey: ['rooms'],
    queryFn: async () => {
      const res = await api.get('/room?limit=1');
      return res.data;
    }
  });

  const summary = roomsData?.meta?.summary || { available: 0, occupied: 0, late_payments: 0, paid: 0 };

  const stats = [
    { title: 'Available Rooms', value: summary.available, icon: Home, color: 'text-emerald-500' },
    { title: 'Occupied Rooms', value: summary.occupied, icon: Users, color: 'text-blue-500' },
    { title: 'Paid Invoices', value: summary.paid, icon: DollarSign, color: 'text-violet-500' },
    { title: 'Late Payments', value: summary.late_payments, icon: AlertCircle, color: 'text-red-500' },
  ];

  if (isLoading) return <div className="flex h-[50vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your property management system.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{stat.value}</div></CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
