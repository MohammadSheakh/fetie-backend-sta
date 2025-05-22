import express from 'express';
import { UserRoutes } from '../modules/user/user.route';
import { AuthRoutes } from '../modules/auth/auth.routes';
import { AdminRoutes } from '../modules/admin/admin.routes';

import { PersonalizedJourneyRoute } from '../modules/_personalizeJourney/personalizeJourney/personalizeJourney.route';
import { DailyCycleInsightsRoute } from '../modules/_dailyCycleInsights/dailyCycleInsights/dailyCycleInsights.route';
import { FertieRoute } from '../modules/fertie/fertie.route';
import { ChatBotRoute } from '../modules/chatbot/chatbot.routes';
import { HelpMessageRoute } from '../modules/helpMessage/helpMessage.route';
import { LabRoute } from '../modules/lab/lab.route';
import { ConversationRoute } from '../modules/_chatting/conversation/conversation.route';
import { SubscriptionPlanRoute } from '../modules/_subscription/subscriptionPlan/subscriptionPlan.route';
import { NotificationRoutes } from '../modules/notification/notification.routes';
import { MessageRoute } from '../modules/_chatting/message/message.route';

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

  {
    // 🌀
    path: '/personalized-journey',
    route: PersonalizedJourneyRoute,
  },
  {
    // 🌀
    path: '/daily-cycle-insights',
    route: DailyCycleInsightsRoute,
  },
  {
    // 🌀
    path: '/fertie',
    route: FertieRoute,
  },
  {
    // 🌀
    path: '/chat',
    route: ChatBotRoute,
  },
  {
    // 🌀
    path: '/help-message',
    route: HelpMessageRoute,
  },
  {
    // 🌀
    path: '/lab',
    route: LabRoute,
  },
  {
    // 🌀
    path: '/conversation',
    route: ConversationRoute,
  },
  {
    // 🌀
    path: '/message',
    route : MessageRoute
  },
  {
    // 🌀
    path: '/subscription',
    route: SubscriptionPlanRoute,
  },
  {
    // 🌀
    path: '/notification',
    route: NotificationRoutes,
  },
];

apiRoutes.forEach(route => router.use(route.path, route.route));

export default router;
