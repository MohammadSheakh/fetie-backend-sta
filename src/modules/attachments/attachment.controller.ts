import catchAsync from '../../shared/catchAsync';
import sendResponse from '../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';
import pick from '../../shared/pick';
import { Attachment } from './attachment.model';
import { AttachmentService } from './attachment.service';
import { FolderName } from '../../enums/folderNames';
import ApiError from '../../errors/ApiError';

import { NotificationService } from '../notification/notification.services';

const attachmentService = new AttachmentService();

//[🚧][🧑‍💻✅][🧪🆗]
const createAttachment = catchAsync(async (req, res) => {
  
  let attachments = [];

  if (req.files && req.files.attachments) {
    attachments.push(
      ...(await Promise.all(
        req.files.attachments.map(async (file: Express.Multer.File) => {
          const attachmentId = await attachmentService.uploadSingleAttachment(
            file,
            "folderNameSuplify",
            req.user,
            req.body.attachedToId,
            req.body.attachedToType
          );
          return attachmentId;
        })
      ))
    );
  }

  /*

  // TODO : notification er title ta change kora lagte pare ..
  // Save Notification to Database
  const notificationPayload = {
    title: `New attachment has been uploaded  by ${req.user.userName}`,
    // message: `A new task "${result.title}" has been created by `,
    receiverId: null, //TODO : obosshoi id pass korte hobe
    role: UploaderRole.projectSupervisor, // If receiver is the projectManager
    // linkId: result._id, // FIXME  // TODO : attachment related notifiation e click korle .. kothay niye jabe ?
  };

  const notification = await NotificationService.addNotification(
    notificationPayload
  );

  // 3️⃣ Send Real-Time Notification using Socket.io
  io.to(projectNameAndSuperVisorId.projectSuperVisorId.toString()).emit(
    'newNotification',
    {
      code: StatusCodes.OK,
      message: 'New notification',
      data: notification,
    }
  );

  */

  // }

  const result = await attachmentService.create(req.body);

  sendResponse(res, {
    code: StatusCodes.OK,
    data: null,
    message: 'Attachment created successfully',
    success: true,
  });
});

const getAAttachment = catchAsync(async (req, res) => {
  const result = await attachmentService.getById(req.params.attachmentId);
  sendResponse(res, {
    code: StatusCodes.OK,
    data: result,
    message: 'Project retrieved successfully',
    success: true,
  });
});

const getAllAttachment = catchAsync(async (req, res) => {
  const result = await attachmentService.getAll();
  sendResponse(res, {
    code: StatusCodes.OK,
    data: result,
    message: 'All projects',
    success: true,
  });
});

const getAllAttachmentWithPagination = catchAsync(async (req, res) => {
  const filters = pick(req.query, ['projectName', '_id']);
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);

  const result = await attachmentService.getAllWithPagination(filters, options);

  sendResponse(res, {
    code: StatusCodes.OK,
    data: result,
    message: 'All projects with Pagination',
    success: true,
  });
});

const updateById = catchAsync(async (req, res) => {
  const result = await attachmentService.updateById(
    req.params.attachmentId,
    req.body
  );
  sendResponse(res, {
    code: StatusCodes.OK,
    data: result,
    message: 'Project updated successfully',
    success: true,
  });
});

//[🚧][🧑‍💻✅][🧪🆗]

const deleteById = catchAsync(async (req, res) => {
  const attachment = await attachmentService.getById(req.params.attachmentId);
  if (!attachment) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Attachment not found');
  }
  let results;

  if (req.user.role == attachment.uploaderRole) {
    if (attachment.attachedToType == 'project') {
      // taile amra just attachment  delete korbo
      results = await attachmentService.deleteById(req.params.attachmentId);
    } else if (attachment.attachedToType == 'note') {
      const note = await noteService.getById(attachment.attachedToId);
      note.attachments = note.attachments.filter(
        attachmentId => attachmentId._id.toString() !== req.params.attachmentId
      );
      const result = await noteService.updateById(note._id, note);
      if (result) {
        results = await attachmentService.deleteById(req.params.attachmentId);
      }
    }
    // TODO :  task er jonno kaj korte hobe ...
  } else {
    throw new ApiError(
      StatusCodes.UNAUTHORIZED,
      'You are not authorized to delete this attachment'
    );
  }

  // await attachmentService.deleteById(req.params.attachmentId);
  sendResponse(res, {
    code: StatusCodes.OK,
    message: 'Project deleted successfully',
    data: results,
    success: true,
  });
});

const addOrRemoveReact = catchAsync(async (req, res) => {
  const { attachmentId } = req.params;
  // const { reactionType } = req.body;
  const { userId } = req.user;

  // FIX ME : FiX korte hobe
  const result = await attachmentService.addOrRemoveReact(attachmentId, userId);

  console.log('result 🟢', result);

  sendResponse(res, {
    code: StatusCodes.OK,
    data: result,
    message: 'React successfully',
    success: true,
  });
});

export const AttachmentController = {
  createAttachment,
  getAllAttachment,
  getAllAttachmentWithPagination,
  getAAttachment,
  updateById,
  deleteById,
  addOrRemoveReact,
};
