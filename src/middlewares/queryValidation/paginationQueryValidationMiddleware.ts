
import { StatusCodes } from 'http-status-codes';
import sendResponse from '../../shared/sendResponse';
import { Request, Response, NextFunction } from 'express';

// validationMiddleware.js or a separate file for validation middleware
export const validateFiltersForQuery = <T> (allowedFilters: string[]) => {
  return (req: Request, res:Response, next:NextFunction) => {
    
    const filtersParam = req.query || ''; // Get filters query param

    // Filter out only the allowed filters from the req.query object
    const validFilters = Object.keys(filtersParam).reduce((acc, key) => {
      if (allowedFilters.includes(key)) {
        acc[key] = filtersParam[key];
      }else{
        sendResponse(res, {
          code: StatusCodes.BAD_REQUEST,
          message: `Valid filters are: ${allowedFilters}`,
          success: false,
        });
      }
      return acc;
    }, {});

    req.query = validFilters; // Update the req.query object with valid filters

    // Proceed to the next middleware or controller if validation passes
    next();
  };
};
