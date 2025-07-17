import colors from 'colors';
import { Server, Socket } from 'socket.io';
import { logger } from '../shared/logger';
import getUserDetailsFromToken from './getUesrDetailsFromToken';
import { User } from '../modules/user/user.model';

declare module 'socket.io' {
  interface Socket {
    userId?: string;
  }
}

const socketForNotification = (io: Server) => {
  // Better data structures for managing connections - MOVED INSIDE THE FUNCTION
  const onlineUsers = new Set<string>();
  const userSocketMap = new Map<string, string>(); // userId -> socketId
  const socketUserMap = new Map<string, string>(); // socketId -> userId

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || 
                   socket.handshake.headers.token as string;

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const user = await getUserDetailsFromToken(token);
      // console.log("user from socketForChat_V2_Claude -> ", user);
      if (!user) {
        return next(new Error('Invalid authentication token'));
      }

      // Attach user to socket
      socket.data.user = user;
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', async(socket: Socket) => {
    const user = socket.data.user as SocketUser;
    const userId = user._id;

    logger.info(colors.blue(`🔌🟢 User connected: :userId🔌: ${userId} :userName🔌: ${user.name} :socketId⚡💡: ${socket.id}`));

    try {
      // Get user profile once at connection
      const userProfile = await User.findById(userId, 'name profileImage'); // TODO : profileImage userModel theke check korte hobe .. 
      socket.data.userProfile = userProfile;

      /***********
       * 
       *   Update Online Status - FIXED TO USE DATA STRUCTURES
       * 
       * ********** */

      // Handle multiple connections from same user
      const existingSocketId = userSocketMap.get(userId);
      if (existingSocketId && existingSocketId !== socket.id) {
        // Disconnect previous socket for this user
        const existingSocket = io.sockets.sockets.get(existingSocketId);
        if (existingSocket) {
          existingSocket.disconnect(true);
        }
        // Clean up old mapping
        socketUserMap.delete(existingSocketId);
      }

      // Update all data structures
      onlineUsers.add(userId);
      userSocketMap.set(userId, socket.id);
      socketUserMap.set(socket.id, userId);

      // Emit updated online users list
      io.emit('online-users-updated', Array.from(onlineUsers));

      // Join user to their personal room for direct notifications
      socket.join(userId);

      
      

      /*************
       * 
       * Handle disconnection - FIXED TO PASS PARAMETERS
       * 
       * ************* */
      socket.on('disconnect', (reason) => {
        console.log(`User ${user.name} disconnected: ${reason}`);
        handleUserDisconnection(userId, socket.id, onlineUsers, userSocketMap, socketUserMap, io);
      });

    } catch(error) {
      console.error('Socket connection setup error:', error);
      emitError(socket, 'Connection setup failed', true);
    }
  });
};

// Helper function to handle user disconnection
const handleUserDisconnection = (
  userId: string,
  socketId: string,
  onlineUsers: Set<string>,
  userSocketMap: Map<string, string>,
  socketUserMap: Map<string, string>,
  io: Server
) => {
  logger.info(colors.red(`🔌🔴 User disconnected: :userId: ${userId} :socketId: ${socketId}`));
  
  // Clean up all data structures
  onlineUsers.delete(userId);
  userSocketMap.delete(userId);
  socketUserMap.delete(socketId);
  
  // Emit updated online users list
  io.emit('online-users-updated', Array.from(onlineUsers));
};

// Helper function to emit errors
function emitError(socket: any, message: string, disconnect: boolean = false) {
  socket.emit('io-error', {
    success: false,
    message,
    timestamp: new Date().toISOString()
  });
  if (disconnect) {
    socket.disconnect();
  }
}
export const socketHelper = { socketForNotification };
