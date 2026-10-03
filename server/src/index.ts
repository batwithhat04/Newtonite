import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

// Simulated Authentication Middleware
// In a real app, this would verify a token. Here we just take the user ID from a header for simplicity of the challenge.
const authenticate = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const userId = req.headers['x-user-id'];
  if (!userId || typeof userId !== 'string') {
    return res.status(401).json({ error: 'Unauthorized. Provide x-user-id header.' });
  }
  req.userId = userId;
  next();
};

// Extend Express Request to include userId
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

// Routes
// 1. Get all work items
app.get('/api/work-items', authenticate, async (req, res) => {
  try {
    const items = await prisma.workItem.findMany({
      include: {
        assignedTo: true,
      },
      orderBy: { updatedAt: 'desc' }
    });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch work items' });
  }
});

// 2. Get a single work item with history
app.get('/api/work-items/:id', authenticate, async (req, res) => {
  try {
    const item = await prisma.workItem.findUnique({
      where: { id: req.params.id },
      include: {
        assignedTo: true,
        events: {
          include: { user: true },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch work item' });
  }
});

// 3. Create a work item
app.post('/api/work-items', authenticate, async (req, res) => {
  const { title, description, priority } = req.body;
  try {
    const newItem = await prisma.$transaction(async (tx) => {
      const item = await tx.workItem.create({
        data: {
          title,
          description,
          priority: priority || 'NORMAL',
          status: 'OPEN',
        }
      });
      
      await tx.workItemEvent.create({
        data: {
          workItemId: item.id,
          userId: req.userId!,
          type: 'CREATED',
          payload: JSON.stringify({ title, description, priority })
        }
      });
      
      return item;
    });
    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create work item' });
  }
});

// 4. Update a work item (with OCC and history)
app.put('/api/work-items/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const { title, description, status, priority, assignedToId, version } = req.body;
  
  if (version === undefined) {
    return res.status(400).json({ error: 'Version is required for updates' });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const currentItem = await tx.workItem.findUnique({ where: { id } });
      if (!currentItem) throw new Error('NOT_FOUND');
      
      if (currentItem.version !== version) {
        throw new Error('CONFLICT');
      }
      
      const updatedItem = await tx.workItem.update({
        where: { id },
        data: {
          title,
          description,
          status,
          priority,
          assignedToId,
          version: { increment: 1 }
        },
        include: { assignedTo: true }
      });
      
      // Determine what changed for the event log
      const changes: Record<string, any> = {};
      if (currentItem.title !== updatedItem.title) changes.title = { from: currentItem.title, to: updatedItem.title };
      if (currentItem.description !== updatedItem.description) changes.description = { from: currentItem.description, to: updatedItem.description };
      if (currentItem.status !== updatedItem.status) changes.status = { from: currentItem.status, to: updatedItem.status };
      if (currentItem.priority !== updatedItem.priority) changes.priority = { from: currentItem.priority, to: updatedItem.priority };
      if (currentItem.assignedToId !== updatedItem.assignedToId) changes.assignedToId = { from: currentItem.assignedToId, to: updatedItem.assignedToId };
      
      if (Object.keys(changes).length > 0) {
        await tx.workItemEvent.create({
          data: {
            workItemId: id,
            userId: req.userId!,
            type: 'UPDATED',
            payload: JSON.stringify(changes)
          }
        });
      }
      
      return updatedItem;
    });
    
    res.json(result);
  } catch (error: any) {
    if (error.message === 'NOT_FOUND') return res.status(404).json({ error: 'Not found' });
    if (error.message === 'CONFLICT') return res.status(409).json({ error: 'Conflict: The item has been modified by someone else.' });
    res.status(500).json({ error: 'Failed to update work item' });
  }
});

// 5. Add a comment (event)
app.post('/api/work-items/:id/comments', authenticate, async (req, res) => {
  const { id } = req.params;
  const { comment } = req.body;
  
  if (!comment) return res.status(400).json({ error: 'Comment is required' });
  
  try {
    const event = await prisma.workItemEvent.create({
      data: {
        workItemId: id,
        userId: req.userId!,
        type: 'COMMENTED',
        payload: JSON.stringify({ comment })
      },
      include: { user: true }
    });
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// 6. Get all users (for assignment UI)
app.get('/api/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: { team: true }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Seed some initial data if empty
app.post('/api/seed', async (req, res) => {
  const userCount = await prisma.user.count();
  if (userCount === 0) {
    const team1 = await prisma.team.create({ data: { name: 'Engineering' } });
    const team2 = await prisma.team.create({ data: { name: 'Support' } });
    
    await prisma.user.createMany({
      data: [
        { name: 'Alice Smith', email: 'alice@example.com', teamId: team1.id },
        { name: 'Bob Jones', email: 'bob@example.com', teamId: team1.id },
        { name: 'Charlie Davis', email: 'charlie@example.com', teamId: team2.id },
      ]
    });
    res.json({ message: 'Seeded initial data' });
  } else {
    res.json({ message: 'Already seeded' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
