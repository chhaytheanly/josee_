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
      gradient: 'from-emerald-500 to-teal-500',
      bgGradient: 'from-emerald-500/10 to-teal-500/5',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      trend: '+12%',
      trendUp: true
    },
    {
      title: 'Occupied Rooms',
      value: summary.occupied,
      icon: Users,
      gradient: 'from-sky-500 to-blue-500',
      bgGradient: 'from-sky-500/10 to-blue-500/5',
      iconColor: 'text-sky-600 dark:text-sky-400',
      trend: `${occupancyRate}%`,
      trendUp: true
    },
    {
      title: 'Paid Invoices',
      value: summary.paid,
      icon: DollarSign,
      gradient: 'from-amber-500 to-orange-500',
      bgGradient: 'from-amber-500/10 to-orange-500/5',
      iconColor: 'text-amber-600 dark:text-amber-400',
      trend: `$${summary.paid * 100}`,
      trendUp: true
    },
    {
      title: 'Late Payments',
      value: summary.late_payments,
      icon: AlertCircle,
      gradient: 'from-rose-500 to-red-500',
      bgGradient: 'from-rose-500/10 to-red-500/5',
      iconColor: 'text-rose-600 dark:text-rose-400',
      trend: `$${summary.late_payments * 100}`,
      trendUp: false
    }
  ];

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="relative">
          <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-6 w-6 rounded-full bg-primary/20 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-8"
    >
      {/* Welcome Section */}
      <motion.div variants={itemVariants} className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
            <TrendingUp className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-muted-foreground">
              Welcome back! Here's your property management overview for today.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={itemVariants} className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={i}
              variants={itemVariants}
              whileHover={{ y: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient}`} />
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.gradient} opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity`} />
                <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.gradient} bg-opacity-10`}>
                    <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-3xl font-bold tracking-tight">{stat.value}</div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`text-xs font-medium ${stat.trendUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {stat.trend}
                    </span>
                    <span className="text-xs text-muted-foreground">vs last month</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Quick Stats Row */}
      <motion.div variants={itemVariants}>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Quick Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700 p-4 text-center group hover:shadow-md transition-all">
                <p className="text-2xl font-bold text-primary">{totalRooms}</p>
                <p className="text-sm text-muted-foreground mt-1">Total Rooms</p>
                <div className="mt-2 h-1 w-full bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: '100%' }} />
                </div>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-950/50 dark:to-blue-950/50 p-4 text-center group hover:shadow-md transition-all">
                <p className="text-2xl font-bold text-sky-600 dark:text-sky-400">{summary.occupied}</p>
                <p className="text-sm text-muted-foreground mt-1">Occupied</p>
                <div className="mt-2 h-1 w-full bg-sky-200 dark:bg-sky-800 rounded-full overflow-hidden">
                  <div className="h-full bg-sky-500 rounded-full" style={{ width: `${occupancyRate}%` }} />
                </div>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50 p-4 text-center group hover:shadow-md transition-all">
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{summary.paid}</p>
                <p className="text-sm text-muted-foreground mt-1">Paid Invoices</p>
                <div className="mt-2 h-1 w-full bg-amber-200 dark:bg-amber-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${collectionRate}%` }} />
                </div>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-950/50 dark:to-red-950/50 p-4 text-center group hover:shadow-md transition-all">
                <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">{summary.late_payments}</p>
                <p className="text-sm text-muted-foreground mt-1">Overdue</p>
                <div className="mt-2 h-1 w-full bg-rose-200 dark:bg-rose-800 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full" style={{ width: '100%' }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Activity Section */}
      <motion.div variants={itemVariants}>
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { action: 'New payment received', amount: '$850.00', time: '2 minutes ago', type: 'payment' },
                { action: 'Room 204 occupied', tenant: 'John Smith', time: '1 hour ago', type: 'occupancy' },
                { action: 'Late fee applied', amount: '$25.00', time: '3 hours ago', type: 'fee' },
              ].map((activity, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      activity.type === 'payment' ? 'bg-emerald-100 dark:bg-emerald-900' :
                      activity.type === 'occupancy' ? 'bg-sky-100 dark:bg-sky-900' : 'bg-amber-100 dark:bg-amber-900'
                    }`}>
                      {activity.type === 'payment' && <DollarSign className="h-4 w-4 text-emerald-600" />}
                      {activity.type === 'occupancy' && <Users className="h-4 w-4 text-sky-600" />}
                      {activity.type === 'fee' && <AlertCircle className="h-4 w-4 text-amber-600" />}
                    </div>
                    <div>
                      <p className="font-medium">{activity.action}</p>
                      <p className="text-sm text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {activity.amount && <p className="font-semibold">{activity.amount}</p>}
                    {activity.tenant && <p className="text-sm text-muted-foreground">{activity.tenant}</p>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}