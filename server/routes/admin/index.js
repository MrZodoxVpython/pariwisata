import { Router } from 'express';
import { requireAdmin, requireRole } from '../../middleware/admin.js';
import authRoutes from './auth.js';
import dashboardRoutes from './dashboard.js';
import bookingRoutes from './bookings.js';
import availabilityRoutes from './availability.js';
import messageRoutes from './messages.js';
import tourRoutes from './tours.js';
import pickupRoutes from './pickups.js';
import reviewRoutes from './reviews.js';
import guideRoutes from './guides.js';
import galleryRoutes from './gallery.js';
import mediaRoutes from './media.js';
import articleRoutes from './articles.js';
import faqRoutes from './faqs.js';
import policyRoutes from './policies.js';
import quizRoutes from './quiz.js';
import settingsRoutes from './settings.js';
import userRoutes from './users.js';
import auditRoutes from './auditLogs.js';
import reportRoutes from './reports.js';
import notificationRoutes, { dispatchHandler } from './notifications.js';

const router = Router();
const manager = requireRole('owner', 'manager');
const owner = requireRole('owner');

// Public: sign-in only.
router.use('/auth', authRoutes);

// Cron / manual notification dispatch (checks its own secret or admin auth).
router.post('/notifications/dispatch', dispatchHandler);
router.get('/notifications/dispatch', dispatchHandler);

// Everything below requires a signed-in admin (or the legacy admin token).
router.use(requireAdmin);

router.use('/dashboard', dashboardRoutes);
router.use('/bookings', bookingRoutes);
router.use('/messages', messageRoutes);

router.use('/availability', manager, availabilityRoutes);
router.use('/tours', manager, tourRoutes);
router.use('/pickups', manager, pickupRoutes);
router.use('/reviews', manager, reviewRoutes);
router.use('/guides', manager, guideRoutes);
router.use('/gallery', manager, galleryRoutes);
router.use('/media', manager, mediaRoutes);
router.use('/articles', manager, articleRoutes);
router.use('/faqs', manager, faqRoutes);
router.use('/policies', manager, policyRoutes);
router.use('/quiz', manager, quizRoutes);
router.use('/settings', manager, settingsRoutes);
router.use('/reports', manager, reportRoutes);
router.use('/notifications', manager, notificationRoutes);

router.use('/users', owner, userRoutes);
router.use('/audit', owner, auditRoutes);

export default router;