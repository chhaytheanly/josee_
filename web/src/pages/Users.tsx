import { useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  UsersIcon,
  Search,
} from 'lucide-react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui/card';

import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

import {
  Badge,
} from '../components/ui/badge';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';

import { Select } from '../components/ui/select';

import {
  useCreateUser,
  useDeleteUser,
  useUpdateUser,
  useUsers,
} from '../hooks/useUser';

import type { User } from '../lib/types/type';

export default function Users() {
  const { data, isLoading } = useUsers();

  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);

  const [search, setSearch] = useState('');

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role_id: '1',
  });

  const users = data?.data || [];

  const filteredUsers = users.filter((u: User) => {
    return (
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    );
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...form,
      role_id: parseInt(form.role_id),
    };

    if (editing) {
      const { password, ...rest } = payload;

      await updateUser.mutateAsync({
        id: editing.id,
        ...rest,
        ...(password ? { password } : {}),
      });
    } else {
      await createUser.mutateAsync(payload);
    }

    setOpen(false);

    setEditing(null);

    setForm({
      name: '',
      email: '',
      password: '',
      role_id: '1',
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const getRoleLabel = (roleId: number) => {
    const roles: Record<number, string> = {
      1: 'Administrator',
      2: 'Manager',
      3: 'Staff',
    };

    return roles[roleId] || `Role ${roleId}`;
  };

  const getRoleBadge = (roleId: number) => {
    if (roleId === 1) {
      return (
        <Badge className="border border-rose-200 bg-rose-100 text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300">
          Administrator
        </Badge>
      );
    }

    if (roleId === 2) {
      return (
        <Badge className="border border-blue-200 bg-blue-100 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300">
          Manager
        </Badge>
      );
    }

    return (
      <Badge className="border border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
        Staff
      </Badge>
    );
  };

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
            <UsersIcon className="h-7 w-7 text-primary" />
          </div>

          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              User Management
            </h1>

            <p className="text-muted-foreground">
              Manage administrators, managers, and staff accounts.
            </p>
          </div>
        </div>

        <Button
          className="gap-2 shadow-sm"
          onClick={() => {
            setEditing(null);

            setForm({
              name: '',
              email: '',
              password: '',
              role_id: '1',
            });

            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* STATS */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            title: 'Total Users',
            value: users.length,
          },
          {
            title: 'Administrators',
            value: users.filter(
              (u: User) => u.role_id === 1,
            ).length,
          },
          {
            title: 'Managers',
            value: users.filter(
              (u: User) => u.role_id === 2,
            ).length,
          },
          {
            title: 'Staff',
            value: users.filter(
              (u: User) => u.role_id === 3,
            ).length,
          },
        ].map((item, index) => (
          <Card
            key={index}
            className="border-border/50 shadow-sm transition-all hover:shadow-lg"
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    {item.title}
                  </p>

                  <h3 className="text-3xl font-bold tracking-tight">
                    {item.value}
                  </h3>
                </div>

                <div className="rounded-xl bg-primary/10 p-3">
                  <UsersIcon className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* TABLE */}
      <Card className="overflow-hidden border-border/50 shadow-sm">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-lg">
                System Users
              </CardTitle>

              <p className="text-sm text-muted-foreground">
                Manage all users and permissions.
              </p>
            </div>

            {/* SEARCH */}
            <div className="relative w-full sm:w-[280px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                placeholder="Search users..."
                className="pl-10"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-background">
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((u: User) => (
                    <TableRow
                      key={u.id}
                      className="hover:bg-muted/40"
                    >
                      {/* USER */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                            {u.name?.charAt(0)}
                          </div>

                          <div>
                            <p className="font-medium">
                              {u.name}
                            </p>

                            <p className="text-xs text-muted-foreground">
                              User ID #{u.id}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      {/* EMAIL */}
                      <TableCell className="text-muted-foreground">
                        {u.email}
                      </TableCell>

                      {/* ROLE */}
                      <TableCell>
                        {getRoleBadge(u.role_id)}
                      </TableCell>

                      {/* ACTIONS */}
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={() => {
                              setEditing(u);

                              setForm({
                                name: u.name,
                                email: u.email,
                                password: '',
                                role_id:
                                  u.role_id.toString(),
                              });

                              setOpen(true);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </Button>

                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={deleteUser.isPending}
                            onClick={() =>
                              deleteUser.mutateAsync(u.id)
                            }
                          >
                            {deleteUser.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Trash2 className="mr-1 h-4 w-4" />
                                Delete
                              </>
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-40 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="rounded-full bg-muted p-3">
                          <UsersIcon className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium">No users found</p>
                        <p className="text-xs text-muted-foreground">
                          {search ? 'Try a different search term' : 'Add users to get started'}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* DIALOG */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {editing
                ? 'Edit User'
                : 'Create New User'}
            </DialogTitle>

            <DialogDescription>
              {editing
                ? 'Update user information and permissions.'
                : 'Create a new account for your system.'}
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={submit}
            className="space-y-5 pt-2"
          >
            {/* NAME */}
            <div className="space-y-2">
              <Label>Full Name</Label>

              <Input
                placeholder="John Doe"
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                  })
                }
                required
              />
            </div>

            {/* EMAIL */}
            <div className="space-y-2">
              <Label>Email Address</Label>

              <Input
                type="email"
                placeholder="john@example.com"
                value={form.email}
                onChange={(e) =>
                  setForm({
                    ...form,
                    email: e.target.value,
                  })
                }
                required
              />
            </div>

            {/* PASSWORD */}
            <div className="space-y-2">
              <Label>
                Password
                {!editing && (
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                )}
              </Label>

              <Input
                type="password"
                placeholder={
                  editing
                    ? 'Leave blank to keep current password'
                    : 'Enter secure password'
                }
                value={form.password}
                onChange={(e) =>
                  setForm({
                    ...form,
                    password: e.target.value,
                  })
                }
                required={!editing}
              />
            </div>

            {/* ROLE */}
            <div className="space-y-2">
              <Label>User Role</Label>

              <Select
                value={form.role_id}
                onChange={(e) =>
                  setForm({
                    ...form,
                    role_id: e.target.value,
                  })
                }
              >
                <option value="1">Administrator</option>
                <option value="2">Manager</option>
                <option value="3">Staff</option>
              </Select>
            </div>

            {/* FOOTER */}
            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                className="gap-2"
                disabled={
                  createUser.isPending ||
                  updateUser.isPending
                }
              >
                {createUser.isPending ||
                updateUser.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}

                {editing
                  ? 'Update User'
                  : 'Create User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}