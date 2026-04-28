import { Router, Request, Response } from 'express';
import { CreateAppDto, UpdateAppDto } from '../types.js';
import { getAllApps, getAppById, createApp, updateApp, deleteApp } from '../services/appsService.js';

const router = Router();

// GET /api/apps
router.get('/', (_req: Request, res: Response) => {
  res.json(getAllApps());
});

// GET /api/apps/:id
router.get('/:id', (req: Request, res: Response) => {
  const app = getAppById(req.params.id);
  if (!app) {
    res.status(404).json({ message: 'App not found' });
    return;
  }
  res.json(app);
});

// POST /api/apps
router.post('/', async (req: Request, res: Response) => {
  const body = req.body as Partial<CreateAppDto>;

  if (!body.url || typeof body.url !== 'string') {
    res.status(400).json({ message: 'url is required' });
    return;
  }

  const result = await createApp({ url: body.url, name: body.name, intervalHours: body.intervalHours });
  if ('error' in result) {
    res.status(result.status).json({ message: result.error });
    return;
  }
  res.status(201).json(result);
});

// PUT /api/apps/:id
router.put('/:id', async (req: Request, res: Response) => {
  const result = await updateApp(req.params.id, req.body as Partial<UpdateAppDto>);
  if (result === null) {
    res.status(404).json({ message: 'App not found' });
    return;
  }
  if ('error' in result) {
    res.status(result.status).json({ message: result.error });
    return;
  }
  res.json(result);
});

// DELETE /api/apps/:id
router.delete('/:id', (req: Request, res: Response) => {
  const deleted = deleteApp(req.params.id);
  if (!deleted) {
    res.status(404).json({ message: 'App not found' });
    return;
  }
  res.status(204).end();
});


export default router;
