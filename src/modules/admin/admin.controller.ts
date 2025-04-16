// admin.controller.ts
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../shared/catchAsync';
import sendResponse from '../../shared/sendResponse';
import { AdminService } from './admin.service';
import ApiError from '../../errors/ApiError';

const uploadCsvUsersFromNewUserModel = catchAsync(async (req, res) => {
  const file = req.file;

  if (!file) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'No file uploaded');
  }

  const result = await AdminService.processCsvFile(file);

  // If all records are invalid, return an error
  if (result.invalidCount === result.successCount) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'All records in the CSV file are invalid.'
    );
  }

  // Success response with details of the uploaded users and invalid rows
  sendResponse(res, {
    code: StatusCodes.OK,
    message: 'CSV processing completed.',
    data: {
      successCount: result.successCount,
      invalidCount: result.invalidCount,
      invalidData: result.invalidData, // Provide invalid rows and their error messages
    },
  });
});

export const AdminController = {
  uploadCsvUsersFromNewUserModel,
};
