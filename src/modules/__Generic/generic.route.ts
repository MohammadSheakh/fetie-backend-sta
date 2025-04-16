import express from 'express';
import { validateFiltersForQuery } from '../../middlewares/queryValidation/paginationQueryValidationMiddleware';

export class createGenericRoutes <T> {
  controller: any;
  router = express.Router();

  constructor(controller: any ) {
    this.controller = controller;

  }

  // GET /paginate (with pagination and filters)
  // router.route('/paginate').get(
  //   validateFiltersForQuery(optionValidationChecking<T>(queryArray))),
  //   controller.getAllWithPagination
  // )

  // GET / (get all items)
  getAll = this.router.route('/').get(this.controller.getAll);

  // POST /create (create an item)
  create = this.router.route('/create').post(this.controller.create);


};