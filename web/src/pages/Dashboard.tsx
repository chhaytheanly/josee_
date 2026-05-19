import { useQuery } from '@tanstack/react-query';
import { Home, Users, DollarSign, AlertCircle, TrendingUp, Activity, Clock } from 'lucide-react';
import { api } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const { data: roomsData, isLoading } = useQuery({
    queryKey: ['rooms'],
    queryFn: async () => {
      const res = await api.get('/rooms?limit=10');
      return res.data;
    }
  });

  const summary = roomsData?.meta?.summary || { available: 0, occupied: 0, late_payments: 0, paid: 0 };
  const totalRooms = summary.available + summary.occupied;
  const occupancyRate = totalRooms > 0 ? ((summary.occupied / totalRooms) * 100).toFixed(1) : 0;
  const collectionRate = summary.paid + summary.late_payments > 0 
    ? ((summary.paid / (summary.paid + summary.late_payments)) * 100).toFixed(1) 
    : 0;

  const stats = [
    {
      title: 'Available Rooms',
      value: summary.available,
      icon: Home,
      trend: '+12%',
      trendUp: true
    },
    {
      title: 'Occupied Rooms',
      value: summary.occupied,
      icon: Users,
      trend: `${occupancyRate}%`,
      trendUp: true
    },
    {
      title: 'Paid Invoices',
      value: summary.paid,
      icon: DollarSign,
      trend: `$${summary.paid * 100}`,
      trendUp: true
    },
    {
      title: 'Late Payments',
      value: summary.late_payments,
      icon: AlertCircle,
      trend: `$${summary.late_payments * 100}`,
      trendUp: false
    }
  ];

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { y: 16, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6"
    >
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Overview of your property metrics and recent activity.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary border border-border">
          <TrendingUp className="h-4 w-4 text-foreground" />
          <span className="text-sm font-medium text-foreground">System Active</span>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={i}
              variants={itemVariants}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    <span className={stat.trendUp ? 'text-emerald-500 font-medium' : 'text-rose-500 font-medium'}>
                      {stat.trend}
                    </span>
                    {' '}from last month
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      <motion.div variants={itemVariants} className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              Quick Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Total Rooms', value: totalRooms, percent: 100 },
                { label: 'Occupied', value: summary.occupied, percent: Number(occupancyRate) },
                { label: 'Paid', value: summary.paid, percent: Number(collectionRate) },
                { label: 'Overdue', value: summary.late_payments, percent: 100 },
              ].map((item, i) => {
                return (
                  <div key={i} className="rounded-lg bg-muted/50 p-4 border border-border/50">
                    <p className="text-2xl font-bold text-foreground">{item.value}</p>
                    <p className="text-sm text-muted-foreground mt-1">{item.label}</p>
                    <div className="mt-3 h-1 w-full bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${item.percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { action: 'New payment received', detail: '$850.00', time: '2 min ago', type: 'payment' },
                { action: 'Room 204 occupied', detail: 'John Smith', time: '1 hour ago', type: 'occupancy' },
                { action: 'Late fee applied', detail: '$25.00', time: '3 hours ago', type: 'fee' },
              ].map((activity, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-secondary">
                      {activity.type === 'payment' && <DollarSign className="h-4 w-4 text-foreground" />}
                      {activity.type === 'occupancy' && <Users className="h-4 w-4 text-foreground" />}
                      {activity.type === 'fee' && <AlertCircle className="h-4 w-4 text-foreground" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-foreground">{activity.detail}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
