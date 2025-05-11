// src/socket/middleware/authSocketMiddleware.ts
import { Socket } from 'socket.io';
import colors from 'colors';

import { logger } from '../shared/logger';

export const authSocketMiddleware = (
  socket: Socket,
  next: (err?: Error) => void
) => {
  try {
    const token =
      socket.handshake.headers.token ||
      socket.handshake.headers.authorization ||
      socket.handshake.auth.token;

    if (!token) {
      logger.error(colors.red('No authentication token provided'));
      return next(new Error('Authentication error: No token provided'));
    }

    const userData = getUserData(token as string);

    if (!userData || !userData.id) {
      logger.error(colors.red('Invalid authentication token'));
      return next(new Error('Authentication error: Invalid token'));
    }

    // Attach user data to socket
    socket.userId = userData.id;
    logger.info(colors.green(`User ${userData.id} authenticated via socket`));

    next();
  } catch (error) {
    logger.error(colors.red(`Socket authentication error: ${error}`));
    next(new Error('Internal authentication error'));
  }
};
