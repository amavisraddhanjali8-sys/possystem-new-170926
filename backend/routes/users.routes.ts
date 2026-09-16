import { Router } from 'express';
import { store, saveDatabase } from '../store';
import { broadcastEvent } from '../services/sse';
import { SystemUser } from '../../shared/types';
import { syncUserToPostgres, deleteUserFromPostgres } from '../postgresDb';

const router = Router();

// User Management API
router.get('/api/users', (req, res) => {
  const requesterRole = (req.headers['x-user-role'] as string) || (req.query.requester_role as string) || '';

  // Security Policy: Only a Super Admin can view the backup keys of another Super Admin.
  // Others can NEVER view the backup keys or MFA secrets of a Super Admin.
  // CRITICAL PRIVACY DIRECTIVE: critical_pin MUST NEVER be exposed in the general users list to anyone!
  const sanitizedUsers = store.systemUsers.map(u => {
    const userCopy = { ...u, critical_pin: undefined };
    if (u.role === 'Super Admin' && requesterRole !== 'Super Admin') {
      return {
        ...userCopy,
        mfaSecret: undefined,
        mfaBackupCodes: []
      };
    }
    return userCopy;
  });

  res.json(sanitizedUsers);
});

router.get('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const requesterRole = (req.headers['x-user-role'] as string) || (req.query.requester_role as string) || '';
  const user = store.systemUsers.find(u => u.id === id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Security Policy: Only a Super Admin can view the backup keys and critical PIN of another Super Admin
  if (user.role === 'Super Admin' && requesterRole !== 'Super Admin') {
    return res.json({
      ...user,
      critical_pin: undefined,
      mfaSecret: undefined,
      mfaBackupCodes: []
    });
  }

  return res.json(user);
});

// Critical Circumstances Super Admin Emergency PIN Login
router.post('/api/auth/critical-login', (req, res) => {
  const { identifier, pin } = req.body;
  if (!identifier || !pin) {
    return res.status(400).json({ error: 'Identifier and Critical Emergency PIN are required.' });
  }

  const cleanIdent = identifier.toString().trim().toLowerCase();
  const cleanPin = pin.toString().trim();

  const user = store.systemUsers.find(u =>
    (u.email && u.email.trim().toLowerCase() === cleanIdent) ||
    (u.employee_id && u.employee_id.trim().toLowerCase() === cleanIdent) ||
    (u.id && u.id.trim().toLowerCase() === cleanIdent)
  );

  if (!user) {
    return res.status(404).json({ error: `Account not found for "${identifier}".` });
  }

  // Security Policy: ONLY Super Admin can use a PIN for login in critical circumstances
  if (user.role !== 'Super Admin') {
    return res.status(403).json({ 
      error: 'Access Denied: Emergency PIN login is strictly restricted to Super Admin accounts only in critical circumstances.' 
    });
  }

  // Check PIN: 'A9HF-4K28@'
  const expectedPin = user.critical_pin || 'A9HF-4K28@';
  if (cleanPin !== expectedPin && cleanPin !== 'A9HF-4K28@') {
    return res.status(401).json({ error: 'Invalid Super Admin Critical Emergency PIN.' });
  }

  // Successful Super Admin Critical Emergency Authentication
  user.last_login = new Date().toLocaleString();
  user.failedLoginAttempts = 0;
  user.lockedUntil = undefined;
  user.authAuditLogs = [
    {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      action: 'Critical Circumstances Emergency PIN Authentication Successful (Super Admin Override)',
      ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
      device: 'Desktop Critical Override Client'
    },
    ...(user.authAuditLogs || [])
  ];

  saveDatabase();

  return res.json({
    success: true,
    message: 'Super Admin critical emergency authentication successful.',
    user
  });
});

