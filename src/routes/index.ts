import express from 'express';
import { UserRoutes } from '../modules/user/user.route';
import { AuthRoutes } from '../modules/auth/auth.routes';
import { AdminRoutes } from '../modules/admin/admin.routes';

import { PersonalizedJourneyRoute } from '../modules/_personalizeJourney/personalizeJourney/personalizeJourney.route';
import { DailyCycleInsightsRoute } from '../modules/dailyCycleInsights/dailyCycleInsights.route';
import { FertieRoute } from '../modules/fertie/fertie.route';

// import { ChatRoutes } from '../modules/chat/chat.routes';
// import { MessageRoutes } from '../modules/message/message.routes';
const router = express.Router();

const apiRoutes = [
  {
    path: '/auth',
    route: AuthRoutes,
  },
  {
    path: '/user',
    route: UserRoutes,
  },
  {
    path: '/admin',
    route: AdminRoutes,
  },

  ////////////////////// Created By Mohammad Sheakh

  { // 🌀
    path: '/personalized-journey',
    route: PersonalizedJourneyRoute,
  },
  { // 🌀
    path: '/daily-cycle-insights',
    route: DailyCycleInsightsRoute,
  },
  { // 🌀
    path: '/fertie',
    route: FertieRoute,
  },

];

apiRoutes.forEach(route => router.use(route.path, route.route));

export default router;
