import { Router } from 'express';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController';
import FilesController from '../controllers/FilesController';

const addRoutes = (app) => {
  const router = Router();
  app.use('/', router);

  // checks the status of the databases and stats
  router.get('/status', (req, res) => AppController.getStatus(req, res));
  router.get('/stats', (req, res) => AppController.getStats(req, res));

  // creates new user, and token auth
  router.post('/users', (req, res) => UsersController.postNew(req, res));
  router.get('/users/me', (req, res) => UsersController.getMe(req, res));

  // sign in and out
  router.get('/connect', (req, res) => AuthController.getConnect(req, res));
  router.get('/disconnect', (req, res) => AuthController.getDisconnect(req, res));

  // upload files
  router.post('/files', (req, res) => FilesController.postUpload(req, res));

  // get a particular file or get a pagination of files
  router.get('/files/:id', (req, res) => FilesController.getShow(req, res));
  router.get('/files', (req, res) => FilesController.getIndex(req, res));

  // make a file public or not
  router.put('/files/:id/publish', (req, res) => FilesController.putPublish(req, res));
  router.put('/files/:id/unpublish', (req, res) => FilesController.putUnpublish(req, res));

  // get file from the server
  router.get('/files/:id/data', (req, res) => FilesController.getFile(req, res))
};

module.exports = addRoutes;