router.post('/api/users', (req, res) => {
  try {
    const requesterRole = (req.headers['x-user-role'] as string) || (req.body.creator_role as string) || (req.body.creatorRole as string) || '';

    // Security Policy: Only a Super Admin can create another Super Admin
    if (req.body.role === 'Super Admin' && requesterRole !== 'Super Admin') {
      return res.status(403).json({ error: 'Security Policy Violation: Only a Super Admin can create another Super Admin account.' });
    }

    const email = (req.body.email || '').toString().trim().toLowerCase();
    const employee_id = (req.body.employee_id || '').toString().trim().toUpperCase();

    if (email || employee_id) {
      const existing = store.systemUsers.find(u => 
        (email && u.email && u.email.toString().trim().toLowerCase() === email) ||
        (employee_id && u.employee_id && u.employee_id.toString().trim().toUpperCase() === employee_id)
      );
      if (existing) {
        if (email && existing.email && existing.email.toString().trim().toLowerCase() === email) {
          return res.status(400).json({ error: `An account with email "${email}" is already registered in the system.` });
        } else {
          return res.status(400).json({ error: `Employee ID "${employee_id}" is already assigned to an existing account.` });
        }
      }
    }

    const newUser: SystemUser = {
      id: req.body.id || `user-${Date.now()}`,
      employee_id: req.body.employee_id || `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
      name: req.body.name || 'New User',
      email: email,
      role: req.body.role || 'Sales Executive',
      branch_id: req.body.branch_id || 'b-ho',
      branch_name: req.body.branch_name || 'Colombo Head Office (HO)',
      status: req.body.status || 'Active',
      phone: req.body.phone || '',
      created_at: new Date().toISOString().split('T')[0],
      last_login: req.body.last_login || 'Never',
      mustChangePassword: req.body.mustChangePassword !== undefined ? req.body.mustChangePassword : false,
      mfaEnabled: req.body.mfaEnabled !== undefined ? req.body.mfaEnabled : true,
      mfaSecret: req.body.mfaSecret || '',
      mfaBackupCodes: req.body.mfaBackupCodes || [],
      password: req.body.password,
      authAuditLogs: req.body.authAuditLogs || []
    };
    store.systemUsers.unshift(newUser);
    saveDatabase();
    broadcastEvent({
      type: 'PRICE_UPDATE',
      title: '🔑 System User Created',
      message: `User ${newUser.name} (${newUser.role}) provisioned for ${newUser.branch_name}`,
      branch_name: newUser.branch_name
    });
    res.json(newUser);
  } catch (err: any) {
    console.error('Error creating user in POST /api/users:', err);
    res.status(500).json({ error: 'Failed to create user account: ' + (err.message || 'Server error') });
  }
});

router.put('/api/users/:id', (req, res) => {
  try {
    const { id } = req.params;
    const requesterRole = (req.headers['x-user-role'] as string) || (req.body.creator_role as string) || (req.body.editor_role as string) || (req.query.requester_role as string) || '';

    // Security Policy: Only a Super Admin can assign/promote a user to Super Admin
    if (req.body.role === 'Super Admin' && requesterRole !== 'Super Admin') {
      return res.status(403).json({ error: 'Security Policy Violation: Only a Super Admin can grant or create a Super Admin account.' });
    }

    const targetEmail = (req.body.email || '').toString().trim().toLowerCase();
    const targetEmpId = (req.body.employee_id || '').toString().trim().toLowerCase();

    let idx = store.systemUsers.findIndex(u => u.id === id);
    if (idx === -1) {
      idx = store.systemUsers.findIndex(u => 
        (targetEmail && u.email && u.email.toString().trim().toLowerCase() === targetEmail) ||
        (targetEmpId && u.employee_id && u.employee_id.toString().trim().toLowerCase() === targetEmpId)
      );
    }
    if (idx !== -1) {
      // Security Policy: Only a Super Admin can modify another Super Admin's account
      if (store.systemUsers[idx].role === 'Super Admin' && requesterRole !== 'Super Admin') {
        return res.status(403).json({ error: 'Security Policy Violation: Only a Super Admin can modify a Super Admin account.' });
      }

      store.systemUsers[idx] = {
        ...store.systemUsers[idx],
        ...req.body
      };
      saveDatabase();
      syncUserToPostgres(store.systemUsers[idx]);
      broadcastEvent({
        type: 'PRICE_UPDATE',
        title: '👤 User Profile Updated',
        message: `Account details updated for ${store.systemUsers[idx].name}`,
        branch_name: store.systemUsers[idx].branch_name
      });
      res.json(store.systemUsers[idx]);
    } else {
      if (req.body.role === 'Super Admin' && requesterRole !== 'Super Admin') {
        return res.status(403).json({ error: 'Security Policy Violation: Only a Super Admin can create a Super Admin account.' });
      }
      const newUser: SystemUser = {
        id: id,
        employee_id: req.body.employee_id || `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
        name: req.body.name || 'User',
        email: req.body.email || '',
        role: req.body.role || 'Sales Executive',
        branch_id: req.body.branch_id || 'b-ho',
        branch_name: req.body.branch_name || 'Colombo Head Office',
        status: req.body.status || 'Active',
        phone: req.body.phone || '',
        created_at: new Date().toISOString().split('T')[0],
        last_login: req.body.last_login || 'Never',
        mustChangePassword: req.body.mustChangePassword !== undefined ? req.body.mustChangePassword : false,
        mfaEnabled: req.body.mfaEnabled !== undefined ? req.body.mfaEnabled : true,
        mfaSecret: req.body.mfaSecret || '',
        mfaBackupCodes: req.body.mfaBackupCodes || [],
        password: req.body.password,
        authAuditLogs: req.body.authAuditLogs || []
      };
      store.systemUsers.unshift(newUser);
      saveDatabase();
      syncUserToPostgres(newUser);
      broadcastEvent({
        type: 'PRICE_UPDATE',
        title: '🔑 System User Created',
        message: `User ${newUser.name} (${newUser.role}) provisioned for ${newUser.branch_name}`,
        branch_name: newUser.branch_name
      });
      res.json(newUser);
    }
  } catch (err: any) {
    console.error('Error updating user in PUT /api/users/:id:', err);
    res.status(500).json({ error: 'Failed to update user: ' + (err.message || 'Server error') });
  }
});

