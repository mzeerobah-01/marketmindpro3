import { Router, Request, Response } from 'express';
import { currentAuthConfig, updateAuthConfig } from '../config/authConfig';

export const authRouter = Router();

// In-memory active tokens (in production, tokens can use JWT or session store)
const activeSessions = new Set<string>();

// Generate simple secure session token
function generateToken(email: string): string {
  const timestamp = Date.now();
  const randomSalt = Math.random().toString(36).substring(2, 15);
  const raw = `${email}_${timestamp}_${randomSalt}`;
  return Buffer.from(raw).toString('base64');
}

// POST /api/auth/login
authRouter.post('/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
      });
    }

    const inputEmail = email.trim().toLowerCase();
    const targetEmail = currentAuthConfig.email.toLowerCase();

    // Check credentials against configured auth
    if (inputEmail !== targetEmail || password !== currentAuthConfig.passwordHash) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password. Access denied.',
      });
    }

    // Login successful
    const token = generateToken(inputEmail);
    activeSessions.add(token);

    currentAuthConfig.lastLogin = Date.now();

    return res.json({
      success: true,
      token,
      user: {
        id: currentAuthConfig.id,
        email: currentAuthConfig.email,
        name: currentAuthConfig.name,
        role: currentAuthConfig.role,
        lastLogin: currentAuthConfig.lastLogin,
      },
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || 'Authentication error',
    });
  }
});

// GET /api/auth/session
authRouter.get('/session', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token || !activeSessions.has(token)) {
    return res.status(401).json({
      success: false,
      authenticated: false,
      error: 'Session expired or invalid',
    });
  }

  return res.json({
    success: true,
    authenticated: true,
    user: {
      id: currentAuthConfig.id,
      email: currentAuthConfig.email,
      name: currentAuthConfig.name,
      role: currentAuthConfig.role,
      lastLogin: currentAuthConfig.lastLogin,
    },
  });
});

// POST /api/auth/logout
authRouter.post('/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (token) {
    activeSessions.delete(token);
  }

  return res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

// PUT /api/auth/update-credentials (allows modifying email/password later)
authRouter.put('/update-credentials', (req: Request, res: Response) => {
  try {
    const { currentPassword, newEmail, newPassword, newName } = req.body;

    if (currentPassword !== currentAuthConfig.passwordHash) {
      return res.status(403).json({
        success: false,
        error: 'Current password verification failed',
      });
    }

    const updated = updateAuthConfig(newEmail, newPassword, newName);

    return res.json({
      success: true,
      message: 'Credentials updated successfully',
      user: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        role: updated.role,
      },
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to update credentials',
    });
  }
});
