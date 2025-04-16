// admin.service.ts
import csvParser from 'csv-parser';
import fs from 'fs';
import { User } from '../user/user.model';
import { sendWelcomeEmail } from '../../helpers/emailService';
import { ICsvRow } from '../user/user.interface';
import { TCurrentStatus, TProfileVisibility, TUserStatus, UserCurrentStatus, UserStatus, UserVisibility } from '../user/user.constant';

const processCsvFile = async (file: Express.Multer.File): Promise<{
  successCount: number;
  invalidCount: number;
  invalidData: { row: ICsvRow; errors: string[] }[];
}> => {
  const usersData: ICsvRow[] = [];
  const invalidData: { row: ICsvRow; errors: string[] }[] = [];

  const stream = fs
    .createReadStream(file.path)
    .pipe(csvParser())
    .on('data', async (row: ICsvRow) => {
      const { isValid, errors } = validateCsvRow(row);

      if (isValid) {
        usersData.push(row);
      } else {
        invalidData.push({ row, errors });
      }
    });

  // Wait for CSV parsing to finish
  await new Promise((resolve, reject) => {
    stream.on('end', resolve);
    stream.on('error', reject);
  });

  // Insert valid users into the database and send emails
  const userPromises = usersData.map(async (userData) => {
    try {
      const defaultPassword = '12345678';

      const user = new User({
        first_name: userData.first_name,
        last_name: userData.last_name,
        email: userData.email,
        branch: userData.branch,
        current_status: userData.current_status,
        instagram: userData.instagram,
        visibility: userData.visibility,
        description: userData.description,
        phone: userData.phone,
        secondary_email: userData.secondary_email,
        approved: userData.approved === 'true',
        matched_with_instagram: userData.matched_with_instagram === 'true',
        role: userData.mentee_status ? 'mentee' : 'mentor',
        password: defaultPassword,
        isEmailVerified: true,
      });

      await user.save();
      await sendWelcomeEmail(user.email, defaultPassword);
    } catch (error) {
      console.error('Error inserting user:', error);
    }
  });

  await Promise.all(userPromises);

  return {
    successCount: usersData.length,
    invalidCount: invalidData.length,
    invalidData, // Return invalid rows with error messages
  };
};

const validateCsvRow = (row: ICsvRow): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Perform basic validation for required fields
  if (!row.first_name) errors.push('First name is required');
  if (!row.last_name) errors.push('Last name is required');
  if (!row.email) errors.push('Email is required');
  if (!row.current_status) errors.push('Current status is required');

  // Ensure email is in a valid format
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  if (row.email && !emailRegex.test(row.email)) {
    errors.push('Invalid email format');
  }

  // Validate role, status, current_status, and visibility
  if (row.role && !["admin", "user", "mentee", "mentor"].includes(row.role)) {
    errors.push(`Invalid role value: ${row.role}. Valid values are: admin, user, mentee, mentor`);
  }

  if (row.status && !UserStatus.includes(row.status as TUserStatus)) {
    errors.push(`Invalid status value: ${row.status}. Valid values are: ${UserStatus.join(', ')}`);
  }

  if (row.current_status && !UserCurrentStatus.includes(row.current_status as TCurrentStatus)) {
    errors.push(`Invalid current status value: ${row.current_status}. Valid values are: ${UserCurrentStatus.join(', ')}`);
  }

  if (row.visibility && !UserVisibility.includes(row.visibility as TProfileVisibility)) {
    errors.push(`Invalid visibility value: ${row.visibility}. Valid values are: ${UserVisibility.join(', ')}`);
  }

  // If there are any errors, the row is invalid
  const isValid = errors.length === 0;

  return { isValid, errors };
};

export const AdminService = {
  processCsvFile,
};