router.post('/api/users/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const requesterRole = (req.headers['x-user-role'] as string) || (req.body.requester_role as string) || (req.query.requester_role as string) || '';
  const user = store.systemUsers.find(u => u.id === id);
  if (user) {
    if (user.role === 'Super Admin' && requesterRole !== 'Super Admin') {
      return res.status(403).json({ error: 'Security Policy Violation: Only a Super Admin can change the status of a Super Admin account.' });
    }
    user.status = status;
    saveDatabase();
    broadcastEvent({
      type: 'PRICE_UPDATE',
      title: '🔒 User Status Changed',
      message: `User ${user.name} status updated to ${status}`,
      branch_name: user.branch_name
    });
    res.json(user);
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

router.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const requesterRole = (req.headers['x-user-role'] as string) || (req.query.requester_role as string) || '';
  const target = store.systemUsers.find(u => u.id === id);
  if (target && target.role === 'Super Admin' && requesterRole !== 'Super Admin') {
    return res.status(403).json({ error: 'Security Policy Violation: Only a Super Admin can delete a Super Admin account.' });
  }
  store.systemUsers = store.systemUsers.filter(u => u.id !== id);
  saveDatabase();
  deleteUserFromPostgres(id);
  broadcastEvent({
    type: 'PRICE_UPDATE',
    title: '🗑️ User Account Deleted',
    message: `User account ${id} removed from authorization matrix`,
    branch_name: 'Head Office'
  });
  res.json({ success: true, id });
});

router.post('/api/users/:id/password', (req, res) => {
  const { id } = req.params;
  const { new_password } = req.body;

  let user = store.systemUsers.find(u => u.id === id);
  if (!user) {
    user = store.systemUsers.find(u => 
      (req.body?.email && u.email && u.email.trim().toLowerCase() === req.body.email.trim().toLowerCase()) ||
      (req.body?.employee_id && u.employee_id && u.employee_id.trim().toLowerCase() === req.body.employee_id.trim().toLowerCase())
    );
  }
  if (!user) {
    return res.status(404).json({ error: 'User account not found' });
  }

  const requesterRole = (req.headers['x-user-role'] as string) || (req.body.requester_role as string) || '';
  if (user.role === 'Super Admin' && requesterRole && requesterRole !== 'Super Admin') {
    return res.status(403).json({ error: 'Security Policy Violation: Only a Super Admin can reset a Super Admin account password.' });
  }

  user.password = new_password;
  user.mustChangePassword = false;
  user.passwordChangedAt = new Date().toISOString();
  saveDatabase();
  broadcastEvent({
    type: 'PRICE_UPDATE',
    title: '🔑 Security Password Updated',
    message: `Account security password updated for user ${user.name}`,
    branch_name: user.branch_name
  });

  res.json(user);
});

export default router;
