import { useState } from 'react';
import { Plus, Pencil, Trash2, Loader2, UsersIcon, Search } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Select } from '../components/ui/select';
import { useCreateUser, useDeleteUser, useUpdateUser, useUsers } from '../hooks/useUser';
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
    image: null as File | null
  });

  const users = data?.data || [];
  const filteredUsers = users.filter((u: User) => 
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('name', form.name);
    formData.append('email', form.email);
    formData.append('password', form.password);
    formData.append('role_id', form.role_id);
    if (form.image) {
      formData.append('image', form.image);
    }

    try {
      if (editing) {
        await updateUser.mutateAsync({ id: editing.id, data: formData });
      } else {
        await createUser.mutateAsync(formData);
      }
      setOpen(false);
      setEditing(null);
      setForm({ name: '', email: '', password: '', role_id: '1', image: null });
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const getRoleBadge = (roleId: number) => {
    if (roleId === 1) return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-500/10 text-rose-500 ring-1 ring-inset ring-rose-500/20">Administrator</span>;
    if (roleId === 2) return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-500 ring-1 ring-inset ring-blue-500/20">Manager</span>;
    return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-500 ring-1 ring-inset ring-emerald-500/20">Staff</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">User Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage administrators, managers, and staff accounts.</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setForm({ name: '', email: '', password: '', role_id: '1', image: null });
            setOpen(true);
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" /> Add User
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { title: 'Total Users', value: users.length, icon: UsersIcon },
          { title: 'Administrators', value: users.filter((u: User) => u.role_id === 1).length, icon: UsersIcon },
          { title: 'Managers', value: users.filter((u: User) => u.role_id === 2).length, icon: UsersIcon },
          { title: 'Staff', value: users.filter((u: User) => u.role_id === 3).length, icon: UsersIcon },
        ].map((item, index) => (
          <Card key={index}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{item.title}</p>
                  <h3 className="text-2xl font-bold mt-2">{item.value}</h3>
                </div>
                <div className="p-2 rounded-md bg-secondary text-muted-foreground">
                  <item.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <div className="p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold">System Users</h3>
            <p className="text-sm text-muted-foreground mt-1">Manage all users and permissions.</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search users..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9" 
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((u: User) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary text-sm font-bold text-foreground">
                          {u.name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-foreground">{u.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">ID #{u.id}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                    <TableCell>{getRoleBadge(u.role_id)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditing(u);
                            setForm({ name: u.name, email: u.email, password: '', role_id: u.role_id.toString(), image: null });
                            setOpen(true);
                          }}
                          className="h-8 w-8 text-muted-foreground"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={deleteUser.isPending}
                          onClick={() => deleteUser.mutateAsync(u.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                          {deleteUser.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Edit User' : 'Create New User'}
            </DialogTitle>
            <DialogDescription>
              {editing ? 'Update user information and permissions.' : 'Create a new account for your system.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={submit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="John Doe"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="john@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Password {!editing && <span className="text-red-500">*</span>}</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={editing ? 'Leave blank to keep current' : 'Enter secure password'}
                required={!editing}
              />
            </div>
            <div className="space-y-2">
              <Label>User Role</Label>
              <Select
                value={form.role_id}
                onChange={(e) => setForm({ ...form, role_id: e.target.value })}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="1">Administrator</option>
                <option value="2">Manager</option>
                <option value="3">Staff</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Profile Image (Optional)</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setForm({ ...form, image: e.target.files?.[0] || null })}
                className="cursor-pointer"
              />
              {form.image && <p className="text-xs text-muted-foreground">Selected: {form.image.name}</p>}
            </div>

            <DialogFooter className="pt-4 mt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createUser.isPending || updateUser.isPending}>
                {createUser.isPending || updateUser.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                {editing ? 'Update User' : 'Create User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}